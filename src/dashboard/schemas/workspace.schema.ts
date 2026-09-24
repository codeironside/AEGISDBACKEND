import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WorkspaceDocument = HydratedDocument<Workspace>;

/** One row per operator workspace — flat, no nested setup trees. */
@Schema({ collection: 'workspaces', timestamps: true })
export class Workspace {
  @Prop({ required: true, unique: true, trim: true, index: true })
  workspaceKey!: string;

  @Prop({ trim: true, lowercase: true, index: true })
  ownerEmail?: string;

  @Prop({ default: false, index: true })
  setupComplete!: boolean;

  /** Comma-separated completed step codes */
  @Prop({ default: '', trim: true })
  completedStepsCsv!: string;

  @Prop({ trim: true, default: 'welcome' })
  currentStepCode!: string;

  @Prop({ trim: true, default: '' })
  facilityName!: string;

  @Prop({ trim: true, default: '' })
  facilityLocation!: string;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({ trim: true, default: '' })
  locationLabel!: string;

  @Prop({ trim: true, default: '' })
  ownerDisplayName!: string;

  @Prop({ trim: true, default: '' })
  workspaceTierCode!: string;

  @Prop({ type: Date })
  setupCompletedAt?: Date;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
