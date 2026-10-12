import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamStatus, QuestionStatus } from '@prisma/client';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async findAll(certificationId?: string, isAdmin = false) {
    const where: any = {};
    if (certificationId) {
      where.certificationId = certificationId;
    }
    if (!isAdmin) {
      where.status = ExamStatus.PUBLISHED;
    }

    return this.prisma.exam.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        certification: {
          select: { id: true, name: true, code: true, slug: true },
        },
        _count: {
          select: {
            examQuestions: true,
            attempts: true,
          },
        },
      },
    });
  }

  async findById(id: string, isAdmin = false) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        certification: true,
        examQuestions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            question: {
              include: {
                domain: true,
                options: {
                  orderBy: { key: 'asc' },
                  select: {
                    id: true,
                    key: true,
                    text: true,
                    isCorrect: isAdmin,
                    explanation: isAdmin,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (!isAdmin && exam.status !== ExamStatus.PUBLISHED) {
      throw new NotFoundException('Exam not found');
    }

    if (!isAdmin) {
      // Remove question explanations if not admin
      const sanitizedQuestions = exam.examQuestions.map((eq) => {
        const { explanation, ...questionRest } = eq.question;
        return {
          ...eq,
          question: questionRest,
        };
      });
      return {
        ...exam,
        examQuestions: sanitizedQuestions,
      };
    }

    return exam;
  }

  async create(dto: CreateExamDto) {
    const existing = await this.prisma.exam.findFirst({
      where: { slug: dto.slug.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException(`Exam with slug '${dto.slug}' already exists`);
    }

    let finalQuestionIds: string[] = [];

    if (dto.randomSelection) {
      // Pick random published questions for this certification
      const published = await this.prisma.question.findMany({
        where: {
          certificationId: dto.certificationId,
          status: QuestionStatus.PUBLISHED,
        },
        select: { id: true },
      });

      if (published.length < dto.totalQuestions) {
        throw new BadRequestException(
          `Only ${published.length} published questions available for this certification, but ${dto.totalQuestions} required.`,
        );
      }

      // Shuffle and slice
      const shuffled = [...published].sort(() => 0.5 - Math.random());
      finalQuestionIds = shuffled.slice(0, dto.totalQuestions).map((q) => q.id);
    } else if (dto.questionIds && dto.questionIds.length > 0) {
      finalQuestionIds = dto.questionIds;
    }

    return this.prisma.$transaction(async (tx) => {
      const exam = await tx.exam.create({
        data: {
          certificationId: dto.certificationId,
          title: dto.title,
          slug: dto.slug.toLowerCase(),
          description: dto.description,
          durationMinutes: dto.durationMinutes,
          totalQuestions: finalQuestionIds.length > 0 ? finalQuestionIds.length : dto.totalQuestions,
          passingPercentage: dto.passingPercentage,
          status: dto.status ?? ExamStatus.DRAFT,
          examQuestions: {
            create: finalQuestionIds.map((qId, idx) => ({
              questionId: qId,
              orderIndex: idx,
            })),
          },
        },
        include: {
          certification: true,
          examQuestions: { include: { question: true } },
        },
      });

      return exam;
    });
  }

  async update(id: string, dto: UpdateExamDto) {
    await this.findById(id, true);

    if (dto.slug) {
      const existing = await this.prisma.exam.findFirst({
        where: { slug: dto.slug.toLowerCase() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Exam with slug '${dto.slug}' already exists`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.questionIds) {
        await tx.examQuestion.deleteMany({ where: { examId: id } });
        await tx.examQuestion.createMany({
          data: dto.questionIds.map((qId, idx) => ({
            examId: id,
            questionId: qId,
            orderIndex: idx,
          })),
        });
      }

      const updated = await tx.exam.update({
        where: { id },
        data: {
          title: dto.title,
          slug: dto.slug ? dto.slug.toLowerCase() : undefined,
          description: dto.description,
          durationMinutes: dto.durationMinutes,
          totalQuestions: dto.totalQuestions ?? (dto.questionIds ? dto.questionIds.length : undefined),
          passingPercentage: dto.passingPercentage,
          status: dto.status,
          certificationId: dto.certificationId,
        },
        include: {
          certification: true,
          examQuestions: { include: { question: true } },
        },
      });

      return updated;
    });
  }

  async updateStatus(id: string, status: ExamStatus) {
    await this.findById(id, true);
    return this.prisma.exam.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string) {
    await this.findById(id, true);
    return this.prisma.exam.delete({
      where: { id },
    });
  }
}
