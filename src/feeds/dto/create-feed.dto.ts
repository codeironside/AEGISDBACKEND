import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFeedDto {
  @IsString()
  @MaxLength(120)
  workspaceKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  metricCode?: string;
}
