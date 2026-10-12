import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';
import { QuestionStatus, QuestionType, Difficulty } from '@prisma/client';
import { parse as csvParse } from 'csv-parse/sync';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryQuestionsDto, isAdmin = false) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.certificationId) {
      where.certificationId = query.certificationId;
    }
    if (query.domainId) {
      where.domainId = query.domainId;
    }
    if (query.type) {
      where.type = query.type;
    }
    if (query.difficulty) {
      where.difficulty = query.difficulty;
    }
    if (query.status) {
      where.status = query.status;
    } else if (!isAdmin) {
      where.status = QuestionStatus.PUBLISHED;
    }

    if (query.search) {
      where.OR = [
        { text: { contains: query.search, mode: 'insensitive' } },
        { explanation: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          certification: { select: { id: true, name: true, code: true } },
          domain: { select: { id: true, name: true, code: true } },
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
      }),
      this.prisma.question.count({ where }),
    ]);

    // If not admin, do not expose question-level explanation either
    const sanitized = isAdmin
      ? questions
      : questions.map((q) => {
          const { explanation, ...rest } = q;
          return rest;
        });

    return {
      questions: sanitized,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, isAdmin = false) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        certification: true,
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
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (!isAdmin && question.status !== QuestionStatus.PUBLISHED) {
      throw new NotFoundException('Question not found');
    }

    if (!isAdmin) {
      const { explanation, ...rest } = question;
      return rest;
    }

    return question;
  }

  async create(dto: CreateQuestionDto) {
    this.validateOptions(dto.type, dto.options);

    return this.prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          certificationId: dto.certificationId,
          domainId: dto.domainId,
          text: dto.text,
          type: dto.type,
          difficulty: dto.difficulty,
          status: dto.status ?? QuestionStatus.DRAFT,
          explanation: dto.explanation,
          options: {
            create: dto.options.map((opt) => ({
              key: opt.key,
              text: opt.text,
              isCorrect: opt.isCorrect,
              explanation: opt.explanation,
            })),
          },
        },
        include: {
          options: { orderBy: { key: 'asc' } },
          domain: true,
          certification: true,
        },
      });

      return question;
    });
  }

  async update(id: string, dto: UpdateQuestionDto) {
    const existing = await this.prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });

    if (!existing) {
      throw new NotFoundException('Question not found');
    }

    const newType = dto.type ?? existing.type;

    return this.prisma.$transaction(async (tx) => {
      // If options are provided, replace them or update them
      if (dto.options && dto.options.length > 0) {
        // Map to valid format for validation
        const optsToValidate = dto.options.map((o) => ({
          key: o.key || 'A',
          text: o.text || '',
          isCorrect: o.isCorrect ?? false,
          explanation: o.explanation,
        }));
        this.validateOptions(newType, optsToValidate);

        // Delete existing options and recreate
        await tx.questionOption.deleteMany({ where: { questionId: id } });
        await tx.questionOption.createMany({
          data: dto.options.map((opt) => ({
            questionId: id,
            key: opt.key || 'A',
            text: opt.text || '',
            isCorrect: opt.isCorrect ?? false,
            explanation: opt.explanation,
          })),
        });
      }

      const updated = await tx.question.update({
        where: { id },
        data: {
          certificationId: dto.certificationId,
          domainId: dto.domainId,
          text: dto.text,
          type: dto.type,
          difficulty: dto.difficulty,
          status: dto.status,
          explanation: dto.explanation,
        },
        include: {
          options: { orderBy: { key: 'asc' } },
          domain: true,
          certification: true,
        },
      });

      return updated;
    });
  }

  async updateStatus(id: string, status: QuestionStatus) {
    await this.findById(id, true);
    return this.prisma.question.update({
      where: { id },
      data: { status },
      include: { options: true, domain: true },
    });
  }

  async delete(id: string) {
    await this.findById(id, true);
    return this.prisma.question.delete({
      where: { id },
    });
  }

  async importQuestions(
    certificationId: string,
    fileBuffer: Buffer,
    format: 'csv' | 'json',
    defaultDomainId?: string,
  ) {
    // Verify certification exists
    const cert = await this.prisma.certification.findUnique({
      where: { id: certificationId },
      include: { domains: true },
    });
    if (!cert) {
      throw new NotFoundException('Certification not found');
    }

    const domainMap = new Map<string, string>();
    for (const d of cert.domains) {
      domainMap.set(d.name.toLowerCase().trim(), d.id);
      if (d.code) {
        domainMap.set(d.code.toLowerCase().trim(), d.id);
      }
    }

    const fallbackDomainId = defaultDomainId || (cert.domains[0]?.id ?? null);
    if (!fallbackDomainId) {
      throw new BadRequestException(
        'Certification has no domains. Please create at least one domain first.',
      );
    }

    const importedItems: Array<{
      text: string;
      type: QuestionType;
      difficulty: Difficulty;
      domainId: string;
      explanation: string;
      options: Array<{
        key: string;
        text: string;
        isCorrect: boolean;
        explanation?: string;
      }>;
    }> = [];

    if (format === 'json') {
      let parsed: any;
      try {
        parsed = JSON.parse(fileBuffer.toString('utf-8'));
      } catch (e) {
        throw new BadRequestException('Invalid JSON file format');
      }

      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of list) {
        if (!item.text && !item.question) continue;
        const text = item.text || item.question;
        const type =
          item.type === 'MULTIPLE_CHOICE'
            ? QuestionType.MULTIPLE_CHOICE
            : QuestionType.SINGLE_CHOICE;
        const difficulty =
          item.difficulty === 'HARD'
            ? Difficulty.HARD
            : item.difficulty === 'EASY'
              ? Difficulty.EASY
              : Difficulty.MEDIUM;

        let domainId = fallbackDomainId;
        if (item.domainId) {
          domainId = item.domainId;
        } else if (item.domain || item.domainName) {
          const domKey = (item.domain || item.domainName).toLowerCase().trim();
          domainId = domainMap.get(domKey) || fallbackDomainId;
        }

        const explanation = item.explanation || 'No explanation provided';
        const options: Array<{
          key: string;
          text: string;
          isCorrect: boolean;
          explanation?: string;
        }> = [];

        if (Array.isArray(item.options)) {
          for (let i = 0; i < item.options.length; i++) {
            const opt = item.options[i];
            const defaultKey = String.fromCharCode(65 + i); // A, B, C, D...
            options.push({
              key: opt.key || defaultKey,
              text: opt.text || opt.title || '',
              isCorrect: Boolean(opt.isCorrect),
              explanation: opt.explanation,
            });
          }
        }

        if (options.length >= 2) {
          importedItems.push({
            text,
            type,
            difficulty,
            domainId,
            explanation,
            options,
          });
        }
      }
    } else if (format === 'csv') {
      let records: any[];
      try {
        records = csvParse(fileBuffer.toString('utf-8'), {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });
      } catch (e) {
        throw new BadRequestException('Invalid CSV format: ' + e.message);
      }

      for (const row of records) {
        const text = row.question || row.text || row.Question;
        if (!text) continue;

        const typeStr = (row.type || row.Type || 'SINGLE_CHOICE').toUpperCase();
        const type =
          typeStr === 'MULTIPLE_CHOICE'
            ? QuestionType.MULTIPLE_CHOICE
            : QuestionType.SINGLE_CHOICE;

        const diffStr = (row.difficulty || row.Difficulty || 'MEDIUM').toUpperCase();
        const difficulty =
          diffStr === 'HARD'
            ? Difficulty.HARD
            : diffStr === 'EASY'
              ? Difficulty.EASY
              : Difficulty.MEDIUM;

        const domainStr = row.domain || row.Domain || '';
        let domainId = fallbackDomainId;
        if (domainStr && domainMap.has(domainStr.toLowerCase().trim())) {
          domainId = domainMap.get(domainStr.toLowerCase().trim())!;
        }

        const explanation =
          row.explanation || row.Explanation || 'No explanation provided';

        // Check options: either separate columns (optionA, optionB, etc.) or correct answer letter
        const options: Array<{
          key: string;
          text: string;
          isCorrect: boolean;
          explanation?: string;
        }> = [];

        const correctAnswersStr = (
          row.correctAnswer ||
          row.correct_answer ||
          row.CorrectAnswer ||
          'A'
        )
          .toUpperCase()
          .trim();
        const correctLetters = correctAnswersStr
          .split(/[,;\s]+/)
          .map((s) => s.trim());

        const optKeys = ['A', 'B', 'C', 'D', 'E', 'F'];
        for (const k of optKeys) {
          const optText =
            row[`option${k}`] ||
            row[`Option${k}`] ||
            row[`option_${k.toLowerCase()}`] ||
            row[`Option_${k.toLowerCase()}`];
          if (optText) {
            options.push({
              key: k,
              text: optText,
              isCorrect: correctLetters.includes(k),
            });
          }
        }

        // If no optionA/B columns, check options format "A. opt1 | B. opt2"
        if (options.length === 0 && row.options) {
          const splitted = row.options.split('|');
          for (let i = 0; i < splitted.length; i++) {
            const rawOpt = splitted[i].trim();
            const defaultKey = String.fromCharCode(65 + i);
            const keyMatch = rawOpt.match(/^([A-Fa-f])[\.\)]\s*(.*)$/);
            const key = keyMatch ? keyMatch[1].toUpperCase() : defaultKey;
            const optVal = keyMatch ? keyMatch[2] : rawOpt;
            options.push({
              key,
              text: optVal,
              isCorrect: correctLetters.includes(key),
            });
          }
        }

        if (options.length >= 2) {
          importedItems.push({
            text,
            type,
            difficulty,
            domainId,
            explanation,
            options,
          });
        }
      }
    }

    if (importedItems.length === 0) {
      throw new BadRequestException(
        'No valid questions found in import file. Ensure at least 2 options exist per question.',
      );
    }

    // Insert as DRAFT
    const createdQuestions = await this.prisma.$transaction(
      importedItems.map((item) =>
        this.prisma.question.create({
          data: {
            certificationId,
            domainId: item.domainId,
            text: item.text,
            type: item.type,
            difficulty: item.difficulty,
            status: QuestionStatus.DRAFT, // MUST BE DRAFT per rule 15
            explanation: item.explanation,
            options: {
              create: item.options.map((o) => ({
                key: o.key,
                text: o.text,
                isCorrect: o.isCorrect,
                explanation: o.explanation,
              })),
            },
          },
        }),
      ),
    );

    return {
      message: `Successfully imported ${createdQuestions.length} questions into DRAFT status`,
      importedCount: createdQuestions.length,
      status: 'DRAFT',
    };
  }

  private validateOptions(
    type: QuestionType,
    options: Array<{ key: string; text: string; isCorrect: boolean }>,
  ) {
    if (!options || options.length < 2) {
      throw new BadRequestException('A question must have at least 2 options');
    }

    const correctCount = options.filter((o) => o.isCorrect).length;

    if (correctCount === 0) {
      throw new BadRequestException('At least one option must be marked as correct');
    }

    if (type === QuestionType.SINGLE_CHOICE && correctCount !== 1) {
      throw new BadRequestException(
        'A SINGLE_CHOICE question must have exactly one correct option',
      );
    }

    if (type === QuestionType.MULTIPLE_CHOICE && correctCount < 1) {
      throw new BadRequestException(
        'A MULTIPLE_CHOICE question must have at least one correct option',
      );
    }
  }
}
