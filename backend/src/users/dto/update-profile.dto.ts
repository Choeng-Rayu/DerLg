import {
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone must be in international format',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(['EN', 'KH', 'ZH'])
  preferredLanguage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Emergency phone must be in international format',
  })
  emergencyContactPhone?: string;
}
