import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const SENSITIVE_QUERY = new Set([
  'code',
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'client_secret',
  'password',
]);

function redactUrl(originalUrl: string): string {
  try {
    const q = originalUrl.indexOf('?');
    if (q < 0) return originalUrl;
    const path = originalUrl.slice(0, q);
    const params = new URLSearchParams(originalUrl.slice(q + 1));
    for (const key of [...params.keys()]) {
      if (SENSITIVE_QUERY.has(key.toLowerCase())) {
        params.set(key, '[redacted]');
      }
    }
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  } catch {
    return originalUrl;
  }
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const started = Date.now();
    const { method } = req;
    const url = redactUrl(req.originalUrl || req.url);
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      '-';

    res.on('finish', () => {
      const ms = Date.now() - started;
      const { statusCode } = res;
      const line = `${method} ${url} ${statusCode} ${ms}ms — ${ip}`;

      if (statusCode >= 500) {
        this.logger.error(line);
      } else if (statusCode >= 400) {
        this.logger.warn(line);
      } else {
        this.logger.log(line);
      }
    });

    next();
  }
}
