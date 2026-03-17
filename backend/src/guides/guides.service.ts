import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class GuidesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.guide.findMany();
  }
}
