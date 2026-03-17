import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ExploreService {
  constructor(private prisma: PrismaService) {}

  async findAllPlaces() {
    return this.prisma.place.findMany();
  }
}
