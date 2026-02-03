import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { KAFKA_SERVICE } from './transfer.tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UserModule,
    ClientsModule.register([
      {
        name: KAFKA_SERVICE,
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: [process.env.KAFKA_BROKERS],
          },
          producer: {
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
  ],
  controllers: [TransferController],
  providers: [TransferService],
  exports: [TransferService],
})
export class TransferModule {}
