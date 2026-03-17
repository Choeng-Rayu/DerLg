import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StudentDiscountService {
  constructor(private prisma: PrismaService) {}

  async findAllVerifications() {
    return this.prisma.studentVerification.findMany();
  }
}
