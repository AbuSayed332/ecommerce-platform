import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { HealthService } from './health.service';
import * as path from 'path';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly healthService: HealthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Check overall application health' })
  @ApiResponse({ 
    status: 200, 
    description: 'Health check completed',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: { type: 'object' },
        error: { type: 'object' },
        details: { type: 'object' }
      }
    }
  })
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    this.logger.log('Performing health check');
    
    return this.health.check([
      // Database health check
      () => this.mongoose.pingCheck('database'),
      
      // Memory health check (heap should not exceed 150MB)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      
      // Memory RSS check (should not exceed 300MB)
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
      
      // Disk health check (should have at least 250GB free space)
      () => this.disk.checkStorage('storage', {
        path: path.parse(process.cwd()).root,
        thresholdPercent: 0.8, // Alert when 80% full
      }),
    ]);
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe - check if application is running' })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  @HealthCheck()
  checkLiveness(): Promise<HealthCheckResult> {
    this.logger.log('Performing liveness check');
    
    return this.health.check([
      // Basic liveness check
      () => this.healthService.isAlive('app'),
    ]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe - check if application is ready to serve traffic' })
  @ApiResponse({ status: 200, description: 'Application is ready' })
  @HealthCheck()
  checkReadiness(): Promise<HealthCheckResult> {
    this.logger.log('Performing readiness check');
    
    return this.health.check([
      // Database readiness
      () => this.mongoose.pingCheck('database'),
      
      // External service checks (uncomment and configure as needed)
      // () => this.http.pingCheck('redis', 'http://localhost:6379'),
      // () => this.http.pingCheck('external_api', 'https://api.example.com/health'),
      
      // Custom readiness checks
      () => this.healthService.isReady('app'),
    ]);
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health information including metrics' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  async getDetailedHealth() {
    this.logger.log('Fetching detailed health information');
    
    try {
      const [
        basicHealth,
        systemMetrics,
        applicationMetrics,
      ] = await Promise.all([
        this.check(),
        this.healthService.getSystemMetrics(),
        this.healthService.getApplicationMetrics(),
      ]);

      return {
        health: basicHealth,
        system: systemMetrics,
        application: applicationMetrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error fetching detailed health information:', error);
      throw error;
    }
  }

  @Get('external')
  @ApiOperation({ summary: 'Check external services health' })
  @ApiResponse({ status: 200, description: 'External services health check' })
  @HealthCheck()
  checkExternalServices(): Promise<HealthCheckResult> {
    this.logger.log('Checking external services health');
    
    return this.health.check([
      // Add your external service checks here
      // () => this.http.pingCheck('redis', 'redis://localhost:6379'),
      // () => this.http.pingCheck('elasticsearch', 'http://localhost:9200'),
      // () => this.http.pingCheck('external_api', 'https://api.external-service.com/health'),
      
      // Custom external service checks
      () => this.healthService.checkExternalServices(),
    ]);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get application metrics' })
  @ApiResponse({ status: 200, description: 'Application metrics' })
  async getMetrics() {
    this.logger.log('Fetching application metrics');
    
    try {
      const metrics = await this.healthService.getApplicationMetrics();
      return {
        ...metrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error fetching metrics:', error);
      throw error;
    }
  }
}