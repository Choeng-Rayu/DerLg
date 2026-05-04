import { Controller, Get, Param, Query } from '@nestjs/common';
import { HotelsService } from './hotels.service';

@Controller('hotels')
export class HotelsController {
  constructor(private readonly service: HotelsService) {}

  @Get()
  async getHotels(
    @Query('province') province?: string,
    @Query('minStars') minStars?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.service.getHotels({
      province,
      minStars,
      maxPrice,
      page,
      perPage,
    });
  }

  @Get(':id')
  async getHotelById(@Param('id') id: string) {
    return this.service.getHotelById(id);
  }

  @Get(':id/rooms/:roomId/availability')
  async checkRoomAvailability(
    @Param('roomId') roomId: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
  ) {
    return this.service.getRoomAvailability(roomId, checkIn, checkOut);
  }
}
