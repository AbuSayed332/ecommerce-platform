import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  NOTIFICATION = 'notification',
  SYSTEM = 'system',
  CUSTOM = 'custom',
}

export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class WebsocketMessageDto {
  @IsEnum(MessageType)
  type: MessageType;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  room?: string;

  @IsOptional()
  @IsString()
  targetClientId?: string;

  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100 * 1024 * 1024) // 100MB max
  fileSize?: number;

  @IsOptional()
  @IsString()
  fileType?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  replyTo?: string;

  @IsOptional()
  @IsString()
  threadId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ttl?: number; // Time to live in seconds
}