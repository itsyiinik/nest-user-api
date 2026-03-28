import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { UserModule } from '../apps/user-service/src/user.module';
import { initializeTransactionalContext } from 'typeorm-transactional'; // ← ЭТО ОБЯЗАТЕЛЬНО!

describe('Auth E2E (минимальный)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // ВАЖНО: Должно быть ПЕРВОЙ строчкой
    initializeTransactionalContext();

    const module: TestingModule = await Test.createTestingModule({
      imports: [UserModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /auth/register → создаёт пользователя и возвращает токены', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login: 'makakafrankr',
        email: 'makakafrankr@google.com',
        password: 'makakafrankr32323',
        age: 25,
        description: 'makakafrankr user',
      })
      .expect(201);

    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('refresh_token');
    expect(typeof response.body.access_token).toBe('string');
    expect(response.body.access_token.length).toBeGreaterThan(10);
  });
});
