import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AcceptedLegal,
  User,
  UserDocument,
} from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findByGoogleId(googleId: string) {
    return this.userModel.findOne({ googleId }).exec();
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async upsertGoogleUser(input: {
    email: string;
    googleId: string;
    displayName?: string;
    avatarUrl?: string;
    workspaceTierCode: string;
    consentAccepted: boolean;
    rememberMe: boolean;
    acceptedLegal: AcceptedLegal[];
  }) {
    const existing = await this.findByGoogleId(input.googleId);
    if (existing) {
      existing.displayName = input.displayName ?? existing.displayName;
      existing.avatarUrl = input.avatarUrl ?? existing.avatarUrl;
      existing.workspaceTierCode = input.workspaceTierCode;
      existing.rememberMe = input.rememberMe;
      existing.lastLoginAt = new Date();
      if (input.consentAccepted) {
        existing.consentAcceptedAt = new Date();
        existing.acceptedLegal = input.acceptedLegal;
      }
      if (existing.status === 'pending') {
        existing.status = 'active';
      }
      return existing.save();
    }

    const byEmail = await this.findByEmail(input.email);
    if (byEmail) {
      byEmail.googleId = input.googleId;
      byEmail.displayName = input.displayName ?? byEmail.displayName;
      byEmail.avatarUrl = input.avatarUrl ?? byEmail.avatarUrl;
      byEmail.workspaceTierCode = input.workspaceTierCode;
      byEmail.rememberMe = input.rememberMe;
      byEmail.lastLoginAt = new Date();
      if (input.consentAccepted) {
        byEmail.consentAcceptedAt = new Date();
        byEmail.acceptedLegal = input.acceptedLegal;
      }
      if (byEmail.status === 'pending') {
        byEmail.status = 'active';
      }
      return byEmail.save();
    }

    return this.userModel.create({
      email: input.email.toLowerCase(),
      googleId: input.googleId,
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
      workspaceTierCode: input.workspaceTierCode,
      consentAcceptedAt: input.consentAccepted ? new Date() : undefined,
      acceptedLegal: input.consentAccepted ? input.acceptedLegal : [],
      rememberMe: input.rememberMe,
      lastLoginAt: new Date(),
      status: 'active',
      role: 'operator',
    });
  }
}
