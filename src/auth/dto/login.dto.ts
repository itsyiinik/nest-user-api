import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User login OR email',
    example: 'ionic or ionic@example.com',
  })
  @IsString()
  identifier: string;

  @ApiProperty({
    description: 'User password, minimum 6 characters',
    example: 'password123',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
