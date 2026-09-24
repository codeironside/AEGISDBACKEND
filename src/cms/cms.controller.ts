import { Controller, Get, Param, Query } from '@nestjs/common';
import { CmsService } from './cms.service';

@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get('pages/register')
  getRegisterPage(@Query('locale') locale?: string) {
    return this.cmsService.getRegisterPage(locale ?? 'en');
  }

  @Get('legal/:slug')
  getLegal(@Param('slug') slug: string) {
    return this.cmsService.getLegalDocument(slug);
  }

  @Get('currency/default')
  getDefaultCurrency() {
    return this.cmsService.getDefaultCurrency();
  }
}
