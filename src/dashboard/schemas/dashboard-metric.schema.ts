import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DashboardMetricDocument = HydratedDocument<DashboardMetric>;

@Schema({ collection: 'dashboard_metrics', timestamps: true })
export class DashboardMetric {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  code!: string;

  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({ required: true, trim: true })
  icon!: string;

  @Prop({ required: true, trim: true })
  value!: string;

  @Prop({ trim: true })
  delta?: string;

  @Prop({ trim: true })
  deltaTone?: 'up' | 'neutral' | 'warn';

  @Prop({ trim: true })
  footerLeft?: string;

  @Prop({ trim: true })
  footerRight?: string;

  @Prop({ default: 0, index: true })
  sortOrder!: number;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const DashboardMetricSchema =
  SchemaFactory.createForClass(DashboardMetric);
