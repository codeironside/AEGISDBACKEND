import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LatencyNodeDocument = HydratedDocument<LatencyNode>;

@Schema({ collection: 'latency_nodes', timestamps: true })
export class LatencyNode {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  code!: string;

  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({ required: true, min: 0 })
  latencyMs!: number;

  @Prop({ default: 0, index: true })
  sortOrder!: number;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const LatencyNodeSchema = SchemaFactory.createForClass(LatencyNode);
