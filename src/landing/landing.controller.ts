import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { GenerateTwinDto } from './dto/generate-twin.dto';
import { LandingService } from './landing.service';

@Controller('landing')
export class LandingController {
  constructor(private readonly landingService: LandingService) {}

  @Get('hero')
  getHero(@Query('locale') locale?: string) {
    return this.landingService.getHeroPage(locale ?? 'en');
  }

  @Get('twin/usage')
  getUsage(
    @Headers('authorization') authorization?: string,
    @Query('subjectKey') subjectKey?: string,
  ) {
    return this.landingService.getUsage(authorization, subjectKey);
  }

  @Post('twin/generate')
  generate(
    @Body() dto: GenerateTwinDto,
    @Headers('authorization') authorization?: string,
  ) {
    return this.landingService.generateTwin(dto, authorization);
  }
}
