import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CmsCopy, CmsCopyDocument } from '../cms/schemas/cms-copy.schema';
import {
  SiteSetting,
  SiteSettingDocument,
} from '../cms/schemas/site-setting.schema';
import { AuthService } from '../auth/auth.service';
import { GenerateTwinDto } from './dto/generate-twin.dto';
import { TwinUsage, TwinUsageDocument } from './schemas/twin-usage.schema';

@Injectable()
export class LandingService {
  constructor(
    @InjectModel(CmsCopy.name) private readonly copyModel: Model<CmsCopyDocument>,
    @InjectModel(SiteSetting.name)
    private readonly settingModel: Model<SiteSettingDocument>,
    @InjectModel(TwinUsage.name)
    private readonly usageModel: Model<TwinUsageDocument>,
    private readonly authService: AuthService,
  ) {}

  private async getCopyMap(pageKey: string, locale = 'en') {
    const rows = await this.copyModel
      .find({ pageKey, locale })
      .select('fieldKey value')
      .lean()
      .exec();
    return Object.fromEntries(rows.map((r) => [r.fieldKey, r.value]));
  }

  private utcDayKey(d = new Date()) {
    return d.toISOString().slice(0, 10);
  }

  private async dailyLimit() {
    const row = await this.settingModel
      .findOne({ key: 'landing.twinDailyCredits' })
      .lean();
    const n = parseInt(row?.value ?? '3', 10);
    return Number.isFinite(n) && n > 0 ? n : 3;
  }

  async ensureHeroSeeded() {
    const fields: Record<string, string> = {
      defconLabel: 'DEFCON-3 ACTIVE RECON',
      gridTemplate: 'GRID: {grid}',
      camFovTemplate: 'CAM-04 FOV: {fov}° AZIMUTH',
      ingressTemplate: 'INGRESS: {ingress} PAX / HR',
      elevationTemplate: 'ELEVATION: {elevation} MSL',
      accuracyTemplate: 'ACCURACY: <{accuracy}m RMS',
      perimeterLabel: 'VIP PERIMETER HARDENED',
      streamsTemplate: '{streams} ONVIF STREAMS SYNCED',
      synthesizedTemplate:
        'Synthesized: {sources}',
      volumetricsLabel: 'View Raw Volumetrics',
      creditCostLabel: '(1 Credit)',
      rateLimitMessage:
        'Daily twin credits used up (3/day). Try again tomorrow.',
      generateIdleLabel: 'Generate 3D Twin',
      generateLoadingLabel: 'Ingesting Vectors...',
      generateDoneLabel: 'Workspace Active',
    };
    for (const [fieldKey, value] of Object.entries(fields)) {
      await this.copyModel.updateOne(
        { pageKey: 'landing_hero', fieldKey, locale: 'en' },
        { $set: { pageKey: 'landing_hero', fieldKey, locale: 'en', value } },
        { upsert: true },
      );
    }
    await this.settingModel.updateOne(
      { key: 'landing.twinDailyCredits' },
      {
        $set: {
          key: 'landing.twinDailyCredits',
          value: '3',
          valueType: 'number',
          description: 'Max Generate 3D Twin credits per subject per UTC day',
        },
      },
      { upsert: true },
    );
  }

  async getHeroPage(locale = 'en') {
    await this.ensureHeroSeeded();
    const [copy, limit] = await Promise.all([
      this.getCopyMap('landing_hero', locale),
      this.dailyLimit(),
    ]);
    return {
      copy,
      rateLimit: {
        dailyCredits: limit,
        creditCost: 1,
      },
      modalities: [
        { id: 'sat', label: 'Satellite & GIS', icon: 'satellite_alt' },
        { id: 'cad', label: 'CAD/BIM Blueprint', icon: 'square_foot' },
        { id: 'field', label: 'Field Mobile 360°', icon: 'phone_iphone' },
        { id: 'cctv', label: 'Live RTSP CCTV', icon: 'videocam' },
      ],
    };
  }

  private async resolveSubject(
    authorization: string | undefined,
    subjectKey?: string,
  ) {
    const profile = await this.authService.getSessionProfile(authorization);
    if (profile?.email) return `user:${profile.email.toLowerCase()}`;
    const key = subjectKey?.trim();
    if (key && key.length >= 8) return `anon:${key}`;
    throw new BadRequestException(
      'Please refresh and try again before generating a twin.',
    );
  }

  private hash01(lat: number, lng: number) {
    const raw = Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453;
    return raw - Math.floor(raw);
  }

  private async fetchElevation(lat: number, lng: number) {
    try {
      const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = (await res.json()) as { elevation?: number[] };
      const elev = data.elevation?.[0];
      return typeof elev === 'number' ? elev : null;
    } catch {
      return null;
    }
  }

