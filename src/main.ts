import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // удаляет лишние поля
    forbidNonWhitelisted: true, // выбрасывает ошибку на лишние поля
  }));

  await app.listen(3000);
}

bootstrap();
