import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { initializeTransactionalContext } from 'typeorm-transactional';

async function bootstrap() {
  initializeTransactionalContext();
  const app = await NestFactory.create(UserModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('User Service API')
    .setDescription(
      'REST API for user management, authentication, avatar uploads, and balance transfers. ' +
        'Real-time notifications are delivered via WebSocket (notification-service on port 3001).',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // http://localhost:PORT/docs (PORT: 3000)
  await app.listen(Number(process.env.LISTEN_PORT));
}

bootstrap();
