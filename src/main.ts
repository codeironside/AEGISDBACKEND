import { setServers } from 'node:dns';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { FriendlyHttpExceptionFilter } from './common/filters/friendly-http-exception.filter';

// Windows/ISP resolvers often refuse SRV lookups that mongodb+srv needs.
// Prefer public DNS before Mongoose connects during Nest bootstrap.
setServers(['8.8.8.8', '1.1.1.1']);

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  const config = app.get(ConfigService);

  // Allow JPEG frame uploads for live mobile feeds (~1.5MB base64).
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ extended: true, limit: '2mb' }));

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Reflect request origin so Cloudflare quick tunnels + localhost work.
      // Production should set CORS_ORIGIN to an explicit allow-list.
      const configured = config.get<string>('cors.origin');
      if (!origin) return callback(null, true);
      if (!configured || configured === '*') return callback(null, true);
      const allowed = configured.split(',').map((s) => s.trim());
      if (
        allowed.includes(origin) ||
        /\.trycloudflare\.com$/i.test(origin) ||
        /localhost|127\.0\.0\.1/i.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  });

  app.setGlobalPrefix('v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new FriendlyHttpExceptionFilter());

  const port = config.get<number>('port') ?? 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Aegis3D API listening on :${port}`);
}

void bootstrap();
