import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { User } from '../user/user.entity';

@Injectable()
export class AuthRepository {
  private ormRepo: Repository<User>;

  constructor(private dataSource: DataSource) {
    this.ormRepo = this.dataSource.getRepository(User);
  }

  async findByEmailOrLogin(identifier: string) {
    return this.ormRepo.findOne({
      where: [{ email: identifier }, { login: identifier }],
      select: ['id', 'email', 'password', 'refreshToken'],
    });
  }

  async findById(id: string) {
    return this.ormRepo.findOne({ where: { id } });
  }

  async createUser(userData: Partial<User>) {
    const user = this.ormRepo.create(userData);
    return this.ormRepo.save(user);
  }

  async updateRefreshToken(userId: string, token: string) {
    return this.ormRepo.update(userId, { refreshToken: token });
  }
}
