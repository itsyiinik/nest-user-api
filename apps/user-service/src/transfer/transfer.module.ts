import { Module } from '@nestjs/common';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { UserModule } from '../profile/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../profile/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UserModule],
  controllers: [TransferController],
  providers: [TransferService],
})
export class TransferModule {}
