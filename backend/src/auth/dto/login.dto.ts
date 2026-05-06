import { IsEmail, IsString, MinLength } from 'class-validator';
import {
  ApiProperty,
} from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Password',
    example: 'password123',
    writeOnly: true,
  })
  @IsString()
  @MinLength(1)
  password!: string;
}
