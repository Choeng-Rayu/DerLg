import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  async findAllTransactions() {
    return this.prisma.loyaltyTransaction.findMany();
  }
}
