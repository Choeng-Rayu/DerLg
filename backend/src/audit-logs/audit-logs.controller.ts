import { Controller, Get } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service.js';

@Controller('v1/audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async findAll() {
    return this.auditLogsService.findAll();
  }
}
