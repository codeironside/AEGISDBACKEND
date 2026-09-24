import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { StartGoogleDto } from './dto/start-google.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google/start')
  startGoogle(@Body() dto: StartGoogleDto) {
    return this.authService.startGoogleSso(dto);
  }

  @Get('me')
  async me(@Headers('authorization') authorization?: string) {
    const profile = await this.authService.getSessionProfile(authorization);
    if (!profile) {
      throw new UnauthorizedException('Please sign in to continue.');
    }
    return profile;
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    const redirectUrl = await this.authService.completeGoogleCallback({
      code,
      state,
      error,
    });
    return res.redirect(redirectUrl);
  }
}
