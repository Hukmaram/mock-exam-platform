import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;

  const mockPrisma = {
    product: {
      findUnique: jest.fn(),
    },
    entitlement: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
  };

  const mockConfig = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'RAZORPAY_KEY_ID') return 'rzp_test_testkey';
      if (key === 'RAZORPAY_KEY_SECRET') return 'test_secret_key';
      if (key === 'RAZORPAY_WEBHOOK_SECRET') return 'test_webhook_secret';
      if (key === 'RAZORPAY_TEST_MODE') return 'true';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('createPaymentOrder', () => {
    it('should create order successfully for active product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        name: 'GH-600 Mock Exam Package',
        priceInr: 149,
        isActive: true,
      });
      mockPrisma.entitlement.findUnique.mockResolvedValue(null);
      mockPrisma.order.create.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-123456',
        amount: 149,
      });

      const res = await service.createPaymentOrder('user-1', { productId: 'prod-1' });
      expect(res.orderId).toBe('order-1');
      expect(res.amount).toBe(14900); // 149 INR in paise
      expect(mockPrisma.order.create).toHaveBeenCalled();
    });

    it('should reject order if user already has active entitlement', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        isActive: true,
      });
      mockPrisma.entitlement.findUnique.mockResolvedValue({
        id: 'ent-1',
        isActive: true,
      });

      await expect(
        service.createPaymentOrder('user-1', { productId: 'prod-1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment with valid HMAC signature and grant entitlement', async () => {
      const orderId = 'order-1';
      const razorpayOrderId = 'order_rzp_123';
      const razorpayPaymentId = 'pay_rzp_456';
      const secret = 'test_secret_key';

      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      mockPrisma.order.findUnique.mockResolvedValue({
        id: orderId,
        userId: 'user-1',
        status: 'PENDING',
        productId: 'prod-1',
        amount: 149,
        product: { id: 'prod-1', certificationId: 'cert-1', examId: null },
      });

      mockPrisma.order.update.mockResolvedValue({
        id: orderId,
        status: 'PAID',
        userId: 'user-1',
        productId: 'prod-1',
        product: { id: 'prod-1', certificationId: 'cert-1', examId: null },
      });

      mockPrisma.entitlement.upsert.mockResolvedValue({
        id: 'ent-1',
        userId: 'user-1',
        productId: 'prod-1',
        isActive: true,
      });

      const res = await service.verifyPayment('user-1', {
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: signature,
      });

      expect(res.success).toBe(true);
      expect(mockPrisma.entitlement.upsert).toHaveBeenCalled();
    });

    it('should fail verification if signature does not match', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'PENDING',
      });

      await expect(
        service.verifyPayment('user-1', {
          orderId: 'order-1',
          razorpayOrderId: 'order_test',
          razorpayPaymentId: 'pay_test',
          razorpaySignature: 'invalid_tampered_signature',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processWebhook', () => {
    it('should throw UnauthorizedException if webhook signature is missing or invalid', async () => {
      const rawPayload = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
      await expect(
        service.processWebhook(rawPayload, 'invalid_sig'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
