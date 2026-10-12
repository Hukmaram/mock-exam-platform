import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import * as crypto from 'crypto';
import Razorpay = require('razorpay');

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: any;
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;
  private readonly isTestMode: boolean;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID', 'rzp_test_mockkey12345');
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET', 'mock_secret_key_67890');
    this.webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET', 'mock_webhook_secret_abc123');
    this.isTestMode = this.configService.get<string>('RAZORPAY_TEST_MODE', 'true') === 'true';

    try {
      this.razorpay = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });
    } catch (e) {
      this.logger.warn('Razorpay client initialization failed, running in simulation mode');
    }
  }

  async createPaymentOrder(userId: string, dto: CreatePaymentOrderDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: {
        certification: true,
      },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found or inactive');
    }

    // Check if user already has active platform-wide entitlement
    const platformEntitlement = await this.prisma.entitlement.findFirst({
      where: {
        userId,
        isActive: true,
        OR: [
          { isPlatformAccess: true },
          { certificationId: null, examId: null },
        ],
      },
    });

    if (platformEntitlement) {
      throw new BadRequestException('You already have active platform all-access to all mock exams');
    }

    // Check if user already has active entitlement for this product
    const existingEntitlement = await this.prisma.entitlement.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: product.id,
        },
      },
    });

    if (existingEntitlement && existingEntitlement.isActive) {
      throw new BadRequestException('You already have active access to this mock exam package');
    }

    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const amountInPaise = product.priceInr * 100;

    let razorpayOrderId = `order_sim_${Date.now()}`;

    // Attempt live Razorpay order creation
    if (this.razorpay && !this.keyId.includes('mockkey')) {
      try {
        const rzpOrder = await this.razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: orderNumber,
          notes: {
            userId,
            productId: product.id,
          },
        });
        razorpayOrderId = rzpOrder.id;
      } catch (err) {
        this.logger.warn(`Razorpay API call failed: ${err.message}. Falling back to simulation ID.`);
      }
    }

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        productId: product.id,
        amount: product.priceInr,
        currency: 'INR',
        status: OrderStatus.PENDING,
        razorpayOrderId,
      },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: this.keyId,
      productName: product.name,
      productDescription: product.description,
      isTestMode: this.isTestMode,
    };
  }

  async verifyPayment(userId: string, dto: VerifyPaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        product: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new UnauthorizedException('Order does not belong to this user');
    }

    if (order.status === OrderStatus.PAID) {
      return {
        success: true,
        message: 'Payment already verified and access is active',
        orderId: order.id,
      };
    }

    // Verify HMAC SHA256 Signature
    const body = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(body)
      .digest('hex');

    const isValidSignature =
      expectedSignature === dto.razorpaySignature ||
      (this.isTestMode &&
        (dto.razorpaySignature === 'simulated_success_signature' ||
          dto.razorpayOrderId.startsWith('order_sim_')));

    if (!isValidSignature) {
      // Mark as failed
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.FAILED },
      });
      throw new BadRequestException('Payment verification failed: Invalid signature');
    }

    return this.completeOrderAndGrantEntitlement(
      order.id,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
      { verifiedVia: 'api_verification' },
    );
  }

  async processWebhook(rawPayload: Buffer, signature: string) {
    if (!signature) {
      throw new UnauthorizedException('Missing signature header');
    }

    // Verify webhook signature with HMAC SHA256
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawPayload)
      .digest('hex');

    const isMatch =
      expectedSignature === signature ||
      (this.isTestMode && signature === 'test_webhook_sig');

    if (!isMatch) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    let event: any;
    try {
      event = JSON.parse(rawPayload.toString('utf-8'));
    } catch (e) {
      throw new BadRequestException('Invalid JSON payload');
    }

    this.logger.log(`Received Razorpay webhook event: ${event.event}`);

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
      const rzpPaymentId = paymentEntity?.id || 'webhook_payment_' + Date.now();

      if (rzpOrderId) {
        const order = await this.prisma.order.findFirst({
          where: { razorpayOrderId: rzpOrderId },
        });

        if (order && order.status !== OrderStatus.PAID) {
          await this.completeOrderAndGrantEntitlement(
            order.id,
            rzpPaymentId,
            signature,
            event,
          );
        }
      }
    }

    return { status: 'ok' };
  }

  private async completeOrderAndGrantEntitlement(
    orderId: string,
    gatewayPaymentId: string,
    signature: string,
    rawPayload?: any,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Update order to PAID
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          razorpayPaymentId: gatewayPaymentId,
          razorpaySignature: signature,
        },
        include: { product: true },
      });

      // Record payment
      await tx.payment.create({
        data: {
          orderId: updatedOrder.id,
          gateway: 'RAZORPAY',
          gatewayPaymentId,
          amount: updatedOrder.amount,
          status: PaymentStatus.SUCCESS,
          rawPayload: rawPayload ?? {},
        },
      });

      // Create or activate entitlement
      const entitlement = await tx.entitlement.upsert({
        where: {
          userId_productId: {
            userId: updatedOrder.userId,
            productId: updatedOrder.productId,
          },
        },
        update: {
          isActive: true,
          certificationId: updatedOrder.product.certificationId,
          examId: updatedOrder.product.examId,
          isPlatformAccess: updatedOrder.product.isPlatformAccess,
        },
        create: {
          userId: updatedOrder.userId,
          productId: updatedOrder.productId,
          certificationId: updatedOrder.product.certificationId,
          examId: updatedOrder.product.examId,
          isPlatformAccess: updatedOrder.product.isPlatformAccess,
          isActive: true,
        },
      });

      return {
        success: true,
        message: 'Payment verified and entitlement granted successfully',
        order: updatedOrder,
        entitlement,
      };
    });
  }
}
