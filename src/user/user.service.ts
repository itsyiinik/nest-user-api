import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from "./user.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly users: UserRepository) {}

  async getProfileUser(id: string) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findPageLimitUsers(page: number, limit:number, search: string) {
    return this.users.findPageLimitUsers(page, limit, search);
  }

  async findByLogin(search: string) {
    if (!search) throw new NotFoundException('User not found');
    return this.users.findByLogin(search);
  }

  async updateUser(id:string, dtoUpdate: UpdateUserDto) {
    const existingUser = await this.users.findById(id)
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (dtoUpdate.password) {
      dtoUpdate.password = await bcrypt.hash(dtoUpdate.password, 10);
    }
    return this.users.updateUser(id, dtoUpdate);
  }

  async softDeleteUser(id: string) {
    return this.users.softDeleteUser(id)
  }
}
