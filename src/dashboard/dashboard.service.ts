import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CmsCopy, CmsCopyDocument } from '../cms/schemas/cms-copy.schema';
import {
  DashboardIncident,
  DashboardIncidentDocument,
} from './schemas/dashboard-incident.schema';
import {
  DashboardMetric,
  DashboardMetricDocument,
} from './schemas/dashboard-metric.schema';
import {
  DashboardNavItem,
  DashboardNavItemDocument,
} from './schemas/dashboard-nav-item.schema';
import {
  DashboardOnboardingStep,
  DashboardOnboardingStepDocument,
} from './schemas/dashboard-onboarding-step.schema';
import {
  DashboardSnapshot,
  DashboardSnapshotDocument,
} from './schemas/dashboard-snapshot.schema';
import {
  DashboardSpatialNode,
  DashboardSpatialNodeDocument,
} from './schemas/dashboard-spatial-node.schema';
import {
  GettingStartedStep,
  GettingStartedStepDocument,
} from './schemas/getting-started-step.schema';
import { Workspace, WorkspaceDocument } from './schemas/workspace.schema';
import { AdvanceSetupDto } from './dto/advance-setup.dto';

@Injectable()
export class DashboardService {
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
    @InjectModel(Workspace.name)
    private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(CmsCopy.name)
    private readonly copyModel: Model<CmsCopyDocument>,
  ) {}

  private async getCopy(pageKey: string, locale = 'en') {
    const rows = await this.copyModel
      .find({ pageKey, locale })
      .select('fieldKey value')
      .lean()
      .exec();
    return Object.fromEntries(rows.map((r) => [r.fieldKey, r.value]));
  }

  private parseCsv(csv: string) {
    return csv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private formatCoords(lat: number, lng: number) {
    const latAbs = Math.abs(lat).toFixed(4);
    const lngAbs = Math.abs(lng).toFixed(4);
    const latHem = lat >= 0 ? 'N' : 'S';
    const lngHem = lng >= 0 ? 'E' : 'W';
    return `${latAbs}° ${latHem}, ${lngAbs}° ${lngHem}`;
  }

  private workspaceGeoLabel(workspace: WorkspaceDocument) {
    if (workspace.locationLabel?.trim()) {
      return workspace.locationLabel.trim();
    }
    if (
      typeof workspace.latitude === 'number' &&
      typeof workspace.longitude === 'number'
    ) {
      return this.formatCoords(workspace.latitude, workspace.longitude);
    }
    if (workspace.facilityLocation?.trim()) {
      return workspace.facilityLocation.trim();
    }
    return '';
  }

  private operatorFromWorkspace(
    workspace: WorkspaceDocument,
    operator: {
      displayName: string;
      email: string;
      workspaceTierCode: string;
    } | null,
  ) {
    const displayName =
      operator?.displayName?.trim() ||
      workspace.ownerDisplayName?.trim() ||
      '';
    const email =
      operator?.email?.trim() || workspace.ownerEmail?.trim() || '';
    return { displayName, email };
  }

  async ensureWorkspace(workspaceKey: string, tierCode?: string) {
    const key = workspaceKey.trim();
    if (!key || key.length < 8) {
      throw new BadRequestException('Please refresh and try again.');
    }

    try {
      const workspace = await this.workspaceModel.findOneAndUpdate(
        { workspaceKey: key },
        {
          $setOnInsert: {
            workspaceKey: key,
            setupComplete: false,
            completedStepsCsv: '',
            currentStepCode: 'welcome',
            facilityName: '',
            facilityLocation: '',
            locationLabel: '',
            ownerDisplayName: '',
            workspaceTierCode: tierCode?.toLowerCase() ?? '',
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      if (!workspace) {
        throw new BadRequestException('Please refresh and try again.');
      }
      return workspace;
    } catch (err) {
      // Concurrent overview polls can race on first create — recover by re-read.
      const code =
        err && typeof err === 'object' && 'code' in err
          ? (err as { code?: number }).code
          : undefined;
      if (code === 11000) {
        const existing = await this.workspaceModel.findOne({
          workspaceKey: key,
        });
        if (existing) return existing;
      }
      throw err;
    }
  }

  async getOverview(
    workspaceKey: string,
    options?: {
      tierCode?: string;
      authorization?: string;
      operator?: {
        displayName: string;
        email: string;
        workspaceTierCode: string;
      } | null;
    },
  ) {
    const workspace = await this.ensureWorkspace(
      workspaceKey,
      options?.tierCode,
    );

    if (options?.operator) {
      workspace.ownerEmail = options.operator.email;
      workspace.ownerDisplayName = options.operator.displayName;
      if (
        options.operator.workspaceTierCode &&
        !workspace.workspaceTierCode
      ) {
        workspace.workspaceTierCode = options.operator.workspaceTierCode;
      }
      await workspace.save();
    }

    const navItems = await this.navModel
      .find({ isActive: true })
      .sort({ groupSort: 1, sortOrder: 1 })
      .lean();

    const navGroupsMap = new Map<
      string,
      {
        code: string;
        title: string;
        sort: number;
        items: {
          code: string;
          href: string;
          label: string;
          icon: string;
          badge?: string;
        }[];
      }
    >();

    for (const item of navItems) {
      if (!navGroupsMap.has(item.groupCode)) {
        navGroupsMap.set(item.groupCode, {
          code: item.groupCode,
          title: item.groupTitle,
          sort: item.groupSort,
          items: [],
        });
      }
      navGroupsMap.get(item.groupCode)!.items.push({
        code: item.code,
        href: item.href,
        label: item.label,
        icon: item.icon,
        badge: item.badge,
      });
    }
    const navGroups = [...navGroupsMap.values()].sort((a, b) => a.sort - b.sort);

    const operator = options?.operator ?? null;

    if (!workspace.setupComplete) {
      return this.buildGettingStartedPayload(workspace, navGroups, operator);
    }

    return this.buildOperationalPayload(workspace, navGroups, operator);
  }

  private async buildGettingStartedPayload(
    workspace: WorkspaceDocument,
    navGroups: {
      code: string;
      title: string;
      items: {
        code: string;
        href: string;
        label: string;
        icon: string;
        badge?: string;
      }[];
    }[],
    operator: {
      displayName: string;
      email: string;
      workspaceTierCode: string;
    } | null,
  ) {
    const [copy, steps] = await Promise.all([
      this.getCopy('getting_started'),
      this.gsStepModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
    ]);

    if (!steps.length) {
      throw new NotFoundException(
        'We couldn’t load getting started right now. Please try again.',
      );
    }

    const completed = this.parseCsv(workspace.completedStepsCsv);
    const current =
      steps.find((s) => s.code === workspace.currentStepCode) ?? steps[0];

    const { displayName, email } = this.operatorFromWorkspace(
      workspace,
      operator,
    );
    const facility = workspace.facilityName?.trim();
    const geo = this.workspaceGeoLabel(workspace);
    const sectorLabel = facility
      ? `SECTOR: ${facility.toUpperCase()}`
      : (copy.sectorLabel ?? 'SECTOR: UNASSIGNED');
    const socLabel = facility || (copy.socLabel ?? 'PENDING');
    const geoLabel =
      geo || (copy.geoLabel ?? 'Pick a site on the map to continue');
    const operatorName = displayName || 'Operator';
    const operatorMeta =
      email || (copy.operatorMeta ?? 'Complete setup to activate clearance');

    return {
      mode: 'getting_started' as const,
      generatedAt: new Date().toISOString(),
      workspaceKey: workspace.workspaceKey,
      navGroups,
      shell: {
        brandSubtitle: copy.brandSubtitle ?? 'Sovereign GIS',
        scifLabel: copy.scifLabel ?? 'SETUP MODE',
        scifLevel: copy.scifLevel ?? 'NEW',
        sectorLabel,
        socLabel,
        enclaveLabel: copy.enclaveLabel ?? 'ENCLAVE: NOT PROVISIONED',
        geoLabel,
        operatorName,
        operatorMeta,
        creditsLabel: copy.creditsLabel ?? '0 Credits',
        creditsSub: copy.creditsSub ?? 'AFTER SETUP',
        creditsRemaining: 0,
        creditsTotal: 50,
        quotaLabel: copy.quotaLabel ?? 'Compute Quota',
        nodeLabel: copy.nodeLabel ?? 'Node: UNASSIGNED',
        nodeStatus: copy.nodeStatus ?? 'STANDBY',
        alertCount: 0,
        alertCountLabel: '0 ALERTS',
      },
      gettingStarted: {
        headline: copy.headline ?? 'Welcome to Aegis3D',
        subheadline:
          copy.subheadline ??
          'Your workspace is empty. Follow these steps to stand up your first facility twin.',
        progressLabel:
          copy.progressLabel ??
          `Step ${completed.length + 1} of ${steps.length}`,
        completedCount: completed.length,
        totalCount: steps.length,
        currentStepCode: current.code,
        facilityName: workspace.facilityName,
        facilityLocation: workspace.facilityLocation,
        latitude: workspace.latitude ?? null,
        longitude: workspace.longitude ?? null,
        locationLabel: workspace.locationLabel ?? '',
        steps: steps.map((s) => ({
          code: s.code,
          title: s.title,
          body: s.body,
          ctaLabel: s.ctaLabel,
          icon: s.icon,
          inputType: s.inputType,
          inputPlaceholder: s.inputPlaceholder,
          status: completed.includes(s.code)
            ? ('complete' as const)
            : s.code === current.code
              ? ('active' as const)
              : ('upcoming' as const),
        })),
      },
    };
  }

  private async buildOperationalPayload(
    workspace: WorkspaceDocument,
    navGroups: {
      code: string;
      title: string;
      items: {
        code: string;
        href: string;
        label: string;
        icon: string;
        badge?: string;
      }[];
    }[],
    operator: {
      displayName: string;
      email: string;
      workspaceTierCode: string;
    } | null,
  ) {
    const [template, metrics, steps, incidents, spatialNodes, copy] =
      await Promise.all([
        this.snapshotModel.findOne({ code: 'active', isActive: true }).lean(),
        this.metricModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
        this.stepModel.find({ isActive: true }).sort({ stepNumber: 1 }).lean(),
        this.incidentModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
        this.spatialModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
        this.getCopy('dashboard_empty'),
      ]);

    if (!template) {
      throw new NotFoundException(
        'We couldn’t load the command overview right now.',
      );
    }

    const facilityTitle =
      workspace.facilityName ||
      copy.defaultFacilityTitle ||
      'YOUR FACILITY // AWAITING INGEST';
    const geo = this.workspaceGeoLabel(workspace);
    const coordinates =
      geo ||
      copy.defaultCoordinates ||
      'Add coordinates in Layer Calibration';

    const { displayName, email } = this.operatorFromWorkspace(
      workspace,
      operator,
    );
    const operatorName = displayName || 'Operator';
    const operatorMeta = email || '';
    const sectorFromFacility = workspace.facilityName?.trim()
      ? `SECTOR: ${workspace.facilityName.trim().toUpperCase()}`
      : template.sectorLabel;

    // Fresh workspaces show empty ops surfaces (no demo incidents).
    void incidents;

    const emptyMetrics = metrics.map((m) => ({
      code: m.code,
      label: m.label,
      icon: m.icon,
      value: '—',
      delta: 'PENDING',
      deltaTone: 'neutral' as const,
      footerLeft: copy.metricEmptyLeft ?? 'No live feed yet',
      footerRight: copy.metricEmptyRight ?? 'COMPLETE SETUP LAYERS',
    }));

    const roots = spatialNodes.filter((n) => !n.parentCode);
    const spatialTree = roots.map((root) => ({
      code: root.code,
      label: root.label,
      icon: root.icon,
      visible: false,
      children: [] as {
        code: string;
        label: string;
        visible: boolean;
        statusLabel?: string;
        selected?: boolean;
      }[],
    }));

    const onboardingSteps = steps.map((s, idx) => ({
      stepNumber: s.stepNumber,
      status:
        idx === 0
          ? ('active' as const)
          : ('locked' as const),
      statusLabel: idx === 0 ? 'START HERE' : 'LOCKED',
      title: s.title,
      body: s.body,
      meta: idx === 0 ? 'Ready when you are' : 'Unlocks after previous step',
      metaRight: '',
      chips: [] as string[],
    }));

    return {
      mode: 'operational' as const,
      generatedAt: new Date().toISOString(),
      workspaceKey: workspace.workspaceKey,
      navGroups,
      snapshot: {
        facilityTitle,
        facilityStatus: copy.facilityStatus ?? 'SETUP COMPLETE',
        coordinates,
        altitude: copy.altitude ?? 'ALT —',
        spatialConfidence: copy.spatialConfidence ?? '0% Spatial Confidence',
        defconLabel: copy.defconLabel ?? 'DEFCON — // AWAITING FIRST INGEST',
        onboardingStepLabel: copy.onboardingStepLabel ?? 'Facility Setup (Step 1/4)',
        onboardingStep: 1,
        onboardingTotal: 4,
        onboardingEyebrow: copy.onboardingEyebrow ?? 'Next: ingest your facility',
        onboardingBadge: copy.onboardingBadge ?? 'New Workspace',
        onboardingHeadline:
          copy.onboardingHeadline ?? 'Bring your first digital twin online',
        onboardingHint:
          copy.onboardingHint ??
          'Upload CAD/GIS, bind cameras, then run your first crowd simulation. Nothing is live until you connect sources.',
        sectorLabel: sectorFromFacility,
        socLabel: workspace.facilityName?.trim() || template.socLabel,
        enclaveLabel: template.enclaveLabel,
        geoLabel: coordinates,
        operatorName,
        operatorMeta,
        creditsLabel: template.creditsLabel,
        creditsSub: template.creditsSub,
        creditsRemaining: template.creditsRemaining,
        creditsTotal: template.creditsTotal,
        quotaLabel: template.quotaLabel,
        nodeLabel: template.nodeLabel,
        nodeStatus: 'READY',
        scifLabel: template.scifLabel,
        scifLevel: template.scifLevel,
        brandSubtitle: template.brandSubtitle,
        alertCountLabel: '0 ALERTS',
        alertCount: 0,
        twinEngineLabel: copy.twinEngineLabel ?? 'ENGINE: IDLE — NO MESH LOADED',
        twinLatency: '—',
        twinRaycasts: '0 Streams',
        twinTriangles: '0',
        twinScale: copy.twinScale ?? 'Facility Scale: —',
        twinFilter: copy.twinFilter ?? 'Awaiting first CAD/GIS ingest',
        spatialLod: 'LOD —',
        raycastDensity: '—',
        precisionMode: 'Precision Mode: STANDBY',
      },
      metrics: emptyMetrics,
      onboardingSteps,
      incidents: [] as typeof incidents,
      spatialTree,
      shell: null,
      gettingStarted: null,
    };
  }

  async advanceSetup(
    workspaceKey: string,
    dto: AdvanceSetupDto,
    options?: {
      operator?: {
        displayName: string;
        email: string;
        workspaceTierCode: string;
      } | null;
    },
  ) {
    const workspace = await this.ensureWorkspace(workspaceKey);
    const overviewOptions = { operator: options?.operator ?? null };
    if (workspace.setupComplete) {
      return this.getOverview(workspaceKey, overviewOptions);
    }

    const steps = await this.gsStepModel
      .find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();
    const current =
      steps.find((s) => s.code === workspace.currentStepCode) ?? steps[0];
    if (!current) {
      throw new NotFoundException(
        'We couldn’t continue setup right now. Please try again.',
      );
    }

    if (dto.stepCode !== current.code) {
      throw new BadRequestException('Please complete the current step first.');
    }

    if (current.inputType === 'facility') {
      const name = dto.facilityName?.trim();
      if (!name || name.length < 2) {
        throw new BadRequestException('Please enter your facility name.');
      }
      workspace.facilityName = name;
    }

    if (current.inputType === 'location') {
      const lat = dto.latitude;
      const lng = dto.longitude;
      if (
        typeof lat !== 'number' ||
        typeof lng !== 'number' ||
        Number.isNaN(lat) ||
        Number.isNaN(lng)
      ) {
        throw new BadRequestException(
          'Please pick a location on the map to continue.',
        );
      }
      workspace.latitude = lat;
      workspace.longitude = lng;
      const label = dto.locationLabel?.trim();
      workspace.locationLabel = label ?? '';
      workspace.facilityLocation =
        label || this.formatCoords(lat, lng);
    }

    const completed = new Set(this.parseCsv(workspace.completedStepsCsv));
    completed.add(current.code);
    workspace.completedStepsCsv = [...completed].join(',');

    const idx = steps.findIndex((s) => s.code === current.code);
    const next = steps[idx + 1];

    if (!next) {
      workspace.setupComplete = true;
      workspace.setupCompletedAt = new Date();
      workspace.currentStepCode = current.code;
      await workspace.save();
      return this.getOverview(workspaceKey, overviewOptions);
    }

    workspace.currentStepCode = next.code;
    await workspace.save();
    return this.getOverview(workspaceKey, overviewOptions);
  }
}
