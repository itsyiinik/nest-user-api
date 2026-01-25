import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Like, Repository, UpdateResult } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserAvatar } from '../../avatar/entities/avatar.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id },
      select: ['id', 'login', 'email', 'age', 'description'],
    });
  }

  async findPageLimitUsers(
    page: number,
    limit: number,
  ): Promise<{ users: User[] }> {
    const users = await this.repo.find({
      take: limit,
      skip: (page - 1) * limit,
      select: ['id', 'login', 'email', 'age', 'description'],
      order: {
        id: 'ASC',
      },
    });
    return { users };
  }

  async findByLogin(search: string): Promise<User | null> {
    return this.repo.findOne({
      where: { login: Like(`%${search}%`) },
      select: ['id', 'login', 'email', 'age', 'description'],
    });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    await this.repo.update(id, data);
    return await this.repo.findOne({
      where: { id },
      select: ['id', 'login', 'email', 'age', 'description', 'refreshToken'],
    });
  }

  async softDeleteUser(id: string): Promise<boolean> {
    const result = await this.repo.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  async findByEmailOrLogin(identifier: string): Promise<User | null> {
    return this.repo.findOne({
      where: [{ email: identifier }, { login: identifier }],
      select: ['id', 'email', 'password', 'refreshToken'],
    });
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const user = this.repo.create(userData);
    return this.repo.save(user);
  }

  async findByIdWithAuth(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async updateRefreshToken(
    userId: string,
    token: string,
  ): Promise<UpdateResult> {
    return this.repo.update(userId, { refreshToken: token });
  }

  async findActiveUsersWithLastAvatar(minAge: number, maxAge: number) {
    const lastAvatarId = this.repo.manager
      .createQueryBuilder(UserAvatar, 'lastAvatar')
      .select('lastAvatar.id')
      .where('lastAvatar.userId = user.id')
      .andWhere('lastAvatar.deletedAt IS NULL')
      .orderBy('lastAvatar.createdAt', 'DESC')
      .limit(1)
      .getQuery();

    const lastAvatarFileName = this.repo.manager
      .createQueryBuilder(UserAvatar, 'lastAvatar')
      .select('lastAvatar.fileName')
      .where('lastAvatar.userId = user.id')
      .andWhere('lastAvatar.deletedAt IS NULL')
      .orderBy('lastAvatar.createdAt', 'DESC')
      .limit(1)
      .getQuery();

    const lastAvatarCreatedAt = this.repo.manager
      .createQueryBuilder(UserAvatar, 'lastAvatar')
      .select('lastAvatar.createdAt')
      .where('lastAvatar.userId = user.id')
      .andWhere('lastAvatar.deletedAt IS NULL')
      .orderBy('lastAvatar.createdAt', 'DESC')
      .limit(1)
      .getQuery();

    const qb = this.repo
      .createQueryBuilder('user')
      .leftJoin('user.avatars', 'avatars', 'avatars.deletedAt IS NULL')
      .where('user.age BETWEEN :minAge AND :maxAge', { minAge, maxAge })
      .andWhere('user.description IS NOT NULL')
      .andWhere('user.description != :empty', { empty: '' })
      .andWhere('user.deletedAt IS NULL')
      .select([
        'user.id',
        'user.login',
        'user.email',
        'user.age',
        'user.description',
      ])
      .addSelect('COUNT(avatars.id)', 'avatarsCount')
      .addSelect(`(${lastAvatarId})`, 'lastAvatarId')
      .addSelect(`(${lastAvatarFileName})`, 'lastAvatarFileName')
      .addSelect(`(${lastAvatarCreatedAt})`, 'lastAvatarCreatedAt')
      .groupBy('user.id')
      .having('COUNT(avatars.id) >= 3')
      .orderBy('COUNT(avatars.id)', 'DESC');
    return qb.getRawMany();
  }

  async findUserWithBalance(
    id: string,
    manager?: EntityManager,
  ): Promise<{ id: string; login: string; balance: number } | null> {
    const repository = manager ? manager.getRepository(User) : this.repo;
    return repository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .select(['user.id', 'user.login', 'user.balance'])
      .setLock('pessimistic_write')
      .getOne();
  }

  async findUserByExactLogin(
    login: string,
    manager?: EntityManager,
  ): Promise<{ id: string; login: string; balance: number } | null> {
    const repository = manager ? manager.getRepository(User) : this.repo;
    return repository
      .createQueryBuilder('user')
      .where('user.login = :login', { login })
      .select(['user.id', 'user.login', 'user.balance'])
      .setLock('pessimistic_write')
      .getOne();
  }

  async updateBalance(
    id: string,
    newBalance: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager ? manager.getRepository(User) : this.repo;
    await repository.update(id, { balance: newBalance });
  }
}
