import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EntitlementsService {
  constructor(private prisma: PrismaService) {}

  async getUserEntitlements(userId: string) {
    return this.prisma.entitlement.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        product: true,
        certification: true,
        exam: true,
      },
    });
  }

  async checkAccess(userId: string, certificationId?: string, examId?: string): Promise<boolean> {
    // 1. One-time platform all-access grant check (unlocks all mock exams)
    const platformAccess = await this.prisma.entitlement.findFirst({
      where: {
        userId,
        isActive: true,
        OR: [
          { isPlatformAccess: true },
          { certificationId: null, examId: null },
        ],
      },
    });

    if (platformAccess) {
      return true;
    }

    const where: any = {
      userId,
      isActive: true,
      OR: [],
    };

    if (certificationId) {
      where.OR.push({ certificationId });
    }
    if (examId) {
      where.OR.push({ examId });
    }

    if (where.OR.length === 0) {
      return false;
    }

    const count = await this.prisma.entitlement.count({ where });
    return count > 0;
  }
}
