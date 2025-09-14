import { IsOptional, IsString, IsDateString, IsEnum, IsArray, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum TimePeriod {
  HOUR = '1h',
  DAY = '1d',
  WEEK = '7d',
  MONTH = '30d',
  QUARTER = '90d',
  YEAR = '365d'
}

export enum MetricType {
  USERS = 'users',
  REVENUE = 'revenue',
  CONVERSIONS = 'conversions',
  PAGE_VIEWS = 'page_views',
  SESSIONS = 'sessions'
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ 
    description: 'Time period for analytics data',
    enum: TimePeriod,
    default: TimePeriod.WEEK
  })
  @IsOptional()
  @IsEnum(TimePeriod)
  period?: TimePeriod;

  @ApiPropertyOptional({ 
    description: 'Start date for custom date range',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'End date for custom date range',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Specific metrics to retrieve',
    enum: MetricType,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(MetricType, { each: true })
  metrics?: MetricType[];

  @ApiPropertyOptional({ 
    description: 'Group results by time interval',
    example: 'day'
  })
  @IsOptional()
  @IsString()
  groupBy?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by specific criteria',
    example: 'country:US,device:mobile'
  })
  @IsOptional()
  @IsString()
  filters?: string;

  @ApiPropertyOptional({ 
    description: 'Number of results to return',
    minimum: 1,
    maximum: 1000,
    default: 100
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ 
    description: 'Number of results to skip',
    minimum: 0,
    default: 0
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  offset?: number;
}