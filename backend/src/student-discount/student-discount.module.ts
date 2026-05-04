import { Module } from '@nestjs/common';
import { StudentDiscountService } from './student-discount.service';
import { StudentDiscountController } from './student-discount.controller';

@Module({
  controllers: [StudentDiscountController],
  providers: [StudentDiscountService],
  exports: [StudentDiscountService],
})
export class StudentDiscountModule {}
