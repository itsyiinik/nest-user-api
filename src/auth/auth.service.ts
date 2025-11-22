import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from "./dto/login-user.dto";
import {InjectRepository } from '@nestjs/typeorm';
import {User}  from "../user/user.entity";
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { RefreshTokenDto } from "./dto/refresh.dto";
import {ConfigService } from '@nestjs/config';
import { AuthRepository } from "./auth.repository";


@Injectable()
export class AuthService {
  constructor(
    private readonly authRepo: AuthRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dtoCreate: CreateUserDto) {
    const existingUser = await this.authRepo.findByEmailOrLogin(dtoCreate.email);

    if (existingUser) {
        throw new ConflictException("User already exists");
    }

    const hashPassword = await bcrypt.hash(dtoCreate.password, 10);

    const newUser = this.authRepo.createUser({ ...dtoCreate, password: hashPassword });

    return {
      message: 'User successfully registered',
      status: 201
    };
  }

  async login(dtoLogin: LoginUserDto) {
    const userFound = await this.authRepo.findByEmailOrLogin(dtoLogin.identifier);

    if (!userFound) {
      throw new NotFoundException('Invalid login or password');
    }

    const correctPassword = await bcrypt.compare(
      dtoLogin.password,
      userFound.password,
    );
    if (!correctPassword) {
      throw new UnauthorizedException('Invalid login or password');
    }

    const payload = { userId: userFound.id, email: userFound.email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES')
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES')
    });

    await this.authRepo.updateRefreshToken(userFound.id, refreshToken);

    return {
      message: "User successfully logged in",
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const clientToken = dto.refreshToken;

    const payload = this.jwtService.verify(clientToken, {
      secret: this.configService.get('JWT_SECRET')
    });
    if (!payload) {
      throw new NotFoundException("Wrong Token");
    }

    const user = await this.authRepo.findById(payload.userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (clientToken !== user.refreshToken) {
      throw new ConflictException('Token expired');
    }

    const newAccessToken = this.jwtService.sign(
      { userId: user.id, email: user.email },
      { expiresIn: this.configService.get('JWT_ACCESS_EXPIRES') },
    );

    const newRefreshToken = this.jwtService.sign(
      { userId: user.id, email: user.email },
      { expiresIn: this.configService.get('JWT_REFRESH_EXPIRES') },
    );

    await this.authRepo.updateRefreshToken(user.id, newRefreshToken);

    return {
      message: "Token refreshed successfully",
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }


}
