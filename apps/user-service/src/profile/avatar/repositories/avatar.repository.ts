import { IsNull, Repository } from 'typeorm';
import { UserAvatar } from '../entities/avatar.entity';
import { InjectRepository } from '@nestjs/typeorm';

export class AvatarRepository {
  constructor(
    @InjectRepository(UserAvatar)
    private readonly repo: Repository<UserAvatar>,
  ) {}

  async create(data: Partial<UserAvatar>): Promise<UserAvatar> {
    const avatar = this.repo.create(data);
    return this.repo.save(avatar);
  }

  async findActiveAvatarByUserId(userId: string): Promise<UserAvatar[]> {
    return await this.repo.find({
      where: {
        userId,
        deletedAt: IsNull(),
      },
    });
  }

  async countActiveByUserId(userId: string): Promise<number> {
    return this.repo.count({
      where: {
        userId,
        deletedAt: IsNull(),
      },
    });
  }

  async findById(id: string): Promise<UserAvatar | null> {
    return this.repo.findOne({
      where: { id },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
