import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongoSchema } from 'mongoose';
import type { SiteInput } from './site-input';
export type SiteDocument = HydratedDocument<Site>;
@Schema({ collection: 'sites', timestamps: true })
export class Site {
  @Prop({ required: true, unique: true, index: true }) id!: string;
  @Prop({ required: true, index: true }) ownerEmail!: string;
  @Prop({ required: true, type: MongoSchema.Types.Mixed }) content!: SiteInput;
  @Prop({ required: true, default: 1 }) revision!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
export const SiteSchema = SchemaFactory.createForClass(Site);
