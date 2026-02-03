import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { NotificationsGateway } from './notification/notifications.gateway';
import { NotificationsService } from './notification/notifications.service';
import { KafkaNotificationsController } from './notification/kafkaNotifications.controller';
import { NotificationDbService } from './notification/notification-db.service';
import {
  Notification,
  NotificationSchema,
} from './notification/schemas/notification.schema';
import { WsJwtAuthGuard } from './notification/guards/ws-jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),

    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI,
      }),
    }),

    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  providers: [
    NotificationsGateway,
    NotificationsService,
    NotificationDbService,
    WsJwtAuthGuard,
  ],
  controllers: [KafkaNotificationsController],
})
export class NotificationsModule {}
