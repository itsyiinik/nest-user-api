import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger.log('UserService initialized');
  }

  async create(data: {
    login: string;
    email: string;
    password: string;
    age: number;
    description?: string;
  }) {
    this.logger.log(`Creating new user: ${data.login} (${data.email})`);
    const existingByEmail = await this.userRepository.findByEmailOrLogin(
      data.email,
    );
    const existingByLogin = await this.userRepository.findByEmailOrLogin(
      data.login,
    );

    if (existingByEmail || existingByLogin) {
      this.logger.warn(
        `User already exists - email: ${data.email}, login: ${data.login}`,
      );
      throw new ConflictException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await this.userRepository.createUser({
      ...data,
      password: hashedPassword,
    });
    this.logger.log(
      `User created successfully: ${data.login} (ID: ${result.id})`,
    );
    return result;
  }

  async validateCredentials(identifier: string, password: string) {
    this.logger.log(`Validating credentials for: ${identifier}`);

    const user = await this.userRepository.findByEmailOrLogin(identifier);

    if (!user) {
      this.logger.warn(`User not found: ${identifier}`);
      throw new NotFoundException('Invalid login or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${identifier}`);
      throw new UnauthorizedException('Invalid login or password');
    }

    this.logger.log(`Credentials validated successfully for: ${identifier}`);
    return user;
  }

  async updateRefreshToken(userId: string, token: string) {
    this.logger.log(`Update refresh token for user: ${userId}`);
    const result = await this.userRepository.updateRefreshToken(userId, token);
    this.logger.debug(`Refresh token updated for user: ${userId}`);
    return result;
  }

  async findByIdWithAuth(userId: string) {
    this.logger.log(`Finding user with auth by ID: ${userId}`);

    const user = await this.userRepository.findByIdWithAuth(userId);

    if (!user) {
      this.logger.warn(`User with auth not found: ${userId}`);
    } else {
      this.logger.debug(`User with auth found: ${user.login} (${userId})`);
    }

    return user;
  }

  async getProfileUser(id: string) {
    this.logger.log(`Getting profile for user: ${id}`);

    const user = await this.userRepository.findById(id);

    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Profile retrieved for user: ${user.login} (${id})`);
    return user;
  }

  async findPageLimitUsers(page: number, limit: number) {
    this.logger.log(
      `Finding users with pagination: page=${page}, limit=${limit}`,
    );

    const cacheKey = `user:list:${page}:${limit}`;
    const cached = await this.cacheManager.get(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache miss: ${cacheKey}`);
    const result = await this.userRepository.findPageLimitUsers(page, limit);

    await this.cacheManager.set(cacheKey, result, 30 * 1000);
    this.logger.debug(`Cache set: ${cacheKey} (30s TTL)`);

    this.logger.log(`Found ${result.users.length} users with pagination`);
    return result;
  }

  async findByLogin(search: string) {
    this.logger.log(`Finding user by login search: ${search}`);

    if (!search) {
      this.logger.warn('Empty search parameter provided');
      throw new NotFoundException('User not found');
    }

    const cacheKey = `user:search:${search.toLowerCase()}`;
    const cached = await this.cacheManager.get(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache miss: ${cacheKey}`);
    const users = await this.userRepository.findByLogin(search);

    await this.cacheManager.set(cacheKey, users, 30 * 1000);
    this.logger.debug(`Cache set: ${cacheKey} (30s TTL)`);

    this.logger.log(`Found user for search: ${search}`);
    return users;
  }

  async updateUser(id: string, dtoUpdate: UpdateUserDto) {
    this.logger.log(`Updating user: ${id}`);
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      this.logger.warn(`User not found for update: ${id}`);
      throw new NotFoundException('User not found');
    }

    if (dtoUpdate.password) {
      this.logger.debug('Hashing new password for user update');
      dtoUpdate.password = await bcrypt.hash(dtoUpdate.password, 10);
    }
    this.logger.log(`User updated: ${id} (${existingUser.login})`);
    return await this.userRepository.updateUser(id, dtoUpdate);
  }

  async softDeleteUser(id: string) {
    this.logger.log(`Soft deleting user: ${id}`);

    const result = await this.userRepository.softDeleteUser(id);

    if (result) {
      this.logger.log(`User soft deleted successfully: ${id}`);
    } else {
      this.logger.warn(`User not found for soft delete: ${id}`);
    }

    return result;
  }

  async findActiveUsers(minAge: number, maxAge: number): Promise<any[]> {
    this.logger.log(`Finding active users: minAge=${minAge}, maxAge=${maxAge}`);

    const result = await this.userRepository.findActiveUsersWithLastAvatar(
      minAge,
      maxAge,
    );

    this.logger.log(`Found ${result.length} active users`);
    return result;
  }

  async findUserWithBalance(
    id: string,
  ): Promise<{ id: string; login: string; balance: number } | null> {
    this.logger.log(`Finding user with balance: ${id}`);

    const user = await this.userRepository.findUserWithBalance(id);

    if (user) {
      this.logger.log(
        `User with balance found: ${user.login} (balance: ${user.balance})`,
      );
    } else {
      this.logger.warn(`User with balance not found: ${id}`);
    }

    return user;
  }

  async findUserByExactLogin(
    login: string,
  ): Promise<{ id: string; login: string; balance: number } | null> {
    this.logger.log(`Finding user by exact login: ${login}`);
    const user = await this.userRepository.findUserByExactLogin(login);

    if (user) {
      this.logger.log(
        `User found by exact login: ${login} (balance: ${user.balance})`,
      );
    } else {
      this.logger.warn(`User not found by exact login: ${login}`);
    }

    return user;
  }

  async updateBalance(id: string, newBalance: number): Promise<void> {
    this.logger.log(`Updating balance for user: ${id} to ${newBalance}`);

    await this.userRepository.updateBalance(id, newBalance);

    this.logger.log(`Balance updated for user: ${id}`);
  }
}
