import * as AWS from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { S3Lib } from './constants/do-spaces-service-lib.constant';
import { S3Service } from './s3.service';

@Module({
  imports: [ConfigModule],
  providers: [
    S3Service,
    {
      provide: S3Lib,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const accessKeyId = configService.get<string>('S3_ACCESS_KEY');
        const secretAccessKey = configService.get<string>('S3_SECRET_KEY');

        if (!accessKeyId || !secretAccessKey) {
          throw new Error('S3 credentials are not configured');
        }

        const endpoint = configService.get<string>('S3_ENDPOINT');
        const region = configService.get<string>('S3_REGION') ?? 'us-east-1';

        return new AWS.S3({
          endpoint,
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
          forcePathStyle: true,
        });
      },
    },
  ],
  exports: [S3Service, S3Lib],
})
export class S3Module {}
