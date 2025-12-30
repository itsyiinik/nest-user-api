import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../profile/user/user.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.logger.log('AuthService initialized');
  }

  async register(dto: RegisterDto) {
    this.logger.log(`Registering user: ${dto.login}`);
    const user = await this.userService.create({
      login: dto.login,
      email: dto.email,
      password: dto.password,
      age: dto.age,
      description: dto.description,
    });

    const result = await this.generateTokens(user);

    this.logger.log(`User ${user.login} created successfully`);
    return result;
  }

  async login(dto: LoginDto) {
    this.logger.log(`Login attempt for: ${dto.identifier}`);

    const user = await this.userService.validateCredentials(
      dto.identifier,
      dto.password,
    );

    const result = await this.generateTokens(user);

    this.logger.log(`User ${user.login} logged in successfully`);
    return result;
  }

  async refreshToken(dto: RefreshTokenDto) {
    const clientToken = dto.refreshToken;

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(clientToken, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.userService.findByIdWithAuth(payload.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (clientToken !== user.refreshToken) {
      throw new UnauthorizedException('Token expired');
    }

    const result = await this.generateTokens(user);

    this.logger.log(`Token refreshed for user: ${user.login}`);
    return result;
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    login: string;
  }) {
    const payload = { userId: user.id, email: user.email, login: user.login };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES'),
    });

    await this.userService.updateRefreshToken(user.id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
