import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CmsCopy, CmsCopyDocument } from './schemas/cms-copy.schema';
import { Currency, CurrencyDocument } from './schemas/currency.schema';
import {
  LegalDocument,
  LegalDocumentDocument,
} from './schemas/legal-document.schema';
import {
  SiteSetting,
  SiteSettingDocument,
} from './schemas/site-setting.schema';
import {
  WorkspaceTier,
  WorkspaceTierDocument,
} from './schemas/workspace-tier.schema';

const REGISTER_COPY_KEYS = [
  'headline',
  'subheadline',
  'googleTitle',
  'googleSubtitle',
  'tierSectionLabel',
  'consentPrefix',
  'consentSuffix',
  'rememberMeLabel',
  'signInLabel',
  'handshakeRedirect',
] as const;

@Injectable()
export class CmsService {
  constructor(
    @InjectModel(CmsCopy.name) private readonly copyModel: Model<CmsCopyDocument>,
    @InjectModel(Currency.name)
    private readonly currencyModel: Model<CurrencyDocument>,
    @InjectModel(WorkspaceTier.name)
    private readonly tierModel: Model<WorkspaceTierDocument>,
    @InjectModel(LegalDocument.name)
    private readonly legalModel: Model<LegalDocumentDocument>,
    @InjectModel(SiteSetting.name)
    private readonly settingModel: Model<SiteSettingDocument>,
  ) {}

  private async getCopyMap(pageKey: string, locale = 'en') {
    const rows = await this.copyModel
      .find({ pageKey, locale })
      .select('fieldKey value')
      .lean()
      .exec();
    return Object.fromEntries(rows.map((r) => [r.fieldKey, r.value]));
  }

  private parseBoolSetting(raw: string | null | undefined, fallback: boolean) {
    if (raw == null || raw === '') return fallback;
    const v = raw.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(v)) return true;
    if (['0', 'false', 'no', 'off'].includes(v)) return false;
    return fallback;
  }

  async getRegisterPage(locale = 'en') {
    const [copy, currency, tiers, legalDocs, rememberDefaultRow] =
      await Promise.all([
        this.getCopyMap('register', locale),
        this.currencyModel.findOne({ isDefault: true, isActive: true }).lean(),
        this.tierModel
          .find({ isActive: true })
          .sort({ sortOrder: 1 })
          .lean()
          .exec(),
        this.legalModel
          .find({ isActive: true, showOnRegister: true })
          .sort({ title: 1 })
          .select('slug title version summary')
          .lean()
          .exec(),
        this.settingModel.findOne({ key: 'auth.rememberMeDefault' }).lean(),
      ]);

    if (!currency) {
      throw new NotFoundException('We couldn’t load pricing right now.');
    }
    if (!tiers.length) {
      throw new NotFoundException('We couldn’t load workspace plans right now.');
    }
    if (!legalDocs.length) {
      throw new NotFoundException('We couldn’t load terms right now.');
    }

    for (const key of REGISTER_COPY_KEYS) {
      if (!copy[key]) {
        throw new NotFoundException(
          'We couldn’t load this page right now. Please try again.',
        );
      }
    }

    return {
      copy: {
        headline: copy.headline,
        subheadline: copy.subheadline,
        googleTitle: copy.googleTitle,
        googleSubtitle: copy.googleSubtitle,
        tierSectionLabel: copy.tierSectionLabel,
        consentPrefix: copy.consentPrefix,
        consentSuffix: copy.consentSuffix,
        rememberMeLabel: copy.rememberMeLabel,
        signInLabel: copy.signInLabel,
        handshakeRedirect: copy.handshakeRedirect,
      },
      rememberMe: {
        label: copy.rememberMeLabel,
        defaultChecked: this.parseBoolSetting(
          rememberDefaultRow?.value,
          false,
        ),
      },
      tiers: tiers.map((t) => ({
        code: t.code,
        name: t.name,
        description: t.description,
        badgeLabel: t.badgeLabel,
        badgeTone: t.badgeTone,
        isDefault: t.isDefault,
      })),
      legalLinks: legalDocs.map((d) => ({
        slug: d.slug,
        title: d.title,
        version: d.version,
        summary: d.summary,
        href: `/legal/${d.slug}`,
      })),
      currency: {
        code: currency.code,
        symbol: currency.symbol,
        name: currency.name,
      },
    };
  }

  async getLegalDocument(slug: string) {
    const doc = await this.legalModel
      .findOne({ slug, isActive: true })
      .lean()
      .exec();
    if (!doc) {
      throw new NotFoundException('This document isn’t available.');
    }
    return {
      slug: doc.slug,
      title: doc.title,
      summary: doc.summary,
      bodyMarkdown: doc.bodyMarkdown,
      version: doc.version,
      effectiveAt: doc.effectiveAt,
    };
  }

  async getDefaultCurrency() {
    const currency = await this.currencyModel
      .findOne({ isDefault: true, isActive: true })
      .lean()
      .exec();
    if (!currency) {
      throw new NotFoundException('We couldn’t load currency settings.');
    }
    return {
      code: currency.code,
      symbol: currency.symbol,
      name: currency.name,
      decimalPlaces: currency.decimalPlaces,
    };
  }

  async getSetting(key: string) {
    const row = await this.settingModel.findOne({ key }).lean().exec();
    return row?.value ?? null;
  }
}
