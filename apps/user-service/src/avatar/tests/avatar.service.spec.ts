import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AvatarService } from '../avatar.service';
import { AvatarRepository } from '../repositories/avatar.repository';
import { S3Service } from '../../providers/files/s3/s3.service';
import { ConfigService } from '@nestjs/config';

const mockAvatar = {
  id: 'avatar-1',
  fileName: 'uuid-filename.jpg',
  userId: 'user-1',
  createdAt: new Date(),
  deletedAt: null,
};

const mockFile = {
  originalname: 'photo.jpg',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('file-content'),
  size: 1024,
} as Express.Multer.File;

describe('AvatarService', () => {
  let service: AvatarService;

  const mockAvatarRepository = {
    countActiveByUserId: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
    findActiveAvatarByUserId: jest.fn(),
  };

  const mockS3Service = {
    uploadFile: jest
      .fn()
      .mockResolvedValue({ path: 'avatars/uuid-filename.jpg' }),
    removeFile: jest.fn().mockResolvedValue(undefined),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'MINIO_FOLDER_NAME') return 'avatars';
      return undefined;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvatarService,
        { provide: AvatarRepository, useValue: mockAvatarRepository },
        { provide: S3Service, useValue: mockS3Service },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AvatarService>(AvatarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadAvatar', () => {
    it('should upload avatar when under the limit', async () => {
      mockAvatarRepository.countActiveByUserId.mockResolvedValue(2);
      mockAvatarRepository.create.mockResolvedValue(mockAvatar);

      const result = await service.uploadAvatar('user-1', mockFile);

      expect(mockS3Service.uploadFile).toHaveBeenCalled();
      expect(mockAvatarRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
      );
      expect(result).toEqual(mockAvatar);
    });

    it('should throw BadRequestException when avatar limit (5) is reached', async () => {
      mockAvatarRepository.countActiveByUserId.mockResolvedValue(5);

      await expect(service.uploadAvatar('user-1', mockFile)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockS3Service.uploadFile).not.toHaveBeenCalled();
    });

    it('should rollback S3 upload if DB creation fails', async () => {
      mockAvatarRepository.countActiveByUserId.mockResolvedValue(1);
      mockS3Service.uploadFile.mockResolvedValue({ path: 'avatars/file.jpg' });
      mockAvatarRepository.create.mockRejectedValue(new Error('DB error'));

      await expect(service.uploadAvatar('user-1', mockFile)).rejects.toThrow(
        'DB error',
      );
      expect(mockS3Service.removeFile).toHaveBeenCalled();
    });
  });

  describe('softDeleteAvatar', () => {
    it('should soft delete avatar and remove from S3', async () => {
      mockAvatarRepository.findById.mockResolvedValue(mockAvatar);

      await service.softDeleteAvatar('user-1', 'avatar-1');

      expect(mockAvatarRepository.softDelete).toHaveBeenCalledWith('avatar-1');
      expect(mockS3Service.removeFile).toHaveBeenCalledWith({
        path: `avatars/${mockAvatar.fileName}`,
      });
    });

    it('should throw NotFoundException when avatar not found', async () => {
      mockAvatarRepository.findById.mockResolvedValue(null);

      await expect(
        service.softDeleteAvatar('user-1', 'not-exist'),
      ).rejects.toThrow(NotFoundException);
      expect(mockAvatarRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('getMyAvatars', () => {
    it('should return list of active avatars', async () => {
      mockAvatarRepository.findActiveAvatarByUserId.mockResolvedValue([
        mockAvatar,
      ]);

      const result = await service.getMyAvatars('user-1');

      expect(result).toEqual([mockAvatar]);
      expect(
        mockAvatarRepository.findActiveAvatarByUserId,
      ).toHaveBeenCalledWith('user-1');
    });
  });
});
