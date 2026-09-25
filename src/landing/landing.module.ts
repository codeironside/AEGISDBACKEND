import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { CmsCopy, CmsCopySchema } from '../cms/schemas/cms-copy.schema';
import {
  SiteSetting,
  SiteSettingSchema,
} from '../cms/schemas/site-setting.schema';
import { LandingController } from './landing.controller';
import { LandingService } from './landing.service';
import { TwinUsage, TwinUsageSchema } from './schemas/twin-usage.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: TwinUsage.name, schema: TwinUsageSchema },
      { name: CmsCopy.name, schema: CmsCopySchema },
      { name: SiteSetting.name, schema: SiteSettingSchema },
    ]),
  ],
  controllers: [LandingController],
  providers: [LandingService],
  exports: [LandingService],
})
export class LandingModule {}
