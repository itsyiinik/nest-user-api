import { Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';
import { KafkaTransferEventInterface } from './interfaces/kafka-transfer-event.interface';
import { NotificationDbService } from './notification-db.service';

@Controller()
export class KafkaNotificationsController {
  private readonly logger = new Logger(KafkaNotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsDbService: NotificationDbService,
  ) {}

  @EventPattern('transfer-completed')
  async handleTransferCompleted(data: KafkaTransferEventInterface) {
    this.logger.log('Received transfer event from Kafka:', data);

    await this.notificationsDbService.createTransferNotification({
      senderUserId: data.fromUserId,
      senderLogin: data.fromUserLogin,
      receiverUserId: data.toUserId,
      receiverLogin: data.toUserLogin,
      amount: data.amount,
      transactionId: data.transactionId,
    });

    this.notificationsService.sendNotification({
      userId: data.toUserId,
      message: `You received: ${data.amount} from ${data.fromUserLogin}`,
      data: {
        fromUserId: data.fromUserId,
        fromUserLogin: data.fromUserLogin,
        amount: data.amount,
        transactionId: data.transactionId,
        timestamp: data.timestamp || new Date().toISOString(),
      },
    });
  }
}
