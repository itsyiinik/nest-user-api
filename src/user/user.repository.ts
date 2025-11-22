import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findById(id: string) {
    return this.repo.findOne({
      where: { id },
      select: ['id', 'login', 'email', 'age', 'description'],
    });
  }

  async findPageLimitUsers(page: number, limit:number, search: string): Promise<{ users: User[] }> {
    const users = await this.repo.find({
      where: {login: Like(`%${search}%`)},
      take: limit,
      skip: (page - 1) * limit,
      select: ['id', 'login', 'email', 'age', 'description'],
    })
    return { users }
  }

  async findByLogin(search: string) {
    return this.repo.findOne({
      where: {login: Like(`%${search}%`)},
      select: ['id', 'login', 'email', 'age', 'description'],
    })
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    await this.repo.update(id, data);
    const updatedUser = await this.repo.findOne({ where: { id } });
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }

  async softDeleteUser(id: string) {
    const result = await this.repo.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User soft-deleted successfully' };
  }
}
