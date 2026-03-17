import { Controller, Get } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';

@Controller('v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async findAll() {
    return this.paymentsService.findAll();
  }
}
