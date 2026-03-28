import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
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
    ConfigModule.forRoot({ isGlobal: true }),
    PrometheusModule.register({ defaultMetrics: { enabled: true } }),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
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
