import {
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AvatarService } from './avatar.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from './pipes/avatar-validation.pipe';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Avatars')
@ApiBearerAuth()
@Controller('avatars')
export class AvatarController {
  private readonly logger = new Logger(AvatarController.name);

  constructor(private readonly avatarService: AvatarService) {
    this.logger.log('AvatarController initialized');
  }

  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload avatar for current user' })
  @ApiBody({
    description: 'Avatar image file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Avatar uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadAvatar(
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.log(`POST /avatars/upload from user: ${user.userId}`);

    const result = await this.avatarService.uploadAvatar(user.userId, file);

    this.logger.log(`POST /avatars/upload completed for user: ${user.userId}`);
    this.logger.debug('Upload result:', {
      avatarId: result.id,
      fileName: result.fileName,
    });

    return result;
  }

  @Delete('delete/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Soft delete avatar by ID' })
  @ApiParam({ name: 'id', description: 'Avatar ID' })
  @ApiResponse({ status: 200, description: 'Avatar soft-deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Avatar not found' })
  async softDeleteAvatar(
    @CurrentUser() user: JwtPayload,
    @Param('id') avatarId: string,
  ) {
    this.logger.log(
      `DELETE /avatars/delete/${avatarId} from user: ${user.userId}`,
    );

    const result = await this.avatarService.softDeleteAvatar(
      user.userId,
      avatarId,
    );

    this.logger.log(
      `DELETE /avatars/delete/${avatarId} completed for user: ${user.userId}`,
    );

    return result;
  }

  @Get('myAvatars')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all avatars for current user' })
  @ApiResponse({ status: 200, description: 'List of user avatars' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyAvatars(@CurrentUser() user: JwtPayload) {
    this.logger.log(`GET /avatars/myAvatars from user: ${user.userId}`);

    const result = await this.avatarService.getMyAvatars(user.userId);

    this.logger.log(
      `GET /avatars/myAvatars completed, found ${result.length} avatars for user: ${user.userId}`,
    );

    return result;
  }
}
