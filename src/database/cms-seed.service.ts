import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CmsCopy, CmsCopyDocument } from '../cms/schemas/cms-copy.schema';
import {
  ComplianceBadge,
  ComplianceBadgeDocument,
} from '../cms/schemas/compliance-badge.schema';
import { Currency, CurrencyDocument } from '../cms/schemas/currency.schema';
import {
  LatencyNode,
  LatencyNodeDocument,
} from '../cms/schemas/latency-node.schema';
import {
  LegalDocument,
  LegalDocumentDocument,
} from '../cms/schemas/legal-document.schema';
import {
  SiteSetting,
  SiteSettingDocument,
} from '../cms/schemas/site-setting.schema';
import {
  WorkspaceTier,
  WorkspaceTierDocument,
} from '../cms/schemas/workspace-tier.schema';

/**
 * Idempotent CMS bootstrap — all product copy/currency/legal live in flat rows.
 */
@Injectable()
export class CmsSeedService implements OnModuleInit {
  private readonly logger = new Logger(CmsSeedService.name);

  constructor(
    @InjectModel(Currency.name)
    private readonly currencyModel: Model<CurrencyDocument>,
    @InjectModel(CmsCopy.name) private readonly copyModel: Model<CmsCopyDocument>,
    @InjectModel(WorkspaceTier.name)
    private readonly tierModel: Model<WorkspaceTierDocument>,
    @InjectModel(LegalDocument.name)
    private readonly legalModel: Model<LegalDocumentDocument>,
    @InjectModel(ComplianceBadge.name)
    private readonly badgeModel: Model<ComplianceBadgeDocument>,
    @InjectModel(LatencyNode.name)
    private readonly latencyModel: Model<LatencyNodeDocument>,
    @InjectModel(SiteSetting.name)
    private readonly settingModel: Model<SiteSettingDocument>,
  ) {}

  async onModuleInit() {
    await this.ensureSeeded();
  }

  async ensureSeeded() {
    await this.seedCurrency();
    await this.seedRegisterCopy();
    await this.seedTiers();
    await this.seedLegal();
    await this.seedBadges();
    await this.seedLatency();
    await this.seedSettings();
    this.logger.log('CMS seed ensured (flat collections)');
  }

  private async seedCurrency() {
    await this.currencyModel.updateOne(
      { code: 'NGN' },
      {
        $set: {
          code: 'NGN',
          symbol: '₦',
          name: 'Nigerian Naira',
          decimalPlaces: 2,
          isDefault: true,
          isActive: true,
        },
      },
      { upsert: true },
    );
  }

  private async seedRegisterCopy() {
    const registerCopy: Record<string, string> = {
      securityLevelLabel: 'SEC-LEVEL: UNVERIFIED // NEW OPERATOR',
      nodeLabel: 'NODE: LOS-1',
      coordinatesLabel: '6°26\'54"N 3°23\'46"E',
      headline: 'Deploy Aegis3D Workspace',
      subheadline:
        'Create your workspace with Google Workspace SSO. No passwords stored.',
      enclaveLabel: 'Enclave: West Africa Sovereign (LOS-1)',
      enclaveBadge: 'HSM V3 READY',
      googleTitle: 'Continue with Google',
      googleSubtitle: 'OAuth 2.0 · NDPR-aligned residency',
      trustTitle: 'Zero-Exposure Trust Protocol',
      trustBody:
        'Air-gapped OAuth 2.0 PKCE · NDPR data residency · No plain-text credentials.',
      tierSectionLabel: 'Workspace plan',
      consentPrefix: 'I agree to the',
      consentSuffix: '.',
      rememberMeLabel: 'Remember me on this device',
      signInLabel: 'Already have an account? Sign in',
      liaisonLabel: 'Need SCIF onboarding? Contact Liaison',
      authScheme: 'AUTH_SCHEME: OIDC-PKCE-WGS84',
      sessionSalt: 'SESSION_SALT: ACTIVE',
      headerEnclave: 'ENCLAVE: WGS84 // REST SECURE',
      headerTls: 'TLS 1.3 SOVEREIGN',
      handshakeIdle: 'Connecting…',
      handshakeRedirect: 'Redirecting to Google…',
    };

    for (const [fieldKey, value] of Object.entries(registerCopy)) {
      await this.copyModel.updateOne(
        { pageKey: 'register', fieldKey, locale: 'en' },
        { $set: { pageKey: 'register', fieldKey, locale: 'en', value } },
        { upsert: true },
      );
    }
  }

