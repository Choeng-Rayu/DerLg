import {
  IsNumber,
  IsString,
  IsOptional,
  IsEmail,
  IsNotEmpty,
} from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class TelegramAuthDto {
  @ApiProperty({
    description: 'Telegram user ID',
    example: 123456789,
  })
  @IsNumber()
  @IsNotEmpty()
  id!: number;

  @ApiPropertyOptional({
    description: 'Telegram first name',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiPropertyOptional({
    description: 'Telegram last name',
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiPropertyOptional({
    description: 'Telegram username',
    example: '@johndoe',
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({
    description: 'Telegram profile photo URL',
    example: 'https://...',
  })
  @IsString()
  @IsOptional()
  photo_url?: string;

  @ApiPropertyOptional({
    description: 'User email (if provided)',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Unix timestamp of auth',
    example: 1697059200,
  })
  @IsNumber()
  @IsNotEmpty()
  auth_date!: number;

  @ApiProperty({
    description: 'Telegram auth hash',
    example: 'abc123...',
  })
  @IsString()
  @IsNotEmpty()
  hash!: string;
}
