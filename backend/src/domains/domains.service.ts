import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';

@Injectable()
export class DomainsService {
  constructor(private prisma: PrismaService) {}

  async findByCertification(certificationId: string) {
    return this.prisma.domain.findMany({
      where: { certificationId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  async findById(id: string) {
    const domain = await this.prisma.domain.findUnique({
      where: { id },
      include: {
        certification: true,
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!domain) {
      throw new NotFoundException('Domain not found');
    }

    return domain;
  }

  async create(dto: CreateDomainDto) {
    // Check certification exists
    const cert = await this.prisma.certification.findUnique({
      where: { id: dto.certificationId },
    });
    if (!cert) {
      throw new NotFoundException('Certification not found');
    }

    return this.prisma.domain.create({
      data: {
        certificationId: dto.certificationId,
        name: dto.name,
        code: dto.code,
        description: dto.description,
        weight: dto.weight,
      },
    });
  }

  async update(id: string, dto: UpdateDomainDto) {
    await this.findById(id);

    return this.prisma.domain.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.domain.delete({
      where: { id },
    });
  }
}
