import { Controller, Get } from '@nestjs/common';
import { StudentDiscountService } from './student-discount.service.js';

@Controller('v1/student-discount')
export class StudentDiscountController {
  constructor(private readonly studentDiscountService: StudentDiscountService) {}

  @Get('verifications')
  async findAllVerifications() {
    return this.studentDiscountService.findAllVerifications();
  }
}
