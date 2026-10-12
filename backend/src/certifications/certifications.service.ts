import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';

@Injectable()
export class CertificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(publishedOnly = true) {
    const where = publishedOnly ? { isPublished: true } : {};
    return this.prisma.certification.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        domains: {
          select: { id: true, name: true, code: true, weight: true },
        },
        products: {
          where: { isActive: true },
          select: { id: true, name: true, priceInr: true, features: true },
        },
        _count: {
          select: {
            exams: { where: publishedOnly ? { status: 'PUBLISHED' } : undefined },
            questions: { where: publishedOnly ? { status: 'PUBLISHED' } : undefined },
          },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    const cert = await this.prisma.certification.findUnique({
      where: { slug },
      include: {
        domains: {
          orderBy: { name: 'asc' },
        },
        exams: {
          where: { status: 'PUBLISHED' },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            durationMinutes: true,
            totalQuestions: true,
            passingPercentage: true,
            status: true,
          },
        },
        products: {
          where: { isActive: true },
        },
        _count: {
          select: {
            questions: { where: { status: 'PUBLISHED' } },
            exams: { where: { status: 'PUBLISHED' } },
          },
        },
      },
    });

    if (!cert) {
      throw new NotFoundException(`Certification with slug '${slug}' not found`);
    }

    if (cert.products.length === 0) {
      const platformProducts = await this.prisma.product.findMany({
        where: { isPlatformAccess: true, isActive: true },
      });
      return {
        ...cert,
        products: platformProducts,
      };
    }

    return cert;
  }

  async findById(id: string) {
    const cert = await this.prisma.certification.findUnique({
      where: { id },
      include: {
        domains: true,
        exams: true,
        products: true,
        _count: {
          select: { questions: true, exams: true },
        },
      },
    });

    if (!cert) {
      throw new NotFoundException(`Certification not found`);
    }

    return cert;
  }

  async create(dto: CreateCertificationDto) {
    const existing = await this.prisma.certification.findUnique({
      where: { slug: dto.slug.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException(`Certification with slug '${dto.slug}' already exists`);
    }

    return this.prisma.certification.create({
      data: {
        name: dto.name,
        code: dto.code,
        slug: dto.slug.toLowerCase(),
        description: dto.description,
        isPublished: dto.isPublished ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCertificationDto) {
    await this.findById(id);

    if (dto.slug) {
      const existing = await this.prisma.certification.findUnique({
        where: { slug: dto.slug.toLowerCase() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Certification with slug '${dto.slug}' already exists`);
      }
    }

    return this.prisma.certification.update({
      where: { id },
      data: {
        ...dto,
        slug: dto.slug ? dto.slug.toLowerCase() : undefined,
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.certification.delete({
      where: { id },
    });
  }
}
