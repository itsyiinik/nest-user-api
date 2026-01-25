import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { findPageLimitUsersDto } from './dto/find-page-limit-users.dto';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(private readonly userService: UserService) {
    this.logger.log('UserController initialized');
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfileUser(@CurrentUser('userId') userId: string) {
    this.logger.log(`GET /profile/my from ${userId}`);
    const result = await this.userService.getProfileUser(userId);
    this.logger.log(`GET /profile/my completed for ${userId}`);
    return result;
  }

  @Get('users')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get users with pagination' })
  @ApiResponse({ status: 200, description: 'Returns list of users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findPageLimitUsers(@Query() query: findPageLimitUsersDto) {
    const { page, limit } = query;

    this.logger.log(`GET /profile/users?page=${page}&limit=${limit}`);

    const result = await this.userService.findPageLimitUsers(page, limit);

    this.logger.log(
      `GET /profile/users completed, page=${page}, limit=${limit}`,
    );

    return result;
  }

  @Get('findByLogin')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Find one user by login substring' })
  @ApiQuery({
    name: 'search',
    required: true,
    description: 'Login search query',
  })
  @ApiResponse({ status: 200, description: 'Returns user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findUserByLogin(@Query('search') search: string) {
    this.logger.log(`GET /profile/findByLogin?search=${search}`);

    const result = await this.userService.findByLogin(search);
    this.logger.log(`GET /profile/completed, login: ${search}`);
    return result;
  }

  @Patch('update')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update current user' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateUser(
    @CurrentUser('userId') userId: string,
    @Body() dtoUpdate: UpdateUserDto,
  ) {
    this.logger.log(`PATCH /profile/update for user: ${userId}`);

    const result = await this.userService.updateUser(userId, dtoUpdate);
    this.logger.log(`PATCH /profile/update completed for user: ${userId}`);
    return result;
  }

  @Delete('delete')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Soft delete current user' })
  @ApiResponse({ status: 200, description: 'User soft-deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteUser(@CurrentUser('userId') userId: string) {
    this.logger.log(`DELETE /profile/delete for current user: ${userId}`);

    const result = await this.userService.softDeleteUser(userId);
    this.logger.log(`DELETE /profile/delete completed for user: ${userId}`);
    return result;
  }

  @Get('user/activity')
  @UseGuards(AuthGuard('jwt'))
  async getActivityUser(
    @Query()
    query: {
      minAge: number;
      maxAge: number;
    },
  ): Promise<any[]> {
    this.logger.log(
      `GET /profile/user/activity?minAge=${query.minAge}&maxAge=${query.maxAge}`,
    );

    const result = await this.userService.findActiveUsers(
      query.minAge,
      query.maxAge,
    );
    this.logger.log(`GET /profile/user/activity completed`);
    return result;
  }
}
