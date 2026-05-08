import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
} from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Password (min 8 chars, 1 uppercase, 1 number)',
    example: 'Pass123!',
    writeOnly: true,
  })
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Z])/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/(?=.*[0-9])/, {
    message: 'Password must contain at least one number',
  })
  password!: string;

  @ApiPropertyOptional({
    description: 'Phone number (E.164 format)',
    example: '+85512345678',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone must be in international format',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Preferred language',
    enum: ['EN', 'KH', 'ZH'],
    example: 'EN',
  })
  @IsOptional()
  @IsEnum(['EN', 'KH', 'ZH'])
  preferredLanguage?: string;
}
