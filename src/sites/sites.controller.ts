import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { SitesService } from './sites.service';
@Controller('sites')
export class SitesController {
  constructor(
    private readonly sites: SitesService,
    private readonly auth: AuthService,
  ) {}
  private async owner(authorization?: string) {
    const profile = await this.auth.getSessionProfile(authorization);
    if (!profile?.email)
      throw new UnauthorizedException('Please sign in to manage locations.');
    return profile.email.toLowerCase();
  }
  @Get() async list(@Headers('authorization') authorization?: string) {
    return this.sites.list(await this.owner(authorization));
  }
  @Post() async create(
    @Body() body: unknown,
    @Headers('authorization') authorization?: string,
  ) {
    return this.sites.create(await this.owner(authorization), body);
  }
  @Patch(':id/configuration') async configure(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authorization?: string,
  ) {
    return this.sites.configure(await this.owner(authorization), id, body);
  }
  @Put(':id') async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authorization?: string,
  ) {
    return this.sites.update(await this.owner(authorization), id, body);
  }
}