  private async seedTiers() {
    await this.tierModel.updateOne(
      { code: 'commercial' },
      {
        $set: {
          code: 'commercial',
          name: 'Defense & Commercial Operations',
          description:
            '3D volumetric intelligence, drone mesh ingestion, and situational grids.',
          badgeLabel: '1 Facility Credit',
          badgeTone: 'primary',
          isDefault: true,
          sortOrder: 1,
          isActive: true,
          currencyCode: 'NGN',
        },
      },
      { upsert: true },
    );

    await this.tierModel.updateOne(
      { code: 'sovereign_gov' },
      {
        $set: {
          code: 'sovereign_gov',
          name: 'Government & SCIF Enclave',
          description:
            'Isolated sovereign infrastructure with clearance token validation.',
          badgeLabel: 'Token Required',
          badgeTone: 'muted',
          isDefault: false,
          sortOrder: 2,
          isActive: true,
          currencyCode: 'NGN',
        },
      },
      { upsert: true },
    );
  }

  private async seedLegal() {
    await this.legalModel.updateOne(
      { slug: 'sovereign-defense-tos' },
      {
        $set: {
          slug: 'sovereign-defense-tos',
          title: 'Terms of Service',
          summary: 'Operator obligations for Aegis3D workspace deployment.',
          bodyMarkdown:
            '# Terms of Service\n\nManaged via CMS. Clients must not hardcode legal copy.',
          version: '2026.1',
          effectiveAt: new Date('2026-01-01T00:00:00.000Z'),
          isActive: true,
          showOnRegister: true,
        },
      },
      { upsert: true },
    );

    await this.legalModel.updateOne(
      { slug: 'ndpr-data-residency' },
      {
        $set: {
          slug: 'ndpr-data-residency',
          title: 'NDPR Data Residency Protocol',
          summary: 'Nigeria Data Protection Regulation residency commitments.',
          bodyMarkdown:
            '# NDPR Data Residency Protocol\n\nWest Africa enclave telemetry is processed under NDPR-aligned residency controls.',
          version: '2026.1',
          effectiveAt: new Date('2026-01-01T00:00:00.000Z'),
          isActive: true,
          showOnRegister: true,
        },
      },
      { upsert: true },
    );
  }

  private async seedBadges() {
    const badges = [
      {
        code: 'iso27001',
        label: 'ISO/IEC 27001',
        icon: 'security',
        sortOrder: 1,
        showOnRegister: true,
        showInFooter: true,
      },
      {
        code: 'ndpr',
        label: 'NDPR SOVEREIGN',
        icon: 'verified',
        sortOrder: 2,
        showOnRegister: true,
        showInFooter: false,
      },
      {
        code: 'ndpr-footer',
        label: 'NDPR CERTIFIED',
        icon: 'verified',
        sortOrder: 10,
        showOnRegister: false,
        showInFooter: true,
      },
      {
        code: 'soc2',
        label: 'SOC 2 TYPE II',
        icon: 'lock',
        sortOrder: 3,
        showOnRegister: true,
        showInFooter: true,
      },
      {
        code: 'hsm',
        label: 'HSM PKI',
        icon: 'memory',
        sortOrder: 4,
        showOnRegister: true,
        showInFooter: false,
      },
    ];

    for (const badge of badges) {
      await this.badgeModel.updateOne(
        { code: badge.code },
        { $set: { ...badge, isActive: true } },
        { upsert: true },
      );
    }
  }

  private async seedLatency() {
    const nodes = [
      { code: 'us-east', label: 'US-EAST (DC)', latencyMs: 12, sortOrder: 1 },
      {
        code: 'eu-central',
        label: 'EU-CENTRAL (FRA)',
        latencyMs: 24,
        sortOrder: 2,
      },
      { code: 'ap-south', label: 'AP-SOUTH (SIN)', latencyMs: 41, sortOrder: 3 },
    ];

    for (const node of nodes) {
      await this.latencyModel.updateOne(
        { code: node.code },
        { $set: { ...node, isActive: true } },
        { upsert: true },
      );
    }
  }

  private async seedSettings() {
    const settings: Array<{
      key: string;
      value: string;
      valueType: 'string' | 'number' | 'boolean' | 'json';
      description: string;
    }> = [
      {
        key: 'copyright',
        value:
          '© 2026 AEGIS3D DEFENSE SYSTEMS. SOVEREIGN GEOSPATIAL INTELLIGENCE.',
        valueType: 'string',
        description: 'Global footer copyright line',
      },
      {
        key: 'liaison.email',
        value: 'liaison@aegis3d.com',
        valueType: 'string',
        description: 'SCIF onboarding liaison mailbox',
      },
      {
        key: 'auth.rememberMeDefault',
        value: 'false',
        valueType: 'boolean',
        description: 'Default checked state for Remember me on register',
      },
      {
        key: 'auth.sessionTtlSeconds',
        value: '28800',
        valueType: 'number',
        description: 'Session TTL in seconds when Remember me is off (8h)',
      },
      {
        key: 'auth.rememberMeTtlSeconds',
        value: '2592000',
        valueType: 'number',
        description: 'Session TTL in seconds when Remember me is on (30d)',
      },
    ];

    for (const row of settings) {
      await this.settingModel.updateOne(
        { key: row.key },
        { $set: row },
        { upsert: true },
      );
    }
  }
}
