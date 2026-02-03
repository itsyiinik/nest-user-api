import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';

@Injectable()
export class NotificationDbService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async createTransferNotification(data: {
    senderUserId: string;
    senderLogin: string;
    receiverUserId: string;
    receiverLogin: string;
    amount: number;
    transactionId?: string;
  }) {
    return this.notificationModel.create(data);
  }
}
