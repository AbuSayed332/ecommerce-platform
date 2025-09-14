import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicator } from '@nestjs/terminus';
import * as os from 'os';
import * as process from 'process';

export interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercentage: number;
    heap: {
      total: number;
      used: number;
      usagePercentage: number;
    };
  };
  uptime: {
    system: number;
    process: number;
  };
  platform: {
    type: string;
    release: string;
    hostname: string;
    arch: string;
  };
}

export interface ApplicationMetrics {
  nodejs: {
    version: string;
    uptime: number;
    pid: number;
    ppid: number;
  };
  environment: string;
  timestamp: string;
  requests: {
    total: number;
    active: number;
  };
  errors: {
    total: number;
    rate: number;
  };
}

@Injectable()
export class HealthService extends HealthIndicator {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;
  private activeRequests = 0;

  constructor() {
    super();
  }

  async isAlive(key: string): Promise<HealthIndicatorResult> {
    const isHealthy = true; // Application is running if this method executes
    
    const result = this.getStatus(key, isHealthy, {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      pid: process.pid,
    });

    if (isHealthy) {
      this.logger.debug(`${key} is alive`);
      return result;
    }

    throw new Error(`${key} is not alive`);
  }

  async isReady(key: string): Promise<HealthIndicatorResult> {
    // Add your readiness logic here
    // For example: check if all required services are initialized
    const isHealthy = await this.checkApplicationReadiness();
    
    const result = this.getStatus(key, isHealthy, {
      ready: isHealthy,
      timestamp: new Date().toISOString(),
    });

    if (isHealthy) {
      this.logger.debug(`${key} is ready`);
      return result;
    }

    throw new Error(`${key} is not ready`);
  }

  async checkExternalServices(): Promise<HealthIndicatorResult> {
    const key = 'external_services';
    
    try {
      // Add your external service checks here
      const checks = await Promise.allSettled([
        // this.checkRedis(),
        // this.checkElasticsearch(),
        // this.checkExternalAPI(),
        Promise.resolve({ status: 'ok', service: 'placeholder' }),
      ]);

      const failedChecks = checks.filter(check => check.status === 'rejected');
      const isHealthy = failedChecks.length === 0;

      const result = this.getStatus(key, isHealthy, {
        total: checks.length,
        passed: checks.length - failedChecks.length,
        failed: failedChecks.length,
        details: checks.map((check, index) => ({
          index,
          status: check.status,
          ...(check.status === 'fulfilled' ? { value: check.value } : { reason: check.reason }),
        })),
      });

      if (isHealthy) {
        this.logger.debug('All external services are healthy');
        return result;
      }

      throw new Error(`${failedChecks.length} external service(s) are unhealthy`);
    } catch (error) {
      this.logger.error('Error checking external services:', error);
      throw error;
    }
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      cpu: {
        usage: await this.getCPUUsage(),
        loadAverage: os.loadavg(),
        cores: os.cpus().length,
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usagePercentage: (usedMemory / totalMemory) * 100,
        heap: {
          total: memUsage.heapTotal,
          used: memUsage.heapUsed,
          usagePercentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        },
      },
      uptime: {
        system: os.uptime(),
        process: process.uptime(),
      },
      platform: {
        type: os.type(),
        release: os.release(),
        hostname: os.hostname(),
        arch: os.arch(),
      },
    };
  }

  async getApplicationMetrics(): Promise<ApplicationMetrics> {
    const uptime = Date.now() - this.startTime;
    
    return {
      nodejs: {
        version: process.version,
        uptime: process.uptime(),
        pid: process.pid,
        ppid: process.ppid,
      },
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      requests: {
        total: this.requestCount,
        active: this.activeRequests,
      },
      errors: {
        total: this.errorCount,
        rate: this.errorCount / Math.max(this.requestCount, 1),
      },
    };
  }

  // Helper methods for tracking metrics
  incrementRequestCount(): void {
    this.requestCount++;
  }

  incrementActiveRequests(): void {
    this.activeRequests++;
  }

  decrementActiveRequests(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
  }

  incrementErrorCount(): void {
    this.errorCount++;
  }

  // Private helper methods
  private async checkApplicationReadiness(): Promise<boolean> {
    try {
      // Add your specific readiness checks here
      // For example:
      // - Database connection is established
      // - Required configuration is loaded
      // - Cache is initialized
      // - External services are reachable
      
      return true; // Replace with actual readiness logic
    } catch (error) {
      this.logger.error('Application readiness check failed:', error);
      return false;
    }
  }

  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      
      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const totalUsage = currentUsage.user + currentUsage.system;
        const percentage = (totalUsage / 1000000) * 100; // Convert to percentage
        resolve(Math.min(percentage, 100));
      }, 100);
    });
  }
}