import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StudentDiscountService } from './student-discount.service';

@Controller('student-discount')
@UseGuards(JwtAuthGuard)
export class StudentDiscountController {
  constructor(private readonly service: StudentDiscountService) {}

  @Post('verify')
  async submitVerification(
    @CurrentUser() user: any,
    @Body()
    body: {
      studentIdImageUrl: string;
      faceSelfieUrl?: string;
      institutionName: string;
    },
  ) {
    return this.service.submitVerification(user.sub, body);
  }

  @Get('status')
  async getStatus(@CurrentUser() user: any) {
    return this.service.getVerificationStatus(user.sub);
  }

  @Post(':id/review')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPPORT')
  async reviewVerification(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { approved: boolean; rejectionReason?: string },
  ) {
    return this.service.reviewVerification(
      id,
      user.sub,
      body.approved,
      body.rejectionReason,
    );
  }
}
