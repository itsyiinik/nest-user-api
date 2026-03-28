import * as AWS from '@aws-sdk/client-s3';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import CircuitBreaker from 'opossum';

import { IFileService } from '../files.adapter';
import { S3Lib } from './constants/do-spaces-service-lib.constant';
import { RemoveException } from './exceptions/remove.exception';
import { UploadException } from './exceptions/upload.exception';
import { UploadFilePayloadDto } from './dto/upload-file-payload.dto';
import { UploadFileResultDto } from './dto/upload-file-result.dto';
import { RemoveFilePayloadDto } from './dto/remove-file-payload.dto';
import { CircuitBreakerService } from '../../circuit-breaker/circuit-breaker.service';

@Injectable()
export class S3Service extends IFileService implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private readonly bucketName: string;
  private uploadBreaker: CircuitBreaker<unknown[], unknown>;
  private removeBreaker: CircuitBreaker<unknown[], unknown>;

  constructor(
    @Inject(S3Lib) private readonly S3: AWS.S3,
    private readonly configService: ConfigService,
    private readonly circuitBreakerService: CircuitBreakerService,
  ) {
    super();
    const bucket = this.configService.get<string>('S3_BUCKET_NAME');
    if (!bucket) {
      throw new Error('S3_BUCKET_NAME is not configured');
    }
    this.bucketName = bucket;
  }

  onModuleInit() {
    this.uploadBreaker = this.circuitBreakerService.create(
      's3-upload',
      (params: AWS.PutObjectCommandInput) => this.doPutObject(params),
      {
        timeout: 10000,
        errorThresholdPercentage: 50,
        resetTimeout: 60000,
        volumeThreshold: 3,
      },
    );

    this.removeBreaker = this.circuitBreakerService.create(
      's3-remove',
      (params: AWS.DeleteObjectCommandInput) => this.doDeleteObject(params),
      {
        timeout: 10000,
        errorThresholdPercentage: 50,
        resetTimeout: 60000,
        volumeThreshold: 3,
      },
    );
  }

  async uploadFile(dto: UploadFilePayloadDto): Promise<UploadFileResultDto> {
    const { folder, file, name } = dto;
    const path = `${folder}/${name}`;

    this.logger.log(`Uploading file to bucket: ${path}`);

    try {
      await this.uploadBreaker.fire({
        Bucket: this.bucketName,
        Key: path,
        Body: file.buffer,
        ACL: 'public-read',
        ContentType: file.mimetype,
      });
      this.logger.log(`File uploaded successfully: ${path}`);
      return { path };
    } catch (error) {
      const message = (error as Error).message;
      this.logger.error(`File upload failed for path: ${path}`, message);
      throw new UploadException(message);
    }
  }

  async removeFile(dto: RemoveFilePayloadDto): Promise<void> {
    const { path } = dto;

    this.logger.log(`Removing file from bucket: ${path}`);

    try {
      await this.removeBreaker.fire({ Bucket: this.bucketName, Key: path });
      this.logger.log(`File removed successfully: ${path}`);
    } catch (error) {
      const message = (error as Error).message;
      this.logger.error(`File removal failed for path: ${path}`, message);
      throw new RemoveException(message);
    }
  }

  private doPutObject(params: AWS.PutObjectCommandInput): Promise<void> {
    return new Promise((resolve, reject) => {
      this.S3.putObject(params, (err) =>
        err ? reject(new Error(String(err))) : resolve(),
      );
    });
  }

  private doDeleteObject(params: AWS.DeleteObjectCommandInput): Promise<void> {
    return new Promise((resolve, reject) => {
      this.S3.deleteObject(params, (err) =>
        err ? reject(new Error(String(err))) : resolve(),
      );
    });
  }
}
