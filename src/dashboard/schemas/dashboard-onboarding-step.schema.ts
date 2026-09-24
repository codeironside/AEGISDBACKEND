import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DashboardOnboardingStepDocument =
  HydratedDocument<DashboardOnboardingStep>;

@Schema({ collection: 'dashboard_onboarding_steps', timestamps: true })
export class DashboardOnboardingStep {
  @Prop({ required: true, unique: true })
  stepNumber!: number;

  @Prop({
    required: true,
    enum: ['complete', 'active', 'next', 'locked'],
  })
  status!: 'complete' | 'active' | 'next' | 'locked';

  @Prop({ required: true, trim: true })
  statusLabel!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  body!: string;

  @Prop({ trim: true })
  meta?: string;

  @Prop({ trim: true })
  metaRight?: string;

  /** Comma-separated chips — flat string, not nested array docs. */
  @Prop({ trim: true, default: '' })
  chipsCsv!: string;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const DashboardOnboardingStepSchema = SchemaFactory.createForClass(
  DashboardOnboardingStep,
);
