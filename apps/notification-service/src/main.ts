import { NestFactory } from '@nestjs/core';
import { NotificationsModule } from './notification.module';

async function bootstrap() {
  const app = await NestFactory.create(NotificationsModule);
  await app.listen(process.env.port ?? 3001);
}
bootstrap();
