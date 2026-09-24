import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DashboardSnapshotDocument = HydratedDocument<DashboardSnapshot>;

/**
 * Flat operational snapshot (one active row).
 * Values are strings so CMS/ops can edit without schema changes.
 */
@Schema({ collection: 'dashboard_snapshots', timestamps: true })
export class DashboardSnapshot {
  @Prop({ required: true, unique: true, default: 'active' })
  code!: string;

  @Prop({ required: true, trim: true })
  facilityTitle!: string;

  @Prop({ required: true, trim: true })
  facilityStatus!: string;

  @Prop({ required: true, trim: true })
  coordinates!: string;

  @Prop({ required: true, trim: true })
  altitude!: string;

  @Prop({ required: true, trim: true })
  spatialConfidence!: string;

  @Prop({ required: true, trim: true })
  defconLabel!: string;

  @Prop({ required: true, trim: true })
  onboardingStepLabel!: string;

  @Prop({ default: 2 })
  onboardingStep!: number;

  @Prop({ default: 4 })
  onboardingTotal!: number;

  @Prop({ required: true, trim: true })
  onboardingEyebrow!: string;

  @Prop({ required: true, trim: true })
  onboardingBadge!: string;

  @Prop({ required: true, trim: true })
  onboardingHeadline!: string;

  @Prop({ required: true, trim: true })
  onboardingHint!: string;

  @Prop({ required: true, trim: true })
  sectorLabel!: string;

  @Prop({ required: true, trim: true })
  socLabel!: string;

  @Prop({ required: true, trim: true })
  enclaveLabel!: string;

  @Prop({ required: true, trim: true })
  geoLabel!: string;

  @Prop({ required: true, trim: true })
  operatorName!: string;

  @Prop({ required: true, trim: true })
  operatorMeta!: string;

  @Prop({ required: true, trim: true })
  creditsLabel!: string;

  @Prop({ required: true, trim: true })
  creditsSub!: string;

  @Prop({ default: 48 })
  creditsRemaining!: number;

  @Prop({ default: 50 })
  creditsTotal!: number;

  @Prop({ required: true, trim: true })
  quotaLabel!: string;

  @Prop({ required: true, trim: true })
  nodeLabel!: string;

  @Prop({ required: true, trim: true })
  nodeStatus!: string;

  @Prop({ required: true, trim: true })
  scifLabel!: string;

  @Prop({ required: true, trim: true })
  scifLevel!: string;

  @Prop({ required: true, trim: true })
  brandSubtitle!: string;

  @Prop({ required: true, trim: true })
  alertCountLabel!: string;

  @Prop({ default: 3 })
  alertCount!: number;

  @Prop({ required: true, trim: true })
  twinEngineLabel!: string;

  @Prop({ required: true, trim: true })
  twinLatency!: string;

  @Prop({ required: true, trim: true })
  twinRaycasts!: string;

  @Prop({ required: true, trim: true })
  twinTriangles!: string;

  @Prop({ required: true, trim: true })
  twinScale!: string;

  @Prop({ required: true, trim: true })
  twinFilter!: string;

  @Prop({ required: true, trim: true })
  spatialLod!: string;

  @Prop({ required: true, trim: true })
  raycastDensity!: string;

  @Prop({ required: true, trim: true })
  precisionMode!: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export const DashboardSnapshotSchema =
  SchemaFactory.createForClass(DashboardSnapshot);
