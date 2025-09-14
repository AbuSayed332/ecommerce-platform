import { Controller, Get, Query, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto';
import { AnalyticsResponse } from './interfaces';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard analytics' })
  @ApiResponse({ status: 200, description: 'Dashboard analytics retrieved successfully' })
  async getDashboardAnalytics(@Query() query: AnalyticsQueryDto): Promise<AnalyticsResponse> {
    return this.analyticsService.getDashboardAnalytics(query);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get specific metrics' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  async getMetrics(@Query() query: AnalyticsQueryDto): Promise<AnalyticsResponse> {
    return this.analyticsService.getMetrics(query);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get analytics reports' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async getReports(@Query() query: AnalyticsQueryDto): Promise<AnalyticsResponse> {
    return this.analyticsService.getReports(query);
  }

  @Post('track')
  @ApiOperation({ summary: 'Track analytics event' })
  @ApiResponse({ status: 201, description: 'Event tracked successfully' })
  async trackEvent(@Body() eventData: any): Promise<{ success: boolean; message: string }> {
    return this.analyticsService.trackEvent(eventData);
  }
}