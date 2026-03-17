import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TransportationService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.transportationVehicle.findMany();
  }
}
