import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(activeOnly = true) {
    const where = activeOnly ? { isActive: true } : {};
    return this.prisma.product.findMany({
      where,
      orderBy: { priceInr: 'asc' },
      include: {
        certification: {
          select: { id: true, name: true, code: true, slug: true },
        },
        exam: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        certification: true,
        exam: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findByCertification(certificationId: string) {
    return this.prisma.product.findMany({
      where: {
        certificationId,
        isActive: true,
      },
    });
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        priceInr: dto.priceInr,
        certificationId: dto.certificationId,
        examId: dto.examId,
        isPlatformAccess: dto.isPlatformAccess ?? false,
        isActive: dto.isActive ?? true,
        features: dto.features ?? [],
      },
    });
  }

  async update(id: string, dto: Partial<CreateProductDto>) {
    await this.findById(id);

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
