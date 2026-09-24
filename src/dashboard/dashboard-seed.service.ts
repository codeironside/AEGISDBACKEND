import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CmsCopy, CmsCopyDocument } from '../cms/schemas/cms-copy.schema';
import {
  DashboardIncident,
  DashboardIncidentDocument,
} from '../dashboard/schemas/dashboard-incident.schema';
import {
  DashboardMetric,
  DashboardMetricDocument,
} from '../dashboard/schemas/dashboard-metric.schema';
import {
  DashboardNavItem,
  DashboardNavItemDocument,
} from '../dashboard/schemas/dashboard-nav-item.schema';
import {
  DashboardOnboardingStep,
  DashboardOnboardingStepDocument,
} from '../dashboard/schemas/dashboard-onboarding-step.schema';
import {
  DashboardSnapshot,
  DashboardSnapshotDocument,
} from '../dashboard/schemas/dashboard-snapshot.schema';
import {
  DashboardSpatialNode,
  DashboardSpatialNodeDocument,
} from '../dashboard/schemas/dashboard-spatial-node.schema';
import {
  GettingStartedStep,
  GettingStartedStepDocument,
} from '../dashboard/schemas/getting-started-step.schema';

@Injectable()
export class DashboardSeedService implements OnModuleInit {
  private readonly logger = new Logger(DashboardSeedService.name);

  constructor(
    @InjectModel(DashboardNavItem.name)
    private readonly navModel: Model<DashboardNavItemDocument>,
    @InjectModel(DashboardMetric.name)
    private readonly metricModel: Model<DashboardMetricDocument>,
    @InjectModel(DashboardOnboardingStep.name)
    private readonly stepModel: Model<DashboardOnboardingStepDocument>,
    @InjectModel(DashboardIncident.name)
    private readonly incidentModel: Model<DashboardIncidentDocument>,
    @InjectModel(DashboardSpatialNode.name)
    private readonly spatialModel: Model<DashboardSpatialNodeDocument>,
    @InjectModel(DashboardSnapshot.name)
    private readonly snapshotModel: Model<DashboardSnapshotDocument>,
    @InjectModel(GettingStartedStep.name)
    private readonly gsStepModel: Model<GettingStartedStepDocument>,
    @InjectModel(CmsCopy.name)
    private readonly copyModel: Model<CmsCopyDocument>,
  ) {}

  async onModuleInit() {
    await this.ensureSeeded();
  }

  async ensureSeeded() {
    await Promise.all([
      this.seedSnapshot(),
      this.seedNav(),
      this.seedMetrics(),
      this.seedSteps(),
      this.seedIncidents(),
      this.seedSpatial(),
      this.seedGettingStarted(),
      this.seedGettingStartedCopy(),
      this.seedEmptyOpsCopy(),
    ]);
    this.logger.log('Dashboard seed ensured');
  }

  private async seedSnapshot() {
    await this.snapshotModel.updateOne(
      { code: 'active' },
      {
        $set: {
          code: 'active',
          facilityTitle: "SECTOR ALPHA-01 // ONITSHA INT'L CONVENTION CENTRE",
          facilityStatus: 'ACTIVE COMMAND',
          coordinates: 'LAT 6.1398° N, LON 6.7924° E',
          altitude: 'ALT 48.2m MSL',
          spatialConfidence: '94.2% Spatial Confidence',
          defconLabel: 'DEFCON 4 // NORMAL OPERATIONAL READY',
          onboardingStepLabel: 'Operator Onboarding (Step 2/4)',
          onboardingStep: 2,
          onboardingTotal: 4,
          onboardingEyebrow: 'Aegis3D Guided Operational Setup',
          onboardingBadge: 'SOC Clearance Stage II',
          onboardingHeadline: 'Interactive Operator Telemetry Calibration',
          onboardingHint:
            'Adjust layer visibility in the spatial matrix. The 3D twin maps raycasts in real time. Use Live Telemetry to commit QRF counter-measures.',
          sectorLabel: 'SECTOR: LAGOS METRO',
          socLabel: 'SOC-ALPHA',
          enclaveLabel: 'ENCLAVE: LOS-1 / ONLINE',
          geoLabel: '6.4541° N, 3.4246° E • ALT 14M',
          operatorName: 'Cmdr. O. Adeleke',
          operatorMeta: 'Lagos SOC • Clearance Level 5',
          creditsLabel: '48 Credits',
          creditsSub: 'REMAINING',
          creditsRemaining: 48,
          creditsTotal: 50,
          quotaLabel: 'Compute Quota',
          nodeLabel: 'Node: LAG-SCIF-09',
          nodeStatus: 'STABLE',
          scifLabel: 'SCIF ENCLAVE',
          scifLevel: 'SEC-IV',
          brandSubtitle: 'Sovereign GIS',
          alertCountLabel: '3 ALERTS',
          alertCount: 3,
          twinEngineLabel: 'ENGINE: WebGPU RENDERER 120 FPS',
          twinLatency: '14ms',
          twinRaycasts: '41 Streams',
          twinTriangles: '4.2M',
          twinScale: 'Facility Scale: 1:250 Metric',
          twinFilter: 'Raycast Occlusion Filter Engaged',
          spatialLod: 'LOD 3.5',
          raycastDensity: '1,000 pts/m²',
          precisionMode: 'Precision Mode: ULTRA',
          isActive: true,
        },
      },
      { upsert: true },
    );
  }

