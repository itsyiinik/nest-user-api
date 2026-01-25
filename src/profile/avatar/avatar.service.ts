import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AvatarRepository } from './repositories/avatar.repository';
import { UserAvatar } from './entities/avatar.entity';
import { S3Service } from '../../providers/files/s3/s3.service';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AvatarService {
  private readonly avatarsFolder: string;
  private readonly logger = new Logger(AvatarService.name);

  constructor(
    private readonly avatarRepository: AvatarRepository,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {
    this.logger.log('AvatarService initialized');

    const folder = this.configService.get<string>('MINIO_FOLDER_NAME');

    if (!folder) {
      this.logger.error('Missing MINIO_FOLDER_NAME in "env"');
      throw new Error('Missing folder in "env"');
    }

    this.avatarsFolder = folder;
    this.logger.debug(`Avatars folder configured: ${this.avatarsFolder}`);
  }

  async canUpload(userId: string): Promise<boolean> {
    this.logger.debug(`Checking upload permission for user: ${userId}`);

    const countActiveAvatar =
      await this.avatarRepository.countActiveByUserId(userId);
    const canUpload = countActiveAvatar < 5;

    this.logger.debug(
      `User ${userId} has ${countActiveAvatar} avatars, can upload: ${canUpload}`,
    );
    return canUpload;
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UserAvatar> {
    this.logger.log(`Uploading avatar for user: ${userId}`);

    const canUpload = await this.canUpload(userId);
    if (!canUpload) {
      this.logger.warn(`User ${userId} reached upload limit (5 avatars)`);
      throw new BadRequestException('Maximum avatar limit reached (5 avatars)');
    }

    const fileName = this.generateUuidFileName(file.originalname);
    const s3Key = `${this.avatarsFolder}/${fileName}`;
    this.logger.debug(`Generated file name: ${fileName}, S3 key: ${s3Key}`);

    try {
      this.logger.debug(`Uploading file to S3: ${s3Key}`);
      await this.s3Service.uploadFile({
        file: file,
        folder: this.avatarsFolder,
        name: fileName,
      });
      this.logger.debug(`File uploaded to S3: ${s3Key}`);

      this.logger.debug(
        `Creating avatar record in database for user: ${userId}`,
      );
      const avatar = await this.avatarRepository.create({
        fileName,
        userId,
      });

      this.logger.log(
        `Avatar uploaded successfully for user: ${userId}, avatar ID: ${avatar.id}`,
      );
      return avatar;
    } catch (error) {
      this.logger.error(`Failed to upload avatar for user ${userId}`);
      await this.s3Service.removeFile({ path: s3Key }).catch(() => {});
      throw error;
    }
  }

  async softDeleteAvatar(userId: string, avatarId: string): Promise<void> {
    this.logger.log(`Soft deleting avatar ${avatarId} for user: ${userId}`);

    const foundAvatar = await this.avatarRepository.findById(avatarId);
    if (!foundAvatar) {
      this.logger.warn(
        `Avatar not found or already deleted: ${avatarId} for user: ${userId}`,
      );
      throw new NotFoundException('Avatar not found or already deleted');
    }

    this.logger.debug(`Soft deleting avatar record: ${avatarId}`);
    await this.avatarRepository.softDelete(avatarId);

    await this.s3Service.removeFile({
      path: `${this.avatarsFolder}/${foundAvatar.fileName}`,
    });

    this.logger.log(
      `Avatar soft deleted successfully: ${avatarId} for user: ${userId}`,
    );
  }

  async getMyAvatars(userId: string): Promise<UserAvatar[]> {
    this.logger.log(`Getting avatars for user: ${userId}`);

    const avatars =
      await this.avatarRepository.findActiveAvatarByUserId(userId);

    this.logger.debug(`Found ${avatars.length} avatars for user: ${userId}`);
    return avatars;
  }

  private generateUuidFileName(originalFile: string): string {
    const endFile = originalFile.split('.').pop();
    const uuid = crypto.randomUUID();
    const fileName = `${uuid}.${endFile}`;

    this.logger.debug(
      `Generated file name: ${fileName} from original: ${originalFile}`,
    );
    return fileName;
  }
}
