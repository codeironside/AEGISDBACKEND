import { IsArray, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class GenerateTwinDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @IsString()
  locationLabel?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modalities?: string[];

  /** Anonymous / workspace subject when no session. */
  @IsOptional()
  @IsString()
  subjectKey?: string;
}
