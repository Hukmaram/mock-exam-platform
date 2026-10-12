import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionType, Difficulty, QuestionStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let prisma: PrismaService;

  const mockPrisma = {
    question: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb) => (typeof cb === 'function' ? cb(mockPrisma) : Promise.all(cb))),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create question with options successfully', async () => {
      mockPrisma.question.create.mockResolvedValue({
        id: 'q-1',
        text: 'What is least privilege?',
        type: QuestionType.SINGLE_CHOICE,
        status: QuestionStatus.DRAFT,
      });

      const result = await service.create({
        certificationId: 'cert-1',
        domainId: 'dom-1',
        text: 'What is least privilege?',
        type: QuestionType.SINGLE_CHOICE,
        difficulty: Difficulty.MEDIUM,
        explanation: 'Only minimal required permissions.',
        options: [
          { key: 'A', text: 'Give root', isCorrect: false },
          { key: 'B', text: 'Give minimal permissions', isCorrect: true },
        ],
      });

      expect(mockPrisma.question.create).toHaveBeenCalled();
      expect(result.id).toBe('q-1');
    });

    it('should throw BadRequestException if SINGLE_CHOICE has no correct options', async () => {
      await expect(
        service.create({
          certificationId: 'cert-1',
          domainId: 'dom-1',
          text: 'Invalid question',
          type: QuestionType.SINGLE_CHOICE,
          difficulty: Difficulty.EASY,
          explanation: 'No correct',
          options: [
            { key: 'A', text: 'Opt 1', isCorrect: false },
            { key: 'B', text: 'Opt 2', isCorrect: false },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if SINGLE_CHOICE has multiple correct options', async () => {
      await expect(
        service.create({
          certificationId: 'cert-1',
          domainId: 'dom-1',
          text: 'Invalid question',
          type: QuestionType.SINGLE_CHOICE,
          difficulty: Difficulty.EASY,
          explanation: 'Multiple correct',
          options: [
            { key: 'A', text: 'Opt 1', isCorrect: true },
            { key: 'B', text: 'Opt 2', isCorrect: true },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should update question status to PUBLISHED', async () => {
      mockPrisma.question.findUnique.mockResolvedValue({
        id: 'q-1',
        status: QuestionStatus.DRAFT,
      });
      mockPrisma.question.update.mockResolvedValue({
        id: 'q-1',
        status: QuestionStatus.PUBLISHED,
      });

      const res = await service.updateStatus('q-1', QuestionStatus.PUBLISHED);
      expect(res.status).toBe(QuestionStatus.PUBLISHED);
    });
  });

  describe('security sanitization', () => {
    it('should redact isCorrect and explanation when requested by non-admin', async () => {
      mockPrisma.question.findMany.mockResolvedValue([
        {
          id: 'q-1',
          text: 'Question text',
          explanation: 'Sensitive explanation',
          options: [{ id: 'opt-1', key: 'A', text: 'Option A' }],
        },
      ]);
      mockPrisma.question.count.mockResolvedValue(1);

      const res = await service.findAll({}, false); // non-admin
      expect(res.questions[0]).not.toHaveProperty('explanation');
    });
  });
});
