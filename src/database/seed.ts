/**
 * CLI seed entry — same logic as CmsSeedService on boot.
 * Run: npm run seed
 */
import { setServers } from 'node:dns';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CmsSeedService } from './cms-seed.service';
import { DashboardSeedService } from '../dashboard/dashboard-seed.service';

setServers(['8.8.8.8', '1.1.1.1']);

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  await app.get(CmsSeedService).ensureSeeded();
  await app.get(DashboardSeedService).ensureSeeded();
  await app.close();
}

void seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
