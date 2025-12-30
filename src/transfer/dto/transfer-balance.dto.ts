import { IsNumber, IsString, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferBalanceDto {
  @ApiProperty({
    description: 'Login of the recipient user',
    example: 'ionic',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  toUserLogin: string;

  @ApiProperty({
    description: 'Amount to transfer',
    example: 100.55,
    minimum: 0.01,
    type: 'number',
    format: 'decimal',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;
}
