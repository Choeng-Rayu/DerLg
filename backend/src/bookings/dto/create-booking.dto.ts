import {
  IsEnum,
  IsUUID,
  IsOptional,
  IsDateString,
  IsInt,
  IsString,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Type of booking',
    enum: ['PACKAGE', 'HOTEL_ONLY', 'TRANSPORT_ONLY', 'GUIDE_ONLY'],
    example: 'PACKAGE',
  })
  @IsEnum(['PACKAGE', 'HOTEL_ONLY', 'TRANSPORT_ONLY', 'GUIDE_ONLY'])
  bookingType!: string;

  @ApiPropertyOptional({
    description: 'Trip ID for package bookings',
    example: 'uuid-trip',
  })
  @IsUUID()
  @IsOptional()
  tripId?: string;

  @ApiPropertyOptional({
    description: 'Hotel room ID',
    example: 'uuid-room',
  })
  @IsUUID()
  @IsOptional()
  hotelRoomId?: string;

  @ApiPropertyOptional({
    description: 'Vehicle ID',
    example: 'uuid-vehicle',
  })
  @IsUUID()
  @IsOptional()
  vehicleId?: string;

  @ApiPropertyOptional({
    description: 'Guide ID',
    example: 'uuid-guide',
  })
  @IsUUID()
  @IsOptional()
  guideId?: string;

  @ApiProperty({
    description: 'Start date (ISO 8601)',
    example: '2024-06-01',
  })
  @IsDateString()
  travelDate!: string;

  @ApiPropertyOptional({
    description: 'End date (ISO 8601)',
    example: '2024-06-07',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Number of adults',
    minimum: 1,
    maximum: 20,
    example: 2,
  })
  @IsInt()
  @Min(1)
  @Max(20)
  numAdults!: number;

  @ApiPropertyOptional({
    description: 'Number of children',
    minimum: 0,
    maximum: 10,
    example: 1,
  })
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  numChildren?: number;

  @ApiPropertyOptional({
    description: 'Pickup location for transport/guide',
    maxLength: 500,
    example: 'Siem Reap Airport',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  pickupLocation?: string;

  @ApiPropertyOptional({
    description: 'Special requests or notes',
    maxLength: 1000,
    example: 'Vegetarian meals please',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  specialRequests?: string;

  @ApiPropertyOptional({
    description: 'Promo/discount code',
    pattern: '^[A-Z0-9]+$', 
    maxLength: 50,
    example: 'SAVE10',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Discount code must be uppercase alphanumeric',
  })
  discountCode?: string;

  @ApiPropertyOptional({
    description: 'Loyalty points to redeem',
    minimum: 0,
    example: 500,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  loyaltyPointsToRedeem?: number;

  @ApiPropertyOptional({
    description: 'Apply student discount (if eligible)',
    example: true,
  })
  @IsOptional()
  applyStudentDiscount?: boolean;
}