  private async seedNav() {
    const rows: Array<{
      groupCode: string;
      groupTitle: string;
      groupSort: number;
      code: string;
      href: string;
      label: string;
      icon: string;
      badge?: string;
      sortOrder: number;
    }> = [
      {
        groupCode: 'overview',
        groupTitle: 'Command Overview',
        groupSort: 1,
        code: 'active-overview',
        href: '/dashboard',
        label: 'Active Overview',
        icon: 'grid_view',
        badge: 'LIVE',
        sortOrder: 1,
      },
      {
        groupCode: 'twin',
        groupTitle: 'Digital Twin Engine',
        groupSort: 2,
        code: '3d-twin',
        href: '/dashboard/twin',
        label: '3D Twin Command',
        icon: 'view_in_ar',
        sortOrder: 1,
      },
      {
        groupCode: 'twin',
        groupTitle: 'Digital Twin Engine',
        groupSort: 2,
        code: 'layers',
        href: '/dashboard/layers',
        label: 'Layer Calibration',
        icon: 'layers',
        sortOrder: 2,
      },
      {
        groupCode: 'twin',
        groupTitle: 'Digital Twin Engine',
        groupSort: 2,
        code: 'cctv',
        href: '/dashboard/cctv',
        label: 'CCTV & ONVIF Cones',
        icon: 'videocam',
        sortOrder: 3,
      },
      {
        groupCode: 'threat',
        groupTitle: 'Threat Intelligence',
        groupSort: 3,
        code: 'bottlenecks',
        href: '/dashboard/bottlenecks',
        label: 'AI Bottlenecks',
        icon: 'crisis_alert',
        sortOrder: 1,
      },
      {
        groupCode: 'threat',
        groupTitle: 'Threat Intelligence',
        groupSort: 3,
        code: 'los',
        href: '/dashboard/los',
        label: 'Line-of-Sight Matrix',
        icon: 'radar',
        sortOrder: 2,
      },
      {
        groupCode: 'threat',
        groupTitle: 'Threat Intelligence',
        groupSort: 3,
        code: 'simulator',
        href: '/dashboard/simulator',
        label: 'Incident Simulator',
        icon: 'model_training',
        sortOrder: 3,
      },
      {
        groupCode: 'ops',
        groupTitle: 'Operations',
        groupSort: 4,
        code: 'recon',
        href: '/dashboard/recon',
        label: 'Field Mobile Recon',
        icon: 'satellite_alt',
        sortOrder: 1,
      },
      {
        groupCode: 'ops',
        groupTitle: 'Operations',
        groupSort: 4,
        code: 'dispatch',
        href: '/dashboard/dispatch',
        label: 'Dispatch Feeds',
        icon: 'dynamic_feed',
        sortOrder: 2,
      },
      {
        groupCode: 'ops',
        groupTitle: 'Operations',
        groupSort: 4,
        code: 'export',
        href: '/dashboard/export',
        label: 'Export Dossier',
        icon: 'sim_card_download',
        sortOrder: 3,
      },
      {
        groupCode: 'system',
        groupTitle: 'System & Clearance',
        groupSort: 5,
        code: 'scif',
        href: '/dashboard/scif',
        label: 'Sovereign SCIF Relay',
        icon: 'vpn_lock',
        sortOrder: 1,
      },
      {
        groupCode: 'system',
        groupTitle: 'System & Clearance',
        groupSort: 5,
        code: 'billing',
        href: '/dashboard/billing',
        label: 'Billing & Credits',
        icon: 'credit_score',
        sortOrder: 2,
      },
      {
        groupCode: 'system',
        groupTitle: 'System & Clearance',
        groupSort: 5,
        code: 'audit',
        href: '/dashboard/audit',
        label: 'NDPR Audit Logs',
        icon: 'policy',
        sortOrder: 3,
      },
    ];

    for (const row of rows) {
      await this.navModel.updateOne(
        { code: row.code },
        { $set: { ...row, isActive: true } },
        { upsert: true },
      );
    }
  }

