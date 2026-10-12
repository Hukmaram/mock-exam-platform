import { Test, TestingModule } from '@nestjs/testing';
import { AttemptsService } from './attempts.service';
import { ScoringService } from './scoring/scoring.service';
import { PrismaService } from '../prisma/prisma.service';
import { AttemptStatus, ExamStatus, Role } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('AttemptsService', () => {
  let service: AttemptsService;
  let prisma: PrismaService;
  let scoringService: ScoringService;

  const mockPrisma = {
    exam: {
      findUnique: jest.fn(),
    },
    entitlement: {
      findFirst: jest.fn(),
    },
    attempt: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    attemptAnswer: {
      upsert: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttemptsService,
        ScoringService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AttemptsService>(AttemptsService);
    prisma = module.get<PrismaService>(PrismaService);
    scoringService = module.get<ScoringService>(ScoringService);
    jest.clearAllMocks();
  });

  describe('startAttempt', () => {
    it('should reject unentitled non-admin user from starting exam', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue({
        id: 'exam-1',
        status: ExamStatus.PUBLISHED,
        examQuestions: [{ id: 'eq-1' }],
      });
      mockPrisma.entitlement.findFirst.mockResolvedValue(null);

      await expect(
        service.startAttempt('user-1', Role.USER, { examId: 'exam-1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow entitled user to start exam with server-side timer expiration', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue({
        id: 'exam-1',
        durationMinutes: 90,
        status: ExamStatus.PUBLISHED,
        examQuestions: [
          {
            orderIndex: 0,
            questionId: 'q-1',
            question: {
              id: 'q-1',
              domain: { id: 'd-1', name: 'Dom 1', code: 'D1' },
              options: [{ id: 'opt-1', key: 'A', text: 'Opt 1' }],
            },
          },
        ],
      });
      mockPrisma.entitlement.findFirst.mockResolvedValue({ id: 'ent-1', isActive: true });
      mockPrisma.attempt.findFirst.mockResolvedValue(null); // No previous active attempt

      mockPrisma.attempt.create.mockResolvedValue({
        id: 'att-1',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 60 * 1000),
        status: AttemptStatus.IN_PROGRESS,
        answers: [],
      });

      const result = await service.startAttempt('user-1', Role.USER, { examId: 'exam-1' });

      expect(result.id).toBe('att-1');
      expect(result.durationMinutes).toBe(90);
      expect(mockPrisma.attempt.create).toHaveBeenCalled();
    });
  });

  describe('saveAnswer and timer enforcement', () => {
    it('should autosave selected answer for in-progress attempt', async () => {
      mockPrisma.attempt.findUnique.mockResolvedValue({
        id: 'att-1',
        userId: 'user-1',
        status: AttemptStatus.IN_PROGRESS,
        expiresAt: new Date(Date.now() + 60000), // In future
      });

      mockPrisma.attemptAnswer.upsert.mockResolvedValue({
        id: 'ans-1',
        selectedOptionIds: ['opt-1'],
        isAnswered: true,
      });

      const res = await service.saveAnswer('user-1', 'att-1', {
        questionId: 'q-1',
        selectedOptionIds: ['opt-1'],
      });

      expect(res.success).toBe(true);
      expect(mockPrisma.attemptAnswer.upsert).toHaveBeenCalled();
    });

    it('should automatically submit exam if timer has expired during saveAnswer', async () => {
      // Expired 5 minutes ago
      mockPrisma.attempt.findUnique.mockResolvedValue({
        id: 'att-1',
        userId: 'user-1',
        status: AttemptStatus.IN_PROGRESS,
        expiresAt: new Date(Date.now() - 5 * 60 * 1000),
        exam: {
          passingPercentage: 70,
          examQuestions: [],
        },
        answers: [],
      });

      mockPrisma.attempt.update.mockResolvedValue({
        id: 'att-1',
        status: AttemptStatus.AUTO_SUBMITTED,
      });

      const res = await service.saveAnswer('user-1', 'att-1', {
        questionId: 'q-1',
        selectedOptionIds: ['opt-1'],
      });

      expect(res.isAutoSubmitted).toBe(true);
    });
  });
});
