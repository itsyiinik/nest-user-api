import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';
import { KafkaTransferEventInterface } from './interfaces/kafka-transfer-event.interface';

@Controller()
export class KafkaNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('transfer-completed')
  handleTransferCompleted(data: KafkaTransferEventInterface) {
    console.log('Received transfer event from Kafka:', data);

    this.notificationsService.sendNotification({
      userId: data.toUserId,
      message: `You received: ${data.amount} from ${data.fromUserLogin}`,
      data: {
        type: 'transfer_received',
        fromUserId: data.fromUserId,
        fromUserLogin: data.fromUserLogin,
        amount: data.amount,
        transactionId: data.transactionId,
        timestamp: data.timestamp || new Date().toISOString(),
      },
    });
  }
}
