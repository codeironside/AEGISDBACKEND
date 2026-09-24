import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SiteSettingDocument = HydratedDocument<SiteSetting>;

/** Flat key/value site settings (copyright, liaison email, etc.). */
@Schema({ collection: 'site_settings', timestamps: true })
export class SiteSetting {
  @Prop({ required: true, unique: true, trim: true })
  key!: string;

  @Prop({ required: true })
  value!: string;

  @Prop({
    required: true,
    enum: ['string', 'number', 'boolean', 'json'],
    default: 'string',
  })
  valueType!: 'string' | 'number' | 'boolean' | 'json';

  @Prop({ default: '', trim: true })
  description!: string;
}

export const SiteSettingSchema = SchemaFactory.createForClass(SiteSetting);
