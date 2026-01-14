import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'];

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File too large');
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG or PNG');
    }

    return file;
  }
}
