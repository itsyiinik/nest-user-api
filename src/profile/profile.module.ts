import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AvatarModule } from './avatar/avatar.module';

@Module({
  imports: [UserModule, AvatarModule],
  exports: [UserModule, AvatarModule],
})
export class ProfileModule {}
