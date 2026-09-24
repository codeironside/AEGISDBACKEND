import { IsBoolean, IsString, Matches, MinLength } from 'class-validator';

export class StartGoogleDto {
  /** Must match an active workspace_tiers.code from CMS. */
  @IsString()
  @MinLength(2)
  @Matches(/^[a-z0-9_]+$/)
  workspaceTierCode!: string;

  /** Must be true — terms copy/links come from CMS legal_documents. */
  @IsBoolean()
  consentAccepted!: boolean;

  /** Session length preference; TTL values live in site_settings. */
  @IsBoolean()
  rememberMe!: boolean;
}
