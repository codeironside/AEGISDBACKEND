import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LegalDocument,
  LegalDocumentSchema,
} from '../cms/schemas/legal-document.schema';
import {
  SiteSetting,
  SiteSettingSchema,
} from '../cms/schemas/site-setting.schema';
import {
  WorkspaceTier,
  WorkspaceTierSchema,
} from '../cms/schemas/workspace-tier.schema';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: WorkspaceTier.name, schema: WorkspaceTierSchema },
      { name: LegalDocument.name, schema: LegalDocumentSchema },
      { name: SiteSetting.name, schema: SiteSettingSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
