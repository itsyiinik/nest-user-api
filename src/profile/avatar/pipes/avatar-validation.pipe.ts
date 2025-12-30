import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    if (file.size > 10000000) {
      throw new BadRequestException('File too large');
    }
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG or PNG');
    }
    return file;
  }
}