  private async seedMetrics() {
    const metrics = [
      {
        code: 'los',
        label: 'Perimeter Line-of-Sight',
        icon: 'visibility',
        value: '98.4%',
        delta: '↑ 1.2%',
        deltaTone: 'up' as const,
        footerLeft: '3 North dock blindspots',
        footerRight: 'PTZ-11 AUTO-SLEW',
        sortOrder: 1,
      },
      {
        code: 'officers',
        label: 'Field Officers Deployed',
        icon: 'shield_person',
        value: '18 / 20',
        delta: 'ONLINE',
        deltaTone: 'neutral' as const,
        footerLeft: 'Enclave Relay: LAGOS-09',
        footerRight: '100% PTT SYNC',
        sortOrder: 2,
      },
      {
        code: 'census',
        label: 'Convention Census Influx',
        icon: 'groups',
        value: '42,800',
        delta: 'PEAK LOAD',
        deltaTone: 'warn' as const,
        footerLeft: 'Turnstiles: 1,120/min',
        footerRight: 'GATE 04 CONGESTED',
        sortOrder: 3,
      },
      {
        code: 'credits',
        label: 'GIS Simulation Compute',
        icon: 'bolt',
        value: '48',
        delta: '/ 50 CREDITS',
        deltaTone: 'neutral' as const,
        footerLeft: 'Auto-Recharge in 12d',
        footerRight: 'TIER 1 SOVEREIGN',
        sortOrder: 4,
      },
    ];

    for (const m of metrics) {
      await this.metricModel.updateOne(
        { code: m.code },
        { $set: { ...m, isActive: true } },
        { upsert: true },
      );
    }
  }

  private async seedSteps() {
    const steps = [
      {
        stepNumber: 1,
        status: 'complete' as const,
        statusLabel: 'PHASE COMPLETE',
        title: 'Ingest Facility CAD/GIS',
        body: 'BIM model aligned to WGS84 coordinates. 4-floor vertical slicing processed.',
        meta: 'Mesh: 142.8MB',
        metaRight: 'VERIFIED • 08:14',
        chipsCsv: '',
      },
      {
        stepNumber: 2,
        status: 'active' as const,
        statusLabel: 'ACTIVE CALIBRATION',
        title: 'Bind Live CCTV/ONVIF',
        body: 'Calculating volumetric field-of-view cones across 32 registered optical sensors.',
        meta: '',
        metaRight: '',
        chipsCsv: '30 of 32 Linked,2 Pending Ping',
      },
      {
        stepNumber: 3,
        status: 'next' as const,
        statusLabel: 'SIMULATION READY',
        title: 'Crowd Heatmaps & Bottlenecks',
        body: 'Predict dynamic flow thresholds and generate real-time chokepoint telemetry.',
        meta: 'Staging queued (1,400/min cap)',
        metaRight: '',
        chipsCsv: '',
      },
      {
        stepNumber: 4,
        status: 'locked' as const,
        statusLabel: 'STANDBY',
        title: 'Export Defense Dossier',
        body: 'Assemble NDPR-compliant emergency evacuation vector package.',
        meta: 'Unlocks on simulation pass',
        metaRight: '',
        chipsCsv: '',
      },
    ];

    for (const s of steps) {
      await this.stepModel.updateOne(
        { stepNumber: s.stepNumber },
        { $set: { ...s, isActive: true } },
        { upsert: true },
      );
    }
  }

