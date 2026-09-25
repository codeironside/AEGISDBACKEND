import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { CmsModule } from './cms/cms.module';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { resolveMongoUri } from './database/mongo-uri';
import { DashboardModule } from './dashboard/dashboard.module';
import { LandingModule } from './landing/landing.module';
import { FeedsModule } from './feeds/feeds.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const preferred = config.getOrThrow<string>('mongodbUri');
        const nodeEnv = config.get<string>('nodeEnv') ?? 'development';
        const uri = await resolveMongoUri(preferred, nodeEnv);
        return {
          uri,
          serverSelectionTimeoutMS: 10_000,
        };
      },
    }),
    HealthModule,
    CmsModule,
    DashboardModule,
    LandingModule,
    FeedsModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('{*path}');
  }
}