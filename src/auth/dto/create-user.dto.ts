import {
  IsString,
  IsInt,
  MinLength,
  MaxLength,
  Min,
  IsEmail,
} from "class-validator";

export class CreateUserDto {
  @IsString()
  @MinLength(4)
  login: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsInt()
  @Min(1)
  age: number;

  @MaxLength(1000)
  description: string;
}