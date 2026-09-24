import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DashboardIncidentDocument = HydratedDocument<DashboardIncident>;

@Schema({ collection: 'dashboard_incidents', timestamps: true })
export class DashboardIncident {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  code!: string;

  @Prop({
    required: true,
    enum: ['critical', 'moderate', 'info'],
    index: true,
  })
  severity!: 'critical' | 'moderate' | 'info';

  @Prop({ required: true, trim: true })
  severityLabel!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  body!: string;

  @Prop({ required: true, trim: true })
  timeLabel!: string;

  @Prop({ trim: true })
  riskLabel?: string;

  @Prop({ trim: true })
  riskValue?: string;

  @Prop({ trim: true })
  actionLabel?: string;

  @Prop({ trim: true })
  actionIcon?: string;

  @Prop({ trim: true })
  metaLeft?: string;

  @Prop({ trim: true })
  metaAction?: string;

  @Prop({ default: 0, index: true })
  sortOrder!: number;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const DashboardIncidentSchema =
  SchemaFactory.createForClass(DashboardIncident);
