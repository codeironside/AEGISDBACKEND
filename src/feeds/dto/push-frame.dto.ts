import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class PushFrameDto {
  /** Raw base64 (no data: prefix). */
  @IsString()
  @MinLength(32)
  @MaxLength(2_000_000)
  frameBase64!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  mimeType?: string;
}
