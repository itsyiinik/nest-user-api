import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NotificationsModule } from './notification.module';

async function bootstrap() {
  console.log('=== STARTING NOTIFICATION SERVICE ===');

  try {
    const app = await NestFactory.create(NotificationsModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    console.log('App created, connecting to Kafka...');

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: ['localhost:9092'],
        },
        consumer: {
          groupId: 'notification-group',
        },
      },
    });

    console.log('Kafka connected, starting microservices...');

    await app.startAllMicroservices();
    console.log('Microservices started successfully!');

    await app.listen(3001);
    console.log('Notification service running on port 3001');
  } catch (error) {
    console.error('FATAL ERROR:', error);
    process.exit(1);
  }
}

bootstrap();
