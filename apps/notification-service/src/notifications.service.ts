import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { CreateNotificationDto } from './dto/сreate-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  sendNotification(dto: CreateNotificationDto) {
    const notificationPayload = {
      message: dto.message,
      data: dto.data,
      timestamp: new Date().toISOString(),
    };

    this.notificationsGateway.sendNotification(dto.userId, notificationPayload);
    return {
      success: true,
      message: `Notification sent to user ${dto.userId}`,
      sentData: notificationPayload,
    };
  }
}
