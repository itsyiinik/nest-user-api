import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvatarController } from './avatar.controller';
import { AvatarService } from './avatar.service';
import { AvatarRepository } from './repositories/avatar.repository';
import { UserAvatar } from './entities/avatar.entity';
import { S3Module } from '../../providers/files/s3/s3.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserAvatar]), S3Module],
  controllers: [AvatarController],
  providers: [AvatarService, AvatarRepository],
  exports: [AvatarService],
})
export class AvatarModule {}
