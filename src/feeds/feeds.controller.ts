import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { CreateFeedDto } from './dto/create-feed.dto';
import { PushFrameDto } from './dto/push-frame.dto';
import { FeedsService } from './feeds.service';

@Controller('feeds')
export class FeedsController {
  constructor(private readonly feeds: FeedsService) {}

  @Post()
  create(@Body() dto: CreateFeedDto) {
    const session = this.feeds.create(dto);
    return {
      token: session.token,
      label: session.label,
      metricCode: session.metricCode,
      workspaceKey: session.workspaceKey,
      createdAt: session.createdAt,
    };
  }

  @Get(':token/status')
  status(@Param('token') token: string) {
    return this.feeds.status(token);
  }

  @Post(':token/heartbeat')
  heartbeat(@Param('token') token: string) {
    return this.feeds.heartbeat(token);
  }

  @Post(':token/frame')
  pushFrame(@Param('token') token: string, @Body() dto: PushFrameDto) {
    return this.feeds.pushFrame(token, dto.frameBase64, dto.mimeType);
  }

  @Get(':token/frame')
  frame(@Param('token') token: string, @Res({ passthrough: true }) res: Response) {
    const latest = this.feeds.latestFrame(token);
    if (!latest) {
      res.status(204);
      return;
    }
    res.set({
      'Content-Type': latest.mimeType,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    });
    return new StreamableFile(latest.data);
  }
}
