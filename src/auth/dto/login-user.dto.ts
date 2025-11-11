import {
  IsString,
  MinLength,
  IsEmail,
} from "class-validator";

export class LoginUserDto {
  @IsString()
  identifier: string; // login or email

  @IsString()
  @MinLength(6)
  password: string;
}