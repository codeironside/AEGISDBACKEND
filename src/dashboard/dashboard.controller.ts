import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { DashboardService } from './dashboard.service';
import { AdvanceSetupDto } from './dto/advance-setup.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly authService: AuthService,
  ) {}

  private async resolveOperator(authorization?: string) {
    const profile = await this.authService.getSessionProfile(authorization);
    if (!profile) return null;
    return {
      displayName: profile.displayName,
      email: profile.email,
      workspaceTierCode: profile.workspaceTierCode,
    };
  }

  @Get('overview')
  async getOverview(
    @Headers('authorization') authorization?: string,
    @Headers('x-workspace-key') workspaceKey?: string,
    @Query('workspaceKey') workspaceKeyQuery?: string,
    @Query('tier') tier?: string,
  ) {
    const key = workspaceKey || workspaceKeyQuery;
    const operator = await this.resolveOperator(authorization);
    const options = { tierCode: tier, operator };
    if (!key) {
      return this.dashboardService.getOverview(
        'pending-client-key-bootstrap',
        options,
      );
    }
    return this.dashboardService.getOverview(key, options);
  }

  @Post('setup/advance')
  async advanceSetup(
    @Body() dto: AdvanceSetupDto,
    @Headers('authorization') authorization?: string,
    @Headers('x-workspace-key') workspaceKey?: string,
    @Query('workspaceKey') workspaceKeyQuery?: string,
  ) {
    const key = workspaceKey || workspaceKeyQuery;
    const operator = await this.resolveOperator(authorization);
    const options = { operator };
    if (!key) {
      return this.dashboardService.advanceSetup(
        'pending-client-key-bootstrap',
        dto,
        options,
      );
    }
    return this.dashboardService.advanceSetup(key, dto, options);
  }
}
