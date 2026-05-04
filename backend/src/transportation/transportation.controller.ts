import { Controller, Get, Param, Query } from '@nestjs/common';
import { TransportationService } from './transportation.service';

@Controller('transportation')
export class TransportationController {
  constructor(private readonly service: TransportationService) {}

  @Get('vehicles')
  async getVehicles(
    @Query('category') category?: string,
    @Query('tier') tier?: string,
    @Query('minSeats') minSeats?: number,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.service.getVehicles({
      category,
      tier,
      minSeats,
      page,
      perPage,
    });
  }

  @Get('vehicles/:id')
  async getVehicleById(@Param('id') id: string) {
    return this.service.getVehicleById(id);
  }
}
