import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TripFilterDto {
  @IsOptional()
  @IsEnum(['MOUNTAIN', 'BEACH', 'CITY', 'FOREST', 'ISLAND', 'TEMPLE'])
  environment?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(365)
  maxDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsEnum(['price', 'rating', 'duration'])
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string;

  @IsOptional()
  @IsEnum(['EN', 'KH', 'ZH'])
  language?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  perPage?: number;
}
