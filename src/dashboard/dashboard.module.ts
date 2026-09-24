import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { CmsCopy, CmsCopySchema } from '../cms/schemas/cms-copy.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardSeedService } from './dashboard-seed.service';
import { DashboardService } from './dashboard.service';
import {
  DashboardIncident,
  DashboardIncidentSchema,
} from './schemas/dashboard-incident.schema';
import {
  DashboardMetric,
  DashboardMetricSchema,
} from './schemas/dashboard-metric.schema';
import {
  DashboardNavItem,
  DashboardNavItemSchema,
} from './schemas/dashboard-nav-item.schema';
import {
  DashboardOnboardingStep,
  DashboardOnboardingStepSchema,
} from './schemas/dashboard-onboarding-step.schema';
import {
  DashboardSnapshot,
  DashboardSnapshotSchema,
} from './schemas/dashboard-snapshot.schema';
import {
  DashboardSpatialNode,
  DashboardSpatialNodeSchema,
} from './schemas/dashboard-spatial-node.schema';
import {
  GettingStartedStep,
  GettingStartedStepSchema,
} from './schemas/getting-started-step.schema';
import { Workspace, WorkspaceSchema } from './schemas/workspace.schema';

const models = [
  { name: DashboardNavItem.name, schema: DashboardNavItemSchema },
  { name: DashboardMetric.name, schema: DashboardMetricSchema },
  { name: DashboardOnboardingStep.name, schema: DashboardOnboardingStepSchema },
  { name: DashboardIncident.name, schema: DashboardIncidentSchema },
  { name: DashboardSpatialNode.name, schema: DashboardSpatialNodeSchema },
  { name: DashboardSnapshot.name, schema: DashboardSnapshotSchema },
  { name: GettingStartedStep.name, schema: GettingStartedStepSchema },
  { name: Workspace.name, schema: WorkspaceSchema },
  { name: CmsCopy.name, schema: CmsCopySchema },
];

@Module({
  imports: [AuthModule, MongooseModule.forFeature(models)],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardSeedService],
  exports: [DashboardService, DashboardSeedService],
})
export class DashboardModule {}
