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
          brokers: [process.env.KAFKA_BROKERS],
        },
        consumer: {
          groupId: process.env.KAFKA_CONSUMER_GROUP_ID,
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
