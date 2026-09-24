import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LegalDocumentDocument = HydratedDocument<LegalDocument>;

/** Flat legal/CMS document — body is a string, not nested sections. */
@Schema({ collection: 'legal_documents', timestamps: true })
export class LegalDocument {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ default: '', trim: true })
  summary!: string;

  @Prop({ required: true })
  bodyMarkdown!: string;

  @Prop({ required: true, trim: true })
  version!: string;

  @Prop({ type: Date, required: true })
  effectiveAt!: Date;

  @Prop({ default: true, index: true })
  isActive!: boolean;

  @Prop({ default: true })
  showOnRegister!: boolean;
}

export const LegalDocumentSchema = SchemaFactory.createForClass(LegalDocument);
