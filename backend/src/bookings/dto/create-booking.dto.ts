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

export class CreateBookingDto {
  @IsEnum(['PACKAGE', 'HOTEL_ONLY', 'TRANSPORT_ONLY', 'GUIDE_ONLY'])
  bookingType!: string;

  @IsUUID()
  @IsOptional()
  tripId?: string;

  @IsUUID()
  @IsOptional()
  hotelRoomId?: string;

  @IsUUID()
  @IsOptional()
  vehicleId?: string;

  @IsUUID()
  @IsOptional()
  guideId?: string;

  @IsDateString()
  travelDate!: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @Min(1)
  @Max(20)
  numAdults!: number;

  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  numChildren?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  pickupLocation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  specialRequests?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Discount code must be uppercase alphanumeric',
  })
  discountCode?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  loyaltyPointsToRedeem?: number;

  @IsOptional()
  applyStudentDiscount?: boolean;
}
