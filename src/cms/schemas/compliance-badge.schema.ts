import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ComplianceBadgeDocument = HydratedDocument<ComplianceBadge>;

@Schema({ collection: 'compliance_badges', timestamps: true })
export class ComplianceBadge {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  code!: string;

  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({ required: true, trim: true })
  icon!: string;

  @Prop({ default: 0, index: true })
  sortOrder!: number;

  @Prop({ default: true, index: true })
  isActive!: boolean;

  @Prop({ default: true })
  showOnRegister!: boolean;

  @Prop({ default: false })
  showInFooter!: boolean;
}

export const ComplianceBadgeSchema =
  SchemaFactory.createForClass(ComplianceBadge);
