import {
  IsNumber,
  IsString,
  IsOptional,
  IsEmail,
  IsNotEmpty,
} from 'class-validator';

export class TelegramAuthDto {
  @IsNumber()
  @IsNotEmpty()
  id!: number;

  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  photo_url?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsNumber()
  @IsNotEmpty()
  auth_date!: number;

  @IsString()
  @IsNotEmpty()
  hash!: string;
}
