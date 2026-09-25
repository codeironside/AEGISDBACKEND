import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TwinUsageDocument = HydratedDocument<TwinUsage>;

/** Flat daily credit usage for hero "Generate 3D Twin". */
@Schema({ collection: 'twin_usage', timestamps: true })
export class TwinUsage {
  @Prop({ required: true, trim: true, index: true })
  subjectKey!: string;

  /** UTC day key YYYY-MM-DD */
  @Prop({ required: true, trim: true, index: true })
  dayKey!: string;

  @Prop({ default: 0 })
  usedCredits!: number;

  @Prop({ trim: true, default: '' })
  lastLocationLabel!: string;

  @Prop({ type: Number })
  lastLatitude?: number;

  @Prop({ type: Number })
  lastLongitude?: number;

  @Prop({ trim: true, default: '' })
  modalitiesCsv!: string;
}

export const TwinUsageSchema = SchemaFactory.createForClass(TwinUsage);
TwinUsageSchema.index({ subjectKey: 1, dayKey: 1 }, { unique: true });
