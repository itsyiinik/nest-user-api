import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserDto {
  @ApiProperty({
    description: 'New login (optional)',
    example: 'newIonic',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  login?: string;

  @ApiProperty({
    description: 'New email (optional)',
    example: 'newionic@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'New password (optional). Minimum 6 characters.',
    example: 'newpassword',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({
    description: 'New profile description (optional)',
    example: 'I love Node.js and Nest.js.',
    required: false,
  })
  @IsOptional()
  @MaxLength(1000)
  description?: string;
}