  private async seedIncidents() {
    const incidents = [
      {
        code: 'gate04',
        severity: 'critical' as const,
        severityLabel: 'CRITICAL • CHOKEPOINT',
        title: 'Ingress Bottleneck at Gate 04',
        body: 'Crowd velocity exceeded 1,480 pax/min. Surge pressure detected at turnstiles 09-12.',
        timeLabel: '08:24:12',
        riskLabel: 'Risk Model: Vector Congestion',
        riskValue: '91% Probability',
        actionLabel: 'Deploy Auxiliary Barrier Vector',
        actionIcon: 'call_split',
        sortOrder: 1,
      },
      {
        code: 'ptz08',
        severity: 'moderate' as const,
        severityLabel: 'MODERATE • SENSOR',
        title: 'PTZ-08 Sightline Occlusion',
        body: 'Temporary canopy marquee obstructs 18° field cone towards North East exit.',
        timeLabel: '08:19:04',
        actionLabel: 'Recalibrate Line-of-Sight',
        actionIcon: 'tune',
        sortOrder: 2,
      },
      {
        code: 'bravo-battery',
        severity: 'info' as const,
        severityLabel: 'INFO • TELEMETRY',
        title: 'Field Unit Bravo Battery Low',
        body: 'Bodycam transmitter battery at 18%. Shift swap advised within 20 mins.',
        timeLabel: '08:11:45',
        metaLeft: 'Officer: Cpl. N. Okeke',
        metaAction: 'Route Relief',
        sortOrder: 3,
      },
    ];

    for (const i of incidents) {
      await this.incidentModel.updateOne(
        { code: i.code },
        { $set: { ...i, isActive: true } },
        { upsert: true },
      );
    }
  }

  private async seedSpatial() {
    const nodes = [
      {
        code: 'arena',
        label: 'Main Convention Arena',
        icon: 'domain',
        visible: true,
        sortOrder: 1,
      },
      {
        code: 'l0',
        parentCode: 'arena',
        label: 'Level 0: Subgrade Vaults',
        visible: true,
        sortOrder: 2,
      },
      {
        code: 'l1',
        parentCode: 'arena',
        label: 'Level 1: Grand Concourse',
        visible: true,
        selected: true,
        sortOrder: 3,
      },
      {
        code: 'l2',
        parentCode: 'arena',
        label: 'Level 2: Penthouse VVIP Suite',
        visible: false,
        sortOrder: 4,
      },
      {
        code: 'optics',
        label: 'Optical & Thermal Feeds',
        icon: 'videocam',
        visible: true,
        sortOrder: 10,
      },
      {
        code: 'ptz',
        parentCode: 'optics',
        label: 'PTZ-01..16 (Concourse)',
        visible: true,
        statusLabel: '16 LIVE',
        sortOrder: 11,
      },
      {
        code: 'fixed',
        parentCode: 'optics',
        label: 'Fixed Bullet 17..32',
        visible: true,
        statusLabel: '14 / 16 OK',
        sortOrder: 12,
      },
      {
        code: 'thermal',
        parentCode: 'optics',
        label: 'Thermal Flir Perimeters',
        visible: true,
        statusLabel: '4 ENGAGED',
        sortOrder: 13,
      },
      {
        code: 'evac',
        label: 'Evacuation Vectors',
        icon: 'alt_route',
        visible: true,
        sortOrder: 20,
      },
      {
        code: 'vvip',
        parentCode: 'evac',
        label: 'VVIP Primary Exit (Corridor-C)',
        visible: true,
        selected: true,
        statusLabel: 'ok',
        sortOrder: 21,
      },
      {
        code: 'triage',
        parentCode: 'evac',
        label: 'Emergency Triage Secondary',
        visible: true,
        sortOrder: 22,
      },
    ];

    for (const n of nodes) {
      await this.spatialModel.updateOne(
        { code: n.code },
        {
          $set: {
            parentCode: n.parentCode,
            label: n.label,
            icon: n.icon,
            visible: n.visible ?? true,
            selected: n.selected ?? false,
            statusLabel: n.statusLabel,
            sortOrder: n.sortOrder,
            isActive: true,
          },
        },
        { upsert: true },
      );
    }
  }

