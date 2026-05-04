import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmergencyService {
  private readonly logger = new Logger(EmergencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createAlert(
    userId: string,
    data: {
      alertType: string;
      latitude: number;
      longitude: number;
      locationAccuracyM?: number;
      message?: string;
    },
  ) {
    const alert = await this.prisma.emergencyAlert.create({
      data: {
        userId,
        alertType: data.alertType as any,
        latitude: data.latitude,
        longitude: data.longitude,
        locationAccuracyM: data.locationAccuracyM || null,
        message: data.message || null,
        status: 'SENT',
      },
    });

    this.logger.warn(
      `🆘 Emergency alert created: ${alert.alertType} by user ${userId} at ${data.latitude},${data.longitude}`,
    );

    // TODO: Send push notification to emergency contacts
    // TODO: Alert nearby support staff

    return alert;
  }

  async getUserAlerts(userId: string) {
    return this.prisma.emergencyAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acknowledgeAlert(alertId: string) {
    return this.prisma.emergencyAlert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        respondedAt: new Date(),
      },
    });
  }

  async resolveAlert(alertId: string) {
    return this.prisma.emergencyAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });
  }

  getEmergencyContacts() {
    return {
      police: '117',
      ambulance: '119',
      fire: '118',
      touristPolice: '+855-12-942-484',
      derlgEmergency: '+855-XX-XXX-XXX',
      embassies: {
        US: '+855-23-728-000',
        UK: '+855-23-427-124',
        CN: '+855-23-720-920',
      },
    };
  }
}
