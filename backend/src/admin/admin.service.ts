import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalOrders,
      paidOrders,
      totalRevenueResult,
      totalExams,
      totalQuestions,
      totalAttempts,
      recentOrders,
      recentAttempts,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PAID } }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.PAID },
        _sum: { amount: true },
      }),
      this.prisma.exam.count(),
      this.prisma.question.count(),
      this.prisma.attempt.count(),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          product: { select: { name: true } },
        },
      }),
      this.prisma.attempt.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          exam: { select: { title: true } },
        },
      }),
    ]);

    // Paid users count: users who have at least one PAID order
    const paidUsersCount = await this.prisma.user.count({
      where: {
        orders: {
          some: { status: OrderStatus.PAID },
        },
      },
    });

    return {
      metrics: {
        totalUsers,
        paidUsers: paidUsersCount,
        totalOrders,
        paidOrders,
        totalRevenue: totalRevenueResult._sum.amount || 0,
        totalExams,
        totalQuestions,
        totalAttempts,
      },
      recentOrders,
      recentAttempts,
    };
  }
}
