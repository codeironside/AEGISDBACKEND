import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

const FRIENDLY: Record<number, string> = {
  400: 'Please check your details and try again.',
  401: 'Please sign in to continue.',
  403: 'You don’t have permission to do that.',
  404: 'We couldn’t find what you were looking for.',
  409: 'That action conflicts with an existing record.',
  422: 'Some details look invalid. Please review and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our side. Please try again shortly.',
  502: 'This service is temporarily unavailable. Please try again shortly.',
  503: 'This service is temporarily unavailable. Please try again shortly.',
};

function isSafePublicMessage(message: unknown): message is string {
  if (typeof message !== 'string') return false;
  const lower = message.toLowerCase();
  // Never forward internal/CMS/infra wording to clients.
  const blocked = [
    'cms',
    'mongo',
    'mongoose',
    'database',
    'configured',
    'stack',
    'exception',
    'enoent',
    'econn',
    'timeout',
    'internal',
    'nestjs',
    'path',
    'uri',
  ];
  if (blocked.some((b) => lower.includes(b))) return false;
  if (message.length > 160) return false;
  return true;
}

@Catch()
export class FriendlyHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(FriendlyHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let technical: unknown = exception;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      technical = exception.getResponse();
    }

    this.logger.error(
      `${request.method} ${request.url} → ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    let message = FRIENDLY[status] ?? FRIENDLY[500];

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      const raw =
        typeof payload === 'string'
          ? payload
          : Array.isArray((payload as { message?: unknown }).message)
            ? (payload as { message: string[] }).message[0]
            : (payload as { message?: unknown }).message;

      // Allow only short, non-technical client validation hints (e.g. consent).
      if (status < 500 && isSafePublicMessage(raw)) {
        message = raw;
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      // No path / stack / Nest internals exposed to clients.
    });

    void technical;
  }
}
