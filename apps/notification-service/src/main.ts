import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NotificationsModule } from './notification.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(NotificationsModule);

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: ['localhost:9092'],
        },
        consumer: {
          groupId: 'notification-group',
          allowAutoTopicCreation: true,
        },
      },
    });

    await app.startAllMicroservices();

    await app.listen(3001);
  } catch (error) {
    console.log('FATAL ERROR:', error);
    process.exit(1);
  }
}

bootstrap();
