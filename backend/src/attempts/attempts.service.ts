import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from './scoring/scoring.service';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { AttemptStatus, ExamStatus, Role } from '@prisma/client';

@Injectable()
export class AttemptsService {
  constructor(
    private prisma: PrismaService,
    private scoringService: ScoringService,
  ) {}

  async startAttempt(userId: string, userRole: string, dto: StartAttemptDto) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: dto.examId },
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
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!exam || exam.status !== ExamStatus.PUBLISHED) {
      throw new NotFoundException('Exam not found or not published');
    }

    if (exam.examQuestions.length === 0) {
      throw new BadRequestException('This exam does not have any questions configured');
    }

    // Access / Entitlement verification
    if (userRole !== Role.ADMIN) {
      const entitlement = await this.prisma.entitlement.findFirst({
        where: {
          userId,
          isActive: true,
          OR: [
            { isPlatformAccess: true },
            { certificationId: null, examId: null },
            { examId: exam.id },
            { certificationId: exam.certificationId },
          ],
        },
      });

      if (!entitlement) {
        throw new ForbiddenException(
          'You must purchase platform access before starting this mock exam',
        );
      }
    }

    // Check for an existing in-progress attempt
    const activeAttempt = await this.prisma.attempt.findFirst({
      where: {
        userId,
        examId: exam.id,
        status: AttemptStatus.IN_PROGRESS,
      },
      include: {
        answers: true,
      },
    });

    if (activeAttempt) {
      // Check if expired
      if (new Date() > activeAttempt.expiresAt) {
        await this.finalizeSubmission(activeAttempt.id, AttemptStatus.AUTO_SUBMITTED);
      } else {
        // Return existing active attempt with questions
        return this.formatActiveAttempt(activeAttempt, exam);
      }
    }

    // Create new attempt
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + exam.durationMinutes * 60 * 1000);

    const newAttempt = await this.prisma.$transaction(async (tx) => {
      const attempt = await tx.attempt.create({
        data: {
          userId,
          examId: exam.id,
          startedAt,
          expiresAt,
          status: AttemptStatus.IN_PROGRESS,
          totalQuestions: exam.examQuestions.length,
          answers: {
            create: exam.examQuestions.map((eq) => ({
              questionId: eq.questionId,
              selectedOptionIds: [],
              isAnswered: false,
              isMarkedForReview: false,
            })),
          },
        },
        include: {
          answers: true,
        },
      });

      return attempt;
    });

    return this.formatActiveAttempt(newAttempt, exam);
  }

  async getAttempt(userId: string, attemptId: string, isAdmin = false) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        exam: {
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
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Exam attempt not found');
    }

    if (!isAdmin && attempt.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this attempt');
    }

    // Check timer expiration
    if (
      attempt.status === AttemptStatus.IN_PROGRESS &&
      new Date() > attempt.expiresAt
    ) {
      await this.finalizeSubmission(attempt.id, AttemptStatus.AUTO_SUBMITTED);
      attempt.status = AttemptStatus.AUTO_SUBMITTED;
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      return {
        id: attempt.id,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
        isCompleted: true,
      };
    }

    return this.formatActiveAttempt(attempt, attempt.exam);
  }

  async saveAnswer(userId: string, attemptId: string, dto: SaveAnswerDto) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('Forbidden');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Exam attempt has already been submitted');
    }

    // Enforce server-side timer expiration
    if (new Date() > attempt.expiresAt) {
      await this.finalizeSubmission(attemptId, AttemptStatus.AUTO_SUBMITTED);
      return {
        isAutoSubmitted: true,
        message: 'Exam time has expired and your exam was auto-submitted',
      };
    }

    const isAnswered = dto.selectedOptionIds && dto.selectedOptionIds.length > 0;

    const answer = await this.prisma.attemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId: dto.questionId,
        },
      },
      update: {
        selectedOptionIds: dto.selectedOptionIds,
        isAnswered,
        isMarkedForReview: dto.isMarkedForReview ?? false,
        answeredAt: new Date(),
      },
      create: {
        attemptId,
        questionId: dto.questionId,
        selectedOptionIds: dto.selectedOptionIds,
        isAnswered,
        isMarkedForReview: dto.isMarkedForReview ?? false,
        answeredAt: new Date(),
      },
    });

    return {
      success: true,
      answer,
    };
  }

  async submitAttempt(userId: string, attemptId: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('Forbidden');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      return this.getResult(userId, attemptId);
    }

    const finalStatus =
      new Date() > attempt.expiresAt
        ? AttemptStatus.AUTO_SUBMITTED
        : AttemptStatus.SUBMITTED;

    await this.finalizeSubmission(attemptId, finalStatus);

    return this.getResult(userId, attemptId);
  }

  async getResult(userId: string, attemptId: string, isAdmin = false) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
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
                    },
                  },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (!isAdmin && attempt.userId !== userId) {
      throw new ForbiddenException('Forbidden');
    }

    if (attempt.status === AttemptStatus.IN_PROGRESS) {
      if (new Date() > attempt.expiresAt) {
        await this.finalizeSubmission(attempt.id, AttemptStatus.AUTO_SUBMITTED);
        return this.getResult(userId, attemptId, isAdmin);
      }
      throw new BadRequestException('Exam is still in progress');
    }

    const answersMap = new Map<string, any>();
    for (const ans of attempt.answers) {
      answersMap.set(ans.questionId, ans);
    }

    const reviewQuestions = attempt.exam.examQuestions.map((eq) => {
      const q = eq.question;
      const userAns = answersMap.get(q.id);
      const selectedOptionIds: string[] = (userAns?.selectedOptionIds as string[]) || [];

      const correctOptionIds = q.options
        .filter((opt) => opt.isCorrect)
        .map((opt) => opt.id);

      const isAnswered = selectedOptionIds.length > 0;
      const isCorrect = userAns ? Boolean(userAns.isCorrect) : false;

      return {
        id: q.id,
        orderIndex: eq.orderIndex,
        text: q.text,
        type: q.type,
        difficulty: q.difficulty,
        domain: q.domain,
        explanation: q.explanation,
        options: q.options.map((opt) => ({
          id: opt.id,
          key: opt.key,
          text: opt.text,
          isCorrect: opt.isCorrect,
          explanation: opt.explanation,
          isSelected: selectedOptionIds.includes(opt.id),
        })),
        userAnswer: {
          selectedOptionIds,
          isAnswered,
          isMarkedForReview: userAns?.isMarkedForReview ?? false,
          isCorrect,
        },
        correctOptionIds,
      };
    });

    const timeTakenMinutes = attempt.submittedAt
      ? Math.round(
          (attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 60000,
        )
      : attempt.exam.durationMinutes;

    return {
      attemptId: attempt.id,
      examId: attempt.examId,
      examTitle: attempt.exam.title,
      certification: attempt.exam.certification,
      status: attempt.status,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      submittedAt: attempt.submittedAt,
      durationMinutes: attempt.exam.durationMinutes,
      timeTakenMinutes,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      unansweredCount: attempt.unansweredCount,
      percentage: attempt.percentage,
      passingPercentage: attempt.exam.passingPercentage,
      isPassed: attempt.isPassed,
      domainBreakdown: attempt.domainBreakdown,
      reviewQuestions,
    };
  }

  async listUserAttempts(userId: string) {
    return this.prisma.attempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        exam: {
          include: {
            certification: {
              select: { id: true, name: true, code: true, slug: true },
            },
          },
        },
      },
    });
  }

  async listAllAttempts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      this.prisma.attempt.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          exam: {
            select: {
              id: true,
              title: true,
              passingPercentage: true,
              certification: { select: { code: true, name: true } },
            },
          },
        },
      }),
      this.prisma.attempt.count(),
    ]);

    return {
      attempts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Finalizes submission, scores attempt, and writes immutable results.
   */
  private async finalizeSubmission(attemptId: string, status: AttemptStatus) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            examQuestions: {
              include: {
                question: {
                  include: {
                    domain: true,
                    options: true,
                  },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt || attempt.status !== AttemptStatus.IN_PROGRESS) {
      return;
    }

    const questionsForScoring = attempt.exam.examQuestions.map((eq) => ({
      id: eq.question.id,
      type: eq.question.type,
      domainId: eq.question.domainId,
      domainName: eq.question.domain.name,
      options: eq.question.options.map((opt) => ({
        id: opt.id,
        isCorrect: opt.isCorrect,
      })),
    }));

    const answersForScoring = attempt.answers.map((ans) => ({
      questionId: ans.questionId,
      selectedOptionIds: (ans.selectedOptionIds as string[]) || [],
    }));

    const scoring = this.scoringService.scoreAttempt(
      questionsForScoring,
      answersForScoring,
      attempt.exam.passingPercentage,
    );

    await this.prisma.$transaction(async (tx) => {
      // Update individual answer records with isCorrect
      for (const ans of attempt.answers) {
        const isCorrect = scoring.questionResults.get(ans.questionId) || false;
        await tx.attemptAnswer.update({
          where: { id: ans.id },
          data: { isCorrect },
        });
      }

      // Update attempt record
      await tx.attempt.update({
        where: { id: attempt.id },
        data: {
          status,
          submittedAt: new Date(),
          score: scoring.score,
          correctCount: scoring.correctCount,
          incorrectCount: scoring.incorrectCount,
          unansweredCount: scoring.unansweredCount,
          percentage: scoring.percentage,
          isPassed: scoring.isPassed,
          domainBreakdown: scoring.domainBreakdown as any,
        },
      });
    });
  }

  private formatActiveAttempt(attempt: any, exam: any) {
    const answersMap = new Map<string, any>();
    for (const ans of attempt.answers) {
      answersMap.set(ans.questionId, ans);
    }

    const questions = exam.examQuestions.map((eq: any) => {
      const q = eq.question;
      const userAns = answersMap.get(q.id);

      return {
        id: q.id,
        orderIndex: eq.orderIndex,
        text: q.text,
        type: q.type,
        difficulty: q.difficulty,
        domain: {
          id: q.domain.id,
          name: q.domain.name,
          code: q.domain.code,
        },
        options: q.options.map((opt: any) => ({
          id: opt.id,
          key: opt.key,
          text: opt.text,
        })),
        userAnswer: userAns
          ? {
              selectedOptionIds: userAns.selectedOptionIds,
              isMarkedForReview: userAns.isMarkedForReview,
              isAnswered: userAns.isAnswered,
            }
          : {
              selectedOptionIds: [],
              isMarkedForReview: false,
              isAnswered: false,
            },
      };
    });

    return {
      id: attempt.id,
      examId: exam.id,
      examTitle: exam.title,
      certification: exam.certification,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      durationMinutes: exam.durationMinutes,
      totalQuestions: questions.length,
      status: attempt.status,
      questions,
    };
  }
}
