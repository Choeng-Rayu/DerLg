import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentDiscountService {
  private readonly logger = new Logger(StudentDiscountService.name);

  constructor(private readonly prisma: PrismaService) {}

  async submitVerification(
    userId: string,
    data: {
      studentIdImageUrl: string;
      faceSelfieUrl?: string;
      institutionName: string;
    },
  ) {
    // Check if there's already a pending or approved verification
    const existing = await this.prisma.studentVerification.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existing) {
      throw new BadRequestException({
        message:
          existing.status === 'PENDING'
            ? 'Verification already submitted and pending review'
            : 'Student status already verified',
        code: 'DUPLICATE_VERIFICATION',
      });
    }

    return this.prisma.studentVerification.create({
      data: {
        userId,
        studentIdImageUrl: data.studentIdImageUrl,
        faceSelfieUrl: data.faceSelfieUrl || null,
        institutionName: data.institutionName,
        status: 'PENDING',
        expiresAt: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1),
        ),
      },
    });
  }

  async reviewVerification(
    verificationId: string,
    reviewerId: string,
    approved: boolean,
    rejectionReason?: string,
  ) {
    const verification = await this.prisma.studentVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    const updated = await this.prisma.studentVerification.update({
      where: { id: verificationId },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        reviewedBy: reviewerId,
        rejectionReason: approved ? null : rejectionReason || null,
      },
    });

    // If approved, update user's student status
    if (approved) {
      await this.prisma.user.update({
        where: { id: verification.userId },
        data: {
          isStudent: true,
          studentVerifiedAt: new Date(),
        },
      });

      this.logger.log(
        `Student verification approved for user ${verification.userId}`,
      );
    }

    return updated;
  }

  async getVerificationStatus(userId: string) {
    return this.prisma.studentVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
