import {
  IsString,
  MinLength,
  IsEmail,
} from "class-validator";

export class LoginUserDto {
  @IsString()
  identifier: string; // login или email

  @IsString()
  @MinLength(6)
  password: string;
}