import { Module } from '@nestjs/common';
import { StudentDiscountService } from './student-discount.service.js';
import { StudentDiscountController } from './student-discount.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [StudentDiscountController],
  providers: [StudentDiscountService],
  exports: [StudentDiscountService],
})
export class StudentDiscountModule {}
