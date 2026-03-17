import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AiToolsService {
  constructor(private prisma: PrismaService) {}

  async findAllSessions() {
    return this.prisma.aISession.findMany();
  }
}
