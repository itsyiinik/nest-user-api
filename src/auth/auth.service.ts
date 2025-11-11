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
import { Repository } from "typeorm";
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenDto } from "./dto/refresh.dto";
import {ConfigService } from '@nestjs/config';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dtoCreate: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: dtoCreate.email }, { login: dtoCreate.login }],
    });
    if (existingUser) {
      throw new ConflictException("User already exists");
    }

    const hashPassword = await bcrypt.hash(dtoCreate.password, 10);

    const newUser = this.userRepository.create({
      login: dtoCreate.login,
      email: dtoCreate.email,
      password: hashPassword,
      age: dtoCreate.age,
      description: dtoCreate.description,
    });

    await this.userRepository.save(newUser);
    const payload = { userId: newUser.id, email: newUser.email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES')
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES')
    });

    newUser.refreshToken = refreshToken;
    await this.userRepository.save(newUser);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      login: newUser.login,
      email: newUser.email,
      age: newUser.age,
      description: newUser.description,
    };
  }

  async login(dtoLogin: LoginUserDto) {
    const userFound = await this.userRepository.findOne({
      where: [{ email: dtoLogin.identifier }, { login: dtoLogin.identifier }],
    });

    if (!userFound) {
      throw new NotFoundException("User not found");
    }

    const correctPassword = await bcrypt.compare(
      dtoLogin.password,
      userFound.password,
    );
    if (!correctPassword) {
      throw new UnauthorizedException("Wrong Password");
    }

    const payload = { userId: userFound.id, email: userFound.email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES')
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES')
    });

    await this.userRepository.update(userFound.id, { refreshToken });
    return {
      message: "success",
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

    const user = await this.userRepository.findOneBy({ id: payload.userId });
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

    await this.userRepository.update(user.id, { refreshToken: newRefreshToken });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }
}
