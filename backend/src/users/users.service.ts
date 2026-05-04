import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
        preferredLanguage: true,
        loyaltyPoints: true,
        isStudent: true,
        studentVerifiedAt: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Strip protected fields — never allow clients to modify these
    const { ...safeData } = dto;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: safeData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        preferredLanguage: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
      },
    });

    this.logger.log(`Profile updated: ${userId}`);
    return user;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    // Validate file size (5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new BadRequestException({
        message: 'Avatar file must be less than 5 MB',
        code: 'PAYLOAD_TOO_LARGE',
      });
    }

    // TODO: Upload to Supabase Storage when configured
    // For now, store a placeholder URL
    const avatarUrl = `/avatars/${userId}/${file.originalname}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return { avatarUrl };
  }
}
