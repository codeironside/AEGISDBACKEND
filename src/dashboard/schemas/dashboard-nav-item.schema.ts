import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DashboardNavItemDocument = HydratedDocument<DashboardNavItem>;

/** Flat nav row — group via groupCode, no nested menus. */
@Schema({ collection: 'dashboard_nav_items', timestamps: true })
export class DashboardNavItem {
  @Prop({ required: true, trim: true, index: true })
  groupCode!: string;

  @Prop({ required: true, trim: true })
  groupTitle!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  code!: string;

  @Prop({ required: true, trim: true })
  href!: string;

  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({ required: true, trim: true })
  icon!: string;

  @Prop({ trim: true })
  badge?: string;

  @Prop({ default: 0, index: true })
  groupSort!: number;

  @Prop({ default: 0, index: true })
  sortOrder!: number;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const DashboardNavItemSchema =
  SchemaFactory.createForClass(DashboardNavItem);
