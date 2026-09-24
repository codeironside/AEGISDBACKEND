import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  check() {
    return {
      status: 'ok',
      service: 'aegis3d-api',
      mongo: this.connection.readyState === 1 ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    };
  }
}
