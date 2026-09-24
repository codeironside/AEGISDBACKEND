import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GettingStartedStepDocument =
  HydratedDocument<GettingStartedStep>;

@Schema({ collection: 'getting_started_steps', timestamps: true })
export class GettingStartedStep {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  code!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  body!: string;

  @Prop({ required: true, trim: true })
  ctaLabel!: string;

  @Prop({ required: true, trim: true })
  icon!: string;

  /** Optional input type for this step: none | facility | location */
  @Prop({
    default: 'none',
    enum: ['none', 'facility', 'location'],
  })
  inputType!: 'none' | 'facility' | 'location';

  @Prop({ trim: true, default: '' })
  inputPlaceholder!: string;

  @Prop({ default: 0, index: true })
  sortOrder!: number;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const GettingStartedStepSchema =
  SchemaFactory.createForClass(GettingStartedStep);
