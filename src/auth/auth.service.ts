import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
import { AcceptedLegal } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { StartGoogleDto } from './dto/start-google.dto';
import { signSessionToken, verifySessionToken } from './session-token';

type OAuthState = {
  tier: string;
  consent: boolean;
  rememberMe: boolean;
  ts: number;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  id?: string;
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  verified_email?: boolean;
  email_verified?: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
    @InjectModel(WorkspaceTier.name)
    private readonly tierModel: Model<WorkspaceTierDocument>,
    @InjectModel(LegalDocument.name)
    private readonly legalModel: Model<LegalDocumentDocument>,
    @InjectModel(SiteSetting.name)
    private readonly settingModel: Model<SiteSettingDocument>,
  ) {}

  private frontendUrl() {
    return (
      this.config.get<string>('frontend.url') ?? 'http://localhost:3000'
    ).replace(/\/$/, '');
  }

  private async registerLegalDocs() {
    return this.legalModel
      .find({ isActive: true, showOnRegister: true })
      .sort({ title: 1 })
      .lean()
      .exec();
  }

  private async resolveSessionTtl(rememberMe: boolean): Promise<number> {
    const key = rememberMe
      ? 'auth.rememberMeTtlSeconds'
      : 'auth.sessionTtlSeconds';
    const row = await this.settingModel.findOne({ key }).lean().exec();
    const fromDb = row ? Number(row.value) : NaN;
    if (Number.isFinite(fromDb) && fromDb > 0) return fromDb;

    return rememberMe
      ? (this.config.get<number>('auth.rememberMeTtlSeconds') ?? 2_592_000)
      : (this.config.get<number>('auth.sessionTtlSeconds') ?? 28_800);
  }

  private encodeState(state: OAuthState) {
    return Buffer.from(JSON.stringify(state)).toString('base64url');
  }

  private decodeState(raw: string | undefined): OAuthState | null {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(
        Buffer.from(raw, 'base64url').toString('utf8'),
      ) as OAuthState;
      if (!parsed?.tier || typeof parsed.consent !== 'boolean') return null;
      if (typeof parsed.rememberMe !== 'boolean') return null;
      // State older than 30 minutes is rejected.
      if (!parsed.ts || Date.now() - parsed.ts > 30 * 60 * 1000) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  async getSessionProfile(authHeader?: string) {
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;
    if (!token) return null;

    const secret =
      this.config.get<string>('auth.sessionSecret') ||
      'dev-only-change-me-aegis3d';
    const claims = verifySessionToken(token, secret);
    if (!claims) return null;

    const user = await this.users.findById(claims.sub);

    // Prefer DB user when present. If the user row is missing (e.g. in-memory
    // Mongo after a restart) still surface the signed JWT identity so the UI
    // never falls back to demo seed names.
    if (user && user.status !== 'suspended') {
      return {
        id: String(user._id),
        email: user.email,
        displayName: user.displayName || claims.name || user.email,
        avatarUrl: user.avatarUrl,
        workspaceTierCode: user.workspaceTierCode,
        role: user.role,
        status: user.status,
      };
    }

    if (!claims.email && !claims.name) return null;

    return {
      id: claims.sub,
      email: claims.email || '',
      displayName: claims.name || claims.email || 'Operator',
      avatarUrl: undefined as string | undefined,
      workspaceTierCode: claims.tier || '',
      role: 'operator',
      status: 'active',
    };
  }

  private redirectWithError(code: string) {
    const url = new URL(`${this.frontendUrl()}/register`);
    url.searchParams.set('authError', code);
    return url.toString();
  }

  async startGoogleSso(dto: StartGoogleDto) {
    if (!dto.consentAccepted) {
      throw new BadRequestException('Please accept the terms to continue.');
    }

    const [tier, legalDocs] = await Promise.all([
      this.tierModel
        .findOne({ code: dto.workspaceTierCode, isActive: true })
        .lean()
        .exec(),
      this.registerLegalDocs(),
    ]);

    if (!tier) {
      throw new BadRequestException('Please choose a workspace plan.');
    }
    if (!legalDocs.length) {
      throw new ServiceUnavailableException(
        'Terms are temporarily unavailable. Please try again shortly.',
      );
    }

    const clientId = this.config.get<string>('google.clientId');
    const callbackUrl = this.config.get<string>('google.callbackUrl');
    const frontendUrl = this.frontendUrl();

    // Without Google credentials, mint a local session so the dashboard
    // can show the signed-in operator instead of placeholder chrome.
    if (!clientId) {
      const sessionSecret =
        this.config.get<string>('auth.sessionSecret') ||
        'aegis-dev-session-secret';
      const stubEmail = `operator.${tier.code}@aegis.local`;
      const acceptedAt = new Date();
      const acceptedLegal: AcceptedLegal[] = legalDocs.map((doc) => ({
        slug: doc.slug,
        version: doc.version,
        title: doc.title,
        acceptedAt,
      }));
      const user = await this.users.upsertGoogleUser({
        email: stubEmail,
        googleId: `stub-${tier.code}`,
        displayName: `Operator · ${tier.name}`,
        avatarUrl: undefined,
        workspaceTierCode: tier.code,
        consentAccepted: true,
        rememberMe: dto.rememberMe,
        acceptedLegal,
      });
      const ttl = await this.resolveSessionTtl(dto.rememberMe);
      const token = signSessionToken(
        {
          sub: String(user._id),
          email: user.email,
          name: user.displayName || user.email,
          tier: user.workspaceTierCode,
          rememberMe: dto.rememberMe,
        },
        sessionSecret,
        ttl,
      );
      const url = new URL(`${frontendUrl}/dashboard`);
      url.searchParams.set('auth', 'stub');
      url.searchParams.set('token', token);
      url.searchParams.set('remember', dto.rememberMe ? '1' : '0');
      url.searchParams.set('tier', tier.code);
      return {
        redirectUrl: url.toString(),
        mode: 'stub' as const,
        workspaceTierCode: tier.code,
        rememberMe: dto.rememberMe,
      };
    }

    if (!callbackUrl) {
      throw new ServiceUnavailableException(
        'Sign-in is temporarily unavailable. Please try again shortly.',
      );
    }

    const state = this.encodeState({
      tier: tier.code,
      consent: true,
      rememberMe: dto.rememberMe,
      ts: Date.now(),
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      include_granted_scopes: 'true',
      state,
      prompt: 'select_account',
    });

    return {
      redirectUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      mode: 'google' as const,
      workspaceTierCode: tier.code,
      rememberMe: dto.rememberMe,
    };
  }

  async completeGoogleCallback(input: {
    code?: string;
    state?: string;
    error?: string;
  }): Promise<string> {
    if (input.error) {
      return this.redirectWithError('google_denied');
    }
    if (!input.code) {
      return this.redirectWithError('missing_code');
    }

    const state = this.decodeState(input.state);
    if (!state?.consent) {
      return this.redirectWithError('invalid_state');
    }

    const clientId = this.config.get<string>('google.clientId');
    const clientSecret = this.config.get<string>('google.clientSecret');
    const callbackUrl = this.config.get<string>('google.callbackUrl');
    const sessionSecret = this.config.get<string>('auth.sessionSecret');

    if (!clientId || !clientSecret || !callbackUrl || !sessionSecret) {
      return this.redirectWithError('misconfigured');
    }

    const [tier, legalDocs] = await Promise.all([
      this.tierModel
        .findOne({ code: state.tier, isActive: true })
        .lean()
        .exec(),
      this.registerLegalDocs(),
    ]);

    if (!tier) {
      return this.redirectWithError('invalid_tier');
    }
    if (!legalDocs.length) {
      return this.redirectWithError('terms_unavailable');
    }

    let tokens: GoogleTokenResponse;
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: input.code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }),
      });
      tokens = (await tokenRes.json()) as GoogleTokenResponse;
      if (!tokenRes.ok || !tokens.access_token) {
        return this.redirectWithError('token_exchange');
      }
    } catch {
      return this.redirectWithError('token_exchange');
    }

    let profile: GoogleUserInfo;
    try {
      const profileRes = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        },
      );
      profile = (await profileRes.json()) as GoogleUserInfo;
      if (!profileRes.ok || !(profile.id || profile.sub) || !profile.email) {
        return this.redirectWithError('profile');
      }
    } catch {
      return this.redirectWithError('profile');
    }

    const acceptedAt = new Date();
    const acceptedLegal: AcceptedLegal[] = legalDocs.map((doc) => ({
      slug: doc.slug,
      version: doc.version,
      title: doc.title,
      acceptedAt,
    }));

    const user = await this.users.upsertGoogleUser({
      email: profile.email,
      googleId: String(profile.id ?? profile.sub),
      displayName: profile.name,
      avatarUrl: profile.picture,
      workspaceTierCode: tier.code,
      consentAccepted: true,
      rememberMe: state.rememberMe,
      acceptedLegal,
    });

    const ttl = await this.resolveSessionTtl(state.rememberMe);
    const token = signSessionToken(
      {
        sub: String(user._id),
        email: user.email,
        name: user.displayName || user.email,
        tier: user.workspaceTierCode,
        rememberMe: state.rememberMe,
      },
      sessionSecret,
      ttl,
    );

    const url = new URL(`${this.frontendUrl()}/dashboard`);
    url.searchParams.set('auth', 'google');
    url.searchParams.set('token', token);
    url.searchParams.set('remember', state.rememberMe ? '1' : '0');
    url.searchParams.set('tier', tier.code);
    return url.toString();
  }
}
