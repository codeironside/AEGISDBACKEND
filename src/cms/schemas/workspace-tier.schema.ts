import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WorkspaceTierDocument = HydratedDocument<WorkspaceTier>;

/** Flat provisioning tier — currency referenced by code, not embedded. */
@Schema({ collection: 'workspace_tiers', timestamps: true })
export class WorkspaceTier {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  code!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ required: true, trim: true })
  badgeLabel!: string;

  @Prop({ required: true, enum: ['primary', 'muted'], default: 'muted' })
  badgeTone!: 'primary' | 'muted';

  @Prop({ default: false, index: true })
  isDefault!: boolean;

  @Prop({ default: 0, index: true })
  sortOrder!: number;

  @Prop({ default: true, index: true })
  isActive!: boolean;

  /** ISO currency code reference (join in service, not nested). */
  @Prop({ required: true, uppercase: true, trim: true })
  currencyCode!: string;
}

export const WorkspaceTierSchema = SchemaFactory.createForClass(WorkspaceTier);