  private async seedGettingStarted() {
    const steps = [
      {
        code: 'welcome',
        title: 'Welcome to your workspace',
        body: 'Your command center starts empty — no demo facility, no fake alerts. We’ll walk you through standing up your first twin.',
        ctaLabel: 'Start setup',
        icon: 'waving_hand',
        inputType: 'none' as const,
        inputPlaceholder: '',
        sortOrder: 1,
      },
      {
        code: 'name_facility',
        title: 'Name your facility',
        body: 'What site are you securing? Use the venue or campus name operators will recognize.',
        ctaLabel: 'Save facility name',
        icon: 'apartment',
        inputType: 'facility' as const,
        inputPlaceholder: 'e.g. Lagos Convention Centre',
        sortOrder: 2,
      },
      {
        code: 'set_location',
        title: 'Set location',
        body: 'Click the map to drop a pin at your facility site. We’ll save latitude and longitude for your 3D twin anchor.',
        ctaLabel: 'Save map location',
        icon: 'pin_drop',
        inputType: 'location' as const,
        inputPlaceholder: '',
        sortOrder: 3,
      },
      {
        code: 'ready',
        title: 'You’re ready to ingest',
        body: 'Next you’ll upload CAD/GIS, bind cameras, and run simulations. Live metrics stay empty until those sources are connected.',
        ctaLabel: 'Open my workspace',
        icon: 'rocket_launch',
        inputType: 'none' as const,
        inputPlaceholder: '',
        sortOrder: 4,
      },
    ];

    for (const s of steps) {
      await this.gsStepModel.updateOne(
        { code: s.code },
        { $set: { ...s, isActive: true } },
        { upsert: true },
      );
    }
  }

  private async seedGettingStartedCopy() {
    const copy: Record<string, string> = {
      headline: 'Get started with Aegis3D',
      subheadline:
        'New workspaces have no live data yet. Complete these steps to provision your first facility.',
      progressLabel: 'Setup progress',
      brandSubtitle: 'Sovereign GIS',
      scifLabel: 'SETUP MODE',
      scifLevel: 'NEW',
      sectorLabel: 'SECTOR: UNASSIGNED',
      socLabel: 'PENDING',
      enclaveLabel: 'ENCLAVE: NOT PROVISIONED',
      geoLabel: 'Add your facility location to continue',
      operatorName: 'New Operator',
      operatorMeta: 'Complete setup to activate clearance',
      creditsLabel: '0 Credits',
      creditsSub: 'AFTER SETUP',
      quotaLabel: 'Compute Quota',
      nodeLabel: 'Node: UNASSIGNED',
      nodeStatus: 'STANDBY',
    };

    for (const [fieldKey, value] of Object.entries(copy)) {
      await this.copyModel.updateOne(
        { pageKey: 'getting_started', fieldKey, locale: 'en' },
        {
          $set: {
            pageKey: 'getting_started',
            fieldKey,
            locale: 'en',
            value,
          },
        },
        { upsert: true },
      );
    }
  }

  private async seedEmptyOpsCopy() {
    const copy: Record<string, string> = {
      facilityStatus: 'SETUP COMPLETE',
      altitude: 'ALT —',
      spatialConfidence: '0% Spatial Confidence',
      defconLabel: 'DEFCON — // AWAITING FIRST INGEST',
      onboardingStepLabel: 'Facility Setup (Step 1/4)',
      onboardingEyebrow: 'Next: ingest your facility',
      onboardingBadge: 'New Workspace',
      onboardingHeadline: 'Bring your first digital twin online',
      onboardingHint:
        'Upload CAD/GIS, bind cameras, then run your first crowd simulation. Nothing is live until you connect sources.',
      twinEngineLabel: 'ENGINE: IDLE — NO MESH LOADED',
      twinScale: 'Facility Scale: —',
      twinFilter: 'Awaiting first CAD/GIS ingest',
      metricEmptyLeft: 'No live feed yet',
      metricEmptyRight: 'CONNECT A SOURCE',
    };

    for (const [fieldKey, value] of Object.entries(copy)) {
      await this.copyModel.updateOne(
        { pageKey: 'dashboard_empty', fieldKey, locale: 'en' },
        {
          $set: {
            pageKey: 'dashboard_empty',
            fieldKey,
            locale: 'en',
            value,
          },
        },
        { upsert: true },
      );
    }
  }
}
