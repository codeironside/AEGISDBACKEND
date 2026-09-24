import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CmsCopyDocument = HydratedDocument<CmsCopy>;

/**
 * Flat CMS copy table.
 * One row per (pageKey, fieldKey, locale) — avoids nested page trees.
 */
@Schema({ collection: 'cms_copy', timestamps: true })
export class CmsCopy {
  @Prop({ required: true, lowercase: true, trim: true, index: true })
  pageKey!: string;

  @Prop({ required: true, trim: true })
  fieldKey!: string;

  @Prop({ required: true })
  value!: string;

  @Prop({ default: 'en', lowercase: true, trim: true })
  locale!: string;
}

export const CmsCopySchema = SchemaFactory.createForClass(CmsCopy);
CmsCopySchema.index(
  { pageKey: 1, fieldKey: 1, locale: 1 },
  { unique: true },
);
