import { Controller, Get, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Full health check' })
  async healthCheck() {
    return this.healthService.check();
  }

  @Get('live')
  @HttpCode(200)
  @ApiOperation({ summary: 'Liveness probe (Kubernetes)' })
  liveness() {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @HttpCode(200)
  @ApiOperation({ summary: 'Readiness probe (Kubernetes)' })
  async readiness() {
    return this.healthService.getReadiness();
  }
}
