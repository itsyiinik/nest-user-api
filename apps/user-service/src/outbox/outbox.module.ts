import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Outbox } from './outbox.entity';
import { OutboxWorker } from './outbox.worker';
import { KAFKA_SERVICE } from '../transfer/transfer.tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([Outbox]),
    ClientsModule.registerAsync([
      {
        name: KAFKA_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: [configService.get<string>('KAFKA_BROKERS')],
            },
            producer: {
              allowAutoTopicCreation: true,
            },
          },
        }),
      },
    ]),
  ],
  providers: [OutboxWorker],
})
export class OutboxModule {}