  private buildOverlay(
    copy: Record<string, string>,
    lat: number,
    lng: number,
    modalities: string[],
    elevationM: number | null,
  ) {
    const h = this.hash01(lat, lng);
    const hasCctv = modalities.includes('cctv');
    const hasSat = modalities.includes('sat');
    const hasCad = modalities.includes('cad');
    const hasField = modalities.includes('field');

    const fov = Math.round(90 + h * 40);
    const ingress = Math.round(800 + h * 4200 + (hasCctv ? 350 : 0));
    const elev =
      elevationM != null
        ? `${elevationM >= 0 ? '+' : ''}${elevationM.toFixed(1)}m`
        : `${h > 0.5 ? '+' : '-'}${(20 + h * 60).toFixed(1)}m`;
    const accuracy = (0.08 + h * 0.12 - (hasCad ? 0.02 : 0)).toFixed(2);
    const streams = hasCctv
      ? Math.round(6 + h * 18)
      : hasField
        ? Math.round(2 + h * 4)
        : 0;
    const grid = `S-${Math.floor(10 + h * 80)}/SECTOR-${String.fromCharCode(
      65 + Math.floor(h * 6),
    )}`;
    const sources = [
      hasSat ? 'Sentinel-2' : null,
      hasCad ? 'DWG Rev' : null,
      hasField ? 'Mobile 360°' : null,
      hasCctv ? 'RTSP CCTV' : null,
    ]
      .filter(Boolean)
      .join(' + ');

    const utc = new Date().toISOString().replace('T', ' ').replace('Z', ' UTC');

    return {
      defconLabel: copy.defconLabel ?? 'DEFCON-3 ACTIVE RECON',
      gridLabel: (copy.gridTemplate ?? 'GRID: {grid}').replace('{grid}', grid),
      camFovLabel: (copy.camFovTemplate ?? 'CAM-04 FOV: {fov}° AZIMUTH').replace(
        '{fov}',
        String(fov),
      ),
      ingressLabel: (
        copy.ingressTemplate ?? 'INGRESS: {ingress} PAX / HR'
      ).replace('{ingress}', ingress.toLocaleString('en-US')),
      ingressValue: ingress,
      elevationLabel: (
        copy.elevationTemplate ?? 'ELEVATION: {elevation} MSL'
      ).replace('{elevation}', elev),
      accuracyLabel: (
        copy.accuracyTemplate ?? 'ACCURACY: <{accuracy}m RMS'
      ).replace('{accuracy}', accuracy),
      perimeterLabel: copy.perimeterLabel ?? 'VIP PERIMETER HARDENED',
      streamsLabel: (
        copy.streamsTemplate ?? '{streams} ONVIF STREAMS SYNCED'
      ).replace('{streams}', String(streams)),
      utcLabel: `UTC ${utc.slice(11, 23)}`,
      synthesizedLabel: (
        copy.synthesizedTemplate ?? 'Synthesized: {sources}'
      ).replace('{sources}', sources || 'Awaiting modalities'),
      volumetricsLabel: copy.volumetricsLabel ?? 'View Raw Volumetrics',
      latitude: lat,
      longitude: lng,
    };
  }

  async getUsage(authorization?: string, subjectKey?: string) {
    let subject: string;
    try {
      subject = await this.resolveSubject(authorization, subjectKey);
    } catch {
      const limit = await this.dailyLimit();
      return { usedCredits: 0, remainingCredits: limit, dailyCredits: limit };
    }
    const dayKey = this.utcDayKey();
    const limit = await this.dailyLimit();
    const row = await this.usageModel.findOne({ subjectKey: subject, dayKey });
    const used = row?.usedCredits ?? 0;
    return {
      usedCredits: used,
      remainingCredits: Math.max(0, limit - used),
      dailyCredits: limit,
    };
  }

  async generateTwin(dto: GenerateTwinDto, authorization?: string) {
    const subject = await this.resolveSubject(authorization, dto.subjectKey);
    const dayKey = this.utcDayKey();
    const limit = await this.dailyLimit();
    const modalities = (dto.modalities ?? []).map((m) => m.trim()).filter(Boolean);

    const usage =
      (await this.usageModel.findOne({ subjectKey: subject, dayKey })) ??
      (await this.usageModel.create({
        subjectKey: subject,
        dayKey,
        usedCredits: 0,
        lastLocationLabel: '',
        modalitiesCsv: '',
      }));

    if (usage.usedCredits >= limit) {
      const copy = await this.getCopyMap('landing_hero');
      throw new HttpException(
        {
          message:
            copy.rateLimitMessage ??
            'Daily twin credits used up (3/day). Try again tomorrow.',
          remainingCredits: 0,
          dailyCredits: limit,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const elevation = await this.fetchElevation(dto.latitude, dto.longitude);
    const copy = await this.getCopyMap('landing_hero');
    const overlay = this.buildOverlay(
      copy,
      dto.latitude,
      dto.longitude,
      modalities,
      elevation,
    );

    usage.usedCredits += 1;
    usage.lastLocationLabel = dto.locationLabel?.trim() ?? '';
    usage.lastLatitude = dto.latitude;
    usage.lastLongitude = dto.longitude;
    usage.modalitiesCsv = modalities.join(',');
    await usage.save();

    return {
      overlay,
      usage: {
        usedCredits: usage.usedCredits,
        remainingCredits: Math.max(0, limit - usage.usedCredits),
        dailyCredits: limit,
        creditCost: 1,
      },
      copy: {
        creditCostLabel: copy.creditCostLabel ?? '(1 Credit)',
        generateIdleLabel: copy.generateIdleLabel ?? 'Generate 3D Twin',
        generateLoadingLabel:
          copy.generateLoadingLabel ?? 'Ingesting Vectors...',
        generateDoneLabel: copy.generateDoneLabel ?? 'Workspace Active',
        volumetricsLabel: copy.volumetricsLabel ?? 'View Raw Volumetrics',
      },
    };
  }
}
