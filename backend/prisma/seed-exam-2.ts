import { PrismaClient, QuestionType, Difficulty, QuestionStatus, ExamStatus } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding GH-600 Practice Mock Exam 2 (60 Questions) ---');

  // 1. Fetch Certification
  const cert = await prisma.certification.findUnique({
    where: { slug: 'gh-600' },
  });

  if (!cert) {
    throw new Error('GH-600 certification not found! Please run the initial seed first.');
  }
  console.log(`Found Certification: ${cert.name} (${cert.id})`);

  // 2. Fetch existing domains
  const domainRecords = await prisma.domain.findMany({
    where: { certificationId: cert.id },
  });

  const domainMap: Record<string, string> = {};
  for (const d of domainRecords) {
    if (d.code) {
      domainMap[d.code] = d.id;
    }
  }

  console.log('Available Domains:', Object.keys(domainMap));

  // 3. Load Exam 2 Questions Data
  const jsonPath = path.join(__dirname, 'exam-2-data.json');
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const exam2Questions: Array<{
    orderIndex: number;
    domainCode: string;
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    text: string;
    explanation: string;
    options: Array<{
      key: string;
      text: string;
      explanation: string;
      isCorrect: boolean;
    }>;
  }> = JSON.parse(rawData);

  console.log(`Loaded ${exam2Questions.length} questions from ${jsonPath}`);

  // 4. Upsert Questions & Options
  const questionRecords = [];

  for (const qData of exam2Questions) {
    const domainId = domainMap[qData.domainCode] || domainRecords[0].id;

    let question = await prisma.question.findFirst({
      where: {
        certificationId: cert.id,
        text: qData.text,
      },
    });

    if (!question) {
      question = await prisma.question.create({
        data: {
          certificationId: cert.id,
          domainId,
          text: qData.text,
          type: qData.type as QuestionType,
          difficulty: (qData.difficulty as Difficulty) || Difficulty.MEDIUM,
          status: QuestionStatus.PUBLISHED,
          explanation: qData.explanation,
          options: {
            create: qData.options.map((opt) => ({
              key: opt.key,
              text: opt.text,
              isCorrect: opt.isCorrect,
              explanation: opt.explanation,
            })),
          },
        },
      });
    } else {
      // Refresh options
      await prisma.questionOption.deleteMany({
        where: { questionId: question.id },
      });
      await prisma.questionOption.createMany({
        data: qData.options.map((opt) => ({
          questionId: question.id,
          key: opt.key,
          text: opt.text,
          isCorrect: opt.isCorrect,
          explanation: opt.explanation,
        })),
      });

      question = await prisma.question.update({
        where: { id: question.id },
        data: {
          domainId,
          type: qData.type as QuestionType,
          status: QuestionStatus.PUBLISHED,
          explanation: qData.explanation,
        },
      });
    }

    questionRecords.push(question);
  }

  console.log(`Successfully upserted ${questionRecords.length} questions for Exam 2.`);

  // 5. Create or Update Exam 2
  const examSlug = 'gh-600-practice-exam-2';
  let exam2 = await prisma.exam.findFirst({
    where: { slug: examSlug },
  });

  if (!exam2) {
    exam2 = await prisma.exam.create({
      data: {
        certificationId: cert.id,
        title: 'GH-600 Official Practice Mock Exam 2 (60 Questions)',
        slug: examSlug,
        description:
          '60 comprehensive scenario-based questions weighted across all 6 official GitHub Agentic AI Developer domains. Time yourself: 120 minutes. Passing target: 42/60 (70%). Includes complete answer rationales, option explanations, and domain score analytics.',
        durationMinutes: 120,
        totalQuestions: 60,
        passingPercentage: 70.0,
        status: ExamStatus.PUBLISHED,
        examQuestions: {
          create: questionRecords.map((q, idx) => ({
            questionId: q.id,
            orderIndex: idx + 1,
          })),
        },
      },
    });
  } else {
    // Re-link questions
    await prisma.examQuestion.deleteMany({
      where: { examId: exam2.id },
    });
    await prisma.examQuestion.createMany({
      data: questionRecords.map((q, idx) => ({
        examId: exam2.id,
        questionId: q.id,
        orderIndex: idx + 1,
      })),
    });

    exam2 = await prisma.exam.update({
      where: { id: exam2.id },
      data: {
        title: 'GH-600 Official Practice Mock Exam 2 (60 Questions)',
        description:
          '60 comprehensive scenario-based questions weighted across all 6 official GitHub Agentic AI Developer domains. Time yourself: 120 minutes. Passing target: 42/60 (70%). Includes complete answer rationales, option explanations, and domain score analytics.',
        durationMinutes: 120,
        totalQuestions: 60,
        passingPercentage: 70.0,
        status: ExamStatus.PUBLISHED,
      },
    });
  }

  console.log(`Created/Updated Exam 2: ${exam2.title} (${exam2.id})`);

  // 6. Summary check
  const allExams = await prisma.exam.findMany({
    where: { certificationId: cert.id },
    select: { id: true, title: true, slug: true, totalQuestions: true, durationMinutes: true, status: true },
  });
  console.log('All Exams in Database for GH-600:');
  console.table(allExams);

  const totalQuestions = await prisma.question.count({
    where: { certificationId: cert.id },
  });
  console.log(`Total GH-600 Questions in Database: ${totalQuestions}`);
}

main()
  .catch((e) => {
    console.error('Error during Exam 2 seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
