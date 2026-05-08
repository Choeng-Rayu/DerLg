import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TripFilterDto {
  @ApiPropertyOptional({
    description: 'Trip environment type',
    enum: ['MOUNTAIN', 'BEACH', 'CITY', 'FOREST', 'ISLAND', 'TEMPLE'],
    example: 'BEACH',
  })
  @IsOptional()
  @IsEnum(['MOUNTAIN', 'BEACH', 'CITY', 'FOREST', 'ISLAND', 'TEMPLE'])
  environment?: string;

  @ApiPropertyOptional({
    description: 'Minimum trip duration (days)',
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minDays?: number;

  @ApiPropertyOptional({
    description: 'Maximum trip duration (days)',
    example: 14,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(365)
  maxDays?: number;

  @ApiPropertyOptional({
    description: 'Minimum price (USD)',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price (USD)',
    example: 2000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Filter by province',
    example: 'Siem Reap',
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['price', 'rating', 'duration'],
    example: 'price',
  })
  @IsOptional()
  @IsEnum(['price', 'rating', 'duration'])
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string;

  @ApiPropertyOptional({
    description: 'Content language',
    enum: ['EN', 'KH', 'ZH'],
    example: 'EN',
  })
  @IsOptional()
  @IsEnum(['EN', 'KH', 'ZH'])
  language?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  perPage?: number;
}
