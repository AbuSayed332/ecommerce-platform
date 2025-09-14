import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto';
import {
  NotificationResponse,
  NotificationListResponse,
  NotificationStatsResponse,
} from './interfaces';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendNotification(
    @Body(ValidationPipe) sendNotificationDto: SendNotificationDto,
  ): Promise<NotificationResponse> {
    return this.notificationsService.sendNotification(sendNotificationDto);
  }

  @Post('send-bulk')
  @HttpCode(HttpStatus.OK)
  async sendBulkNotifications(
    @Body() body: {
      recipients: string[];
      notification: Omit<SendNotificationDto, 'recipient'>;
    },
  ): Promise<NotificationResponse[]> {
    return this.notificationsService.sendBulkNotifications(
      body.recipients,
      body.notification,
    );
  }

  @Post('schedule')
  @HttpCode(HttpStatus.CREATED)
  async scheduleNotification(
    @Body() body: {
      notification: SendNotificationDto;
      scheduledAt: Date;
      timezone?: string;
    },
  ): Promise<NotificationResponse> {
    return this.notificationsService.scheduleNotification(
      body.notification,
      body.scheduledAt,
      body.timezone,
    );
  }

  @Get()
  async getNotifications(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('userId') userId?: string,
    @Query('channel') channel?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<NotificationListResponse> {
    return this.notificationsService.getNotifications({
      page,
      limit,
      userId,
      channel,
      type,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('user/:userId')
  async getUserNotifications(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('unreadOnly') unreadOnly: boolean = false,
  ): Promise<NotificationListResponse> {
    return this.notificationsService.getUserNotifications(userId, {
      page,
      limit,
      unreadOnly,
    });
  }

  @Get(':id')
  async getNotificationById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationResponse> {
    return this.notificationsService.getNotificationById(id);
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body?: { userId?: string },
  ): Promise<NotificationResponse> {
    return this.notificationsService.markAsRead(id, body?.userId);
  }

  @Put('user/:userId/mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<{ success: boolean; markedCount: number }> {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.notificationsService.deleteNotification(id);
  }

  @Get('stats/overview')
  async getNotificationStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy: 'day' | 'week' | 'month' = 'day',
  ): Promise<NotificationStatsResponse> {
    return this.notificationsService.getNotificationStats({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      groupBy,
    });
  }

  @Get('user/:userId/preferences')
  async getUserNotificationPreferences(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.notificationsService.getUserNotificationPreferences(userId);
  }

  @Put('user/:userId/preferences')
  @HttpCode(HttpStatus.OK)
  async updateUserNotificationPreferences(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() preferences: any,
  ) {
    return this.notificationsService.updateUserNotificationPreferences(
      userId,
      preferences,
    );
  }

  @Post('test/:channel')
  @HttpCode(HttpStatus.OK)
  async testNotificationChannel(
    @Param('channel') channel: string,
    @Body() testData: any,
  ) {
    return this.notificationsService.testNotificationChannel(channel, testData);
  }
}