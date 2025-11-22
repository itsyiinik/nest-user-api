import {
  IsString,
  IsInt,
  MinLength,
  MaxLength,
  Min,
  IsEmail,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({
    description: 'User login, min 4 chars',
  example: 'ionic',
  })
  @IsString()
  @MinLength(4)
  login: string;

  @ApiProperty({ description: 'User email',
  example: 'ionic@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password, min 6 chars',
    example: 'password123456',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'User age (must be >= 1)' })
  @IsInt()
  @Min(1)
  age: number;

  @ApiProperty({ description: 'User description, max 1000 chars' })
  @MaxLength(1000)
  description: string;
}