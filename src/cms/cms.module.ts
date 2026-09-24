import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { CmsCopy, CmsCopySchema } from './schemas/cms-copy.schema';
import {
  ComplianceBadge,
  ComplianceBadgeSchema,
} from './schemas/compliance-badge.schema';
import { Currency, CurrencySchema } from './schemas/currency.schema';
import {
  LatencyNode,
  LatencyNodeSchema,
} from './schemas/latency-node.schema';
import {
  LegalDocument,
  LegalDocumentSchema,
} from './schemas/legal-document.schema';
import {
  SiteSetting,
  SiteSettingSchema,
} from './schemas/site-setting.schema';
import {
  WorkspaceTier,
  WorkspaceTierSchema,
} from './schemas/workspace-tier.schema';
import { CmsSeedService } from '../database/cms-seed.service';

const cmsModels = [
  { name: CmsCopy.name, schema: CmsCopySchema },
  { name: Currency.name, schema: CurrencySchema },
  { name: WorkspaceTier.name, schema: WorkspaceTierSchema },
  { name: LegalDocument.name, schema: LegalDocumentSchema },
  { name: ComplianceBadge.name, schema: ComplianceBadgeSchema },
  { name: LatencyNode.name, schema: LatencyNodeSchema },
  { name: SiteSetting.name, schema: SiteSettingSchema },
];

@Module({
  imports: [MongooseModule.forFeature(cmsModels)],
  controllers: [CmsController],
  providers: [CmsService, CmsSeedService],
  exports: [CmsService, CmsSeedService],
})
export class CmsModule {}
