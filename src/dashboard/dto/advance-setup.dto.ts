import {
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class AdvanceSetupDto {
  @IsString()
  @MinLength(2)
  @Matches(/^[a-z0-9_]+$/)
  stepCode!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  facilityName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  facilityLocation?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  locationLabel?: string;
}
