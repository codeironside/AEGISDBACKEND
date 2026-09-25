import { randomBytes } from 'crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

export type LiveFeedSession = {
  token: string;
  workspaceKey: string;
  label: string;
  metricCode: string;
  createdAt: number;
  lastFrameAt: number | null;
  frameBase64: string | null;
  mimeType: string;
  broadcasterConnected: boolean;
  viewerCount: number;
};

@Injectable()
export class FeedsService {
  private readonly feeds = new Map<string, LiveFeedSession>();
  private readonly TTL_MS = 60 * 60 * 1000; // 1 hour

  create(input: {
    workspaceKey: string;
    label?: string;
    metricCode?: string;
  }): LiveFeedSession {
    this.gc();
    const token = randomBytes(16).toString('hex');
    const session: LiveFeedSession = {
      token,
      workspaceKey: input.workspaceKey.trim() || 'unknown',
      label: input.label?.trim() || 'Mobile Live Feed',
      metricCode: input.metricCode?.trim() || 'perimeter_los',
      createdAt: Date.now(),
      lastFrameAt: null,
      frameBase64: null,
      mimeType: 'image/jpeg',
      broadcasterConnected: false,
      viewerCount: 0,
    };
    this.feeds.set(token, session);
    return session;
  }

  get(token: string): LiveFeedSession {
    this.gc();
    const session = this.feeds.get(token);
    if (!session) {
      throw new NotFoundException('This live feed link has expired or is invalid.');
    }
    return session;
  }

  heartbeat(token: string) {
    const session = this.get(token);
    session.broadcasterConnected = true;
    return {
      token: session.token,
      label: session.label,
      broadcasterConnected: true,
      hasFrame: Boolean(session.frameBase64),
      lastFrameAt: session.lastFrameAt,
    };
  }

  pushFrame(token: string, frameBase64: string, mimeType = 'image/jpeg') {
    const session = this.get(token);
    // Cap ~1.5MB base64 to protect memory
    if (frameBase64.length > 1_800_000) {
      throw new BadRequestException('Frame too large. Reduce quality and try again.');
    }
    session.frameBase64 = frameBase64;
    session.mimeType = mimeType || 'image/jpeg';
    session.lastFrameAt = Date.now();
    session.broadcasterConnected = true;
    return {
      ok: true,
      lastFrameAt: session.lastFrameAt,
    };
  }

  status(token: string) {
    const session = this.get(token);
    const live =
      session.broadcasterConnected &&
      session.lastFrameAt != null &&
      Date.now() - session.lastFrameAt < 8_000;
    return {
      token: session.token,
      label: session.label,
      metricCode: session.metricCode,
      workspaceKey: session.workspaceKey,
      broadcasterConnected: session.broadcasterConnected,
      live,
      hasFrame: Boolean(session.frameBase64),
      lastFrameAt: session.lastFrameAt,
      createdAt: session.createdAt,
    };
  }

  latestFrame(token: string): { mimeType: string; data: Buffer } | null {
    const session = this.get(token);
    if (!session.frameBase64) return null;
    return {
      mimeType: session.mimeType,
      data: Buffer.from(session.frameBase64, 'base64'),
    };
  }

  private gc() {
    const now = Date.now();
    for (const [token, session] of this.feeds) {
      if (now - session.createdAt > this.TTL_MS) {
        this.feeds.delete(token);
      }
    }
  }
}
