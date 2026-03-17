import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class EmergencyService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.emergencyAlert.findMany();
  }
}
