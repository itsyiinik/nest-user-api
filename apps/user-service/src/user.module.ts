import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { AuthModule } from './auth/auth.module';
import { AvatarModule } from './avatar/avatar.module';
import { TransferModule } from './transfer/transfer.module';
import { BalanceResetModule } from './balance-reset/balance-reset.module';
import { OutboxModule } from './outbox/outbox.module';
import { DatabaseModule } from './providers/database/database.module';
import { RedisCacheModule } from './providers/cache/cache.module';
import { QueueModule } from './providers/queue/queue.module';
import { HealthModule } from './health/health.module';
import { CircuitBreakerModule } from './providers/circuit-breaker/circuit-breaker.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrometheusModule.register({ defaultMetrics: { enabled: true } }),
    DatabaseModule,
    RedisCacheModule,
    QueueModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60 * 1000,
        limit: 10,
      },
    ]),
    AuthModule,
    AvatarModule,
    TransferModule,
    BalanceResetModule,
    OutboxModule,
    HealthModule,
    CircuitBreakerModule,
  ],
  controllers: [],
  providers: [],
})
export class UserModule {}
