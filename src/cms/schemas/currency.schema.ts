import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CurrencyDocument = HydratedDocument<Currency>;

/** Flat currency row — no nested FX tables. */
@Schema({ collection: 'currencies', timestamps: true })
export class Currency {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code!: string;

  @Prop({ required: true, trim: true })
  symbol!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: 2 })
  decimalPlaces!: number;

  @Prop({ default: false, index: true })
  isDefault!: boolean;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const CurrencySchema = SchemaFactory.createForClass(Currency);
