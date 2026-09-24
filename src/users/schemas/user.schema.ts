import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class AcceptedLegal {
  @Prop({ required: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ required: true, trim: true })
  version!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ type: Date, required: true })
  acceptedAt!: Date;
}

const AcceptedLegalSchema = SchemaFactory.createForClass(AcceptedLegal);

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ trim: true })
  googleId?: string;

  @Prop({ trim: true })
  displayName?: string;

  @Prop({ trim: true })
  avatarUrl?: string;

  /** Flat reference to workspace_tiers.code */
  @Prop({ required: true, lowercase: true, trim: true })
  workspaceTierCode!: string;

  @Prop({ type: Date })
  consentAcceptedAt?: Date;

  /** Snapshot of register legal docs accepted at signup / last consent. */
  @Prop({ type: [AcceptedLegalSchema], default: [] })
  acceptedLegal!: AcceptedLegal[];

  @Prop({ default: false })
  rememberMe!: boolean;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ default: 'pending', enum: ['pending', 'active', 'suspended'] })
  status!: 'pending' | 'active' | 'suspended';

  @Prop({ default: 'operator' })
  role!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
