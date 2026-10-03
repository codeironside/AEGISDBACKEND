import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { Site, SiteDocument } from './site.schema';
import { parseSiteInput, parseConfiguration, defaultWorkspaceConfiguration } from './site-input';
@Injectable()
export class SitesService {
  constructor(
    @InjectModel(Site.name) private readonly sites: Model<SiteDocument>,
  ) {}
  private output(site: SiteDocument) {
    return {
      ...site.content,
      configuration: { ...defaultWorkspaceConfiguration, ...site.content.configuration },
      id: site.id,
      revision: site.revision,
      createdAt: site.createdAt.toISOString(),
      updatedAt: site.updatedAt.toISOString(),
    };
  }
  private input(raw: unknown) {
    try {
      return parseSiteInput(raw);
    } catch (e) {
      throw new BadRequestException(
        e instanceof Error ? e.message : 'Please check the location details.',
      );
    }
  }
  async list(ownerEmail: string) {
    return (
      await this.sites.find({ ownerEmail }).sort({ updatedAt: -1 }).exec()
    ).map((site) => this.output(site));
  }
  async create(ownerEmail: string, raw: unknown) {
    return this.output(
      await this.sites.create({
        id: randomUUID(),
        ownerEmail,
        content: this.input(raw),
        revision: 1,
      }),
    );
  }
  async configure(ownerEmail: string, id: string, raw: unknown) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new BadRequestException('Provide workspace settings.');
    const patch = raw as Record<string, unknown>;
    if (!Object.keys(patch).length || Object.keys(patch).some(key => !Object.hasOwn(defaultWorkspaceConfiguration, key)))
      throw new BadRequestException('Unknown workspace setting.');
    let validated: ReturnType<typeof parseConfiguration>;
    try { validated = parseConfiguration(patch); }
    catch (e) { throw new BadRequestException(e instanceof Error ? e.message : 'Invalid settings.'); }
    const fields = Object.fromEntries(Object.keys(patch).map(key => [`content.configuration.${key}`, validated[key as keyof typeof validated]]));
    const saved = await this.sites.findOneAndUpdate({ ownerEmail, id }, { $set: fields, $inc: { revision: 1 } }, { returnDocument: 'after' }).exec();
    if (!saved) throw new NotFoundException('This workspace is not available.');
    return this.output(saved);
  }
  async update(ownerEmail: string, id: string, raw: unknown) {
    const revision =
      raw && typeof raw === 'object'
        ? (raw as { revision?: unknown }).revision
        : undefined;
    if (
      typeof revision !== 'number' ||
      !Number.isInteger(revision) ||
      revision < 1
    )
      throw new BadRequestException(
        'Please reload the location before saving.',
      );
    const content = this.input(raw);
    const previous = await this.sites
      .findOne({ ownerEmail, id, revision })
      .exec();
    if (raw && typeof raw === 'object' && !('configuration' in raw) && previous?.content.configuration)
      content.configuration = previous.content.configuration;
    const priorFeatures = new Map(
      previous?.content.features.map((feature) => [feature.id, feature]),
    );
    for (const feature of content.features) {
      const prior = priorFeatures.get(feature.id);
      const withoutTime = (record: typeof feature) => ({
        ...record,
        updatedAt: '',
      });
      if (
        prior &&
        JSON.stringify(withoutTime(prior)) ===
          JSON.stringify(withoutTime(feature))
      )
        feature.updatedAt = prior.updatedAt;
    }
    const saved = await this.sites
      .findOneAndUpdate(
        { ownerEmail, id, revision },
        { $set: { content }, $inc: { revision: 1 } },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
    if (saved) return this.output(saved);
    if (await this.sites.exists({ ownerEmail, id }))
      throw new ConflictException(
        'This location changed in another session. Reload it before saving.',
      );
    throw new NotFoundException('This location is not available.');
  }
}
