import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {
    this.logger.log('AuthController initialized');
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60 * 1000, limit: 5 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() dto: RegisterDto) {
    this.logger.log(`POST /auth/register - user: ${dto.login}`);
    this.logger.debug(`Registration data:`, {
      login: dto.login,
      email: dto.email,
      age: dto.age,
    });

    const result = await this.authService.register(dto);

    this.logger.log(`User ${dto.login} registered successfully`);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60 * 1000, limit: 5 } })
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({ type: LoginDto })
  async login(@Body() dto: LoginDto) {
    this.logger.log(`POST /auth/login - identifier: ${dto.identifier}`);

    const result = await this.authService.login(dto);

    this.logger.log(`User ${dto.identifier} logged in successfully`);
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  async refresh(@Body() dto: RefreshTokenDto) {
    this.logger.log('POST /auth/refresh - token refresh request');

    const result = await this.authService.refreshToken(dto);

    this.logger.log('Token refreshed successfully');
    return result;
  }
}
