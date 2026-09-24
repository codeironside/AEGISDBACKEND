import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DashboardSpatialNodeDocument =
  HydratedDocument<DashboardSpatialNode>;

/** Flat tree via parentCode — no nested children arrays. */
@Schema({ collection: 'dashboard_spatial_nodes', timestamps: true })
export class DashboardSpatialNode {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  code!: string;

  @Prop({ trim: true, lowercase: true, index: true })
  parentCode?: string;

  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({ trim: true })
  icon?: string;

  @Prop({ default: true })
  visible!: boolean;

  @Prop({ trim: true })
  statusLabel?: string;

  @Prop({ default: false })
  selected!: boolean;

  @Prop({ default: 0, index: true })
  sortOrder!: number;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const DashboardSpatialNodeSchema = SchemaFactory.createForClass(
  DashboardSpatialNode,
);
