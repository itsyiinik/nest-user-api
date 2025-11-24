import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { UserService } from "./user.service";
import { AuthGuard } from "@nestjs/passport";
import { User as UserDecorator } from "./user.decorator";
import { UpdateUserDto } from "./dto/update-user.dto";

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
@Controller('profile')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('my')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfileUser(@UserDecorator('userId') userId: string) {
    return this.userService.getProfileUser(String(userId));
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('users')
  @ApiOperation({ summary: 'Get users with pagination and optional search' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by login' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Returns list of users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findPageLimitUsers(@Query() query: { search?: string; page?: number; limit?: number }) {
    const { search, page, limit } = query;
    return this.userService.findPageLimitUsers(Number(page) || 1, Number(limit) || 10, search || '');
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('findByLogin')
  @ApiOperation({ summary: 'Find one user by login substring' })
  @ApiQuery({ name: 'search', required: true, description: 'Login search query' })
  @ApiResponse({ status: 200, description: 'Returns user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOne(@Query('search') search: string) {
    return this.userService.findByLogin(search);
  }

  @Patch('update')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update current user' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateUser(
    @UserDecorator('userId') userId: string,
    @Body() dtoUpdate: UpdateUserDto
  ) {
    return this.userService.updateUser(userId, dtoUpdate);
  }

  @Delete('delete')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Soft delete current user' })
  @ApiResponse({ status: 200, description: 'User soft-deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteUser(@UserDecorator('userId') userId: string) {
    return this.userService.softDeleteUser(String(userId));
  }
}
