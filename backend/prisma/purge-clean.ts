import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('Cleaning up database to leave ONLY the 1 official GH-600 Mock Exam (41 questions)...');

  // 1. Delete all non-GH-600 certifications (e.g. AWS, etc.)
  const nonGhCerts = await prisma.certification.findMany({
    where: {
      slug: { not: 'gh-600' },
    },
  });

  for (const cert of nonGhCerts) {
    console.log(`Deleting non-GH600 certification: ${cert.name} (${cert.code})...`);
    await prisma.certification.delete({
      where: { id: cert.id },
    });
  }

  // 2. In GH-600, keep only the single 41-question exam
  const gh600Cert = await prisma.certification.findUnique({
    where: { slug: 'gh-600' },
    include: {
      exams: true,
      questions: true,
    },
  });

  if (!gh600Cert) {
    console.error('GH-600 certification not found!');
    return;
  }

  // Find the official 41-question exam
  const officialExam = gh600Cert.exams.find(
    (e) => e.slug === 'gh-600-practice-exam' || e.totalQuestions === 41,
  );

  // Delete any other exams in GH-600
  for (const exam of gh600Cert.exams) {
    if (officialExam && exam.id !== officialExam.id) {
      console.log(`Deleting extra exam: ${exam.title} (${exam.id})...`);
      await prisma.exam.delete({
        where: { id: exam.id },
      });
    }
  }

  // Find the questions attached to the official 41-question exam
  if (officialExam) {
    const examQuestions = await prisma.examQuestion.findMany({
      where: { examId: officialExam.id },
      select: { questionId: true },
    });
    const officialQuestionIds = new Set(examQuestions.map((eq) => eq.questionId));

    // Delete any questions in GH-600 that are not part of the 41 official questions
    const extraQuestions = gh600Cert.questions.filter(
      (q) => !officialQuestionIds.has(q.id),
    );

    for (const q of extraQuestions) {
      console.log(`Deleting extra question: ${q.text.substring(0, 40)}...`);
      await prisma.question.delete({
        where: { id: q.id },
      });
    }
  }

  // 3. Delete any products that are not the Platform All-Access Pass
  const extraProducts = await prisma.product.findMany({
    where: {
      OR: [
        { isPlatformAccess: false },
        { name: { contains: 'AWS' } },
      ],
    },
  });

  for (const p of extraProducts) {
    console.log(`Deleting extra product: ${p.name}...`);
    // Delete related orders/entitlements first if needed
    await prisma.order.deleteMany({ where: { productId: p.id } });
    await prisma.entitlement.deleteMany({ where: { productId: p.id } });
    await prisma.product.delete({ where: { id: p.id } });
  }

  // 4. Verify final state
  const finalCerts = await prisma.certification.findMany({
    include: {
      exams: { include: { _count: { select: { examQuestions: true } } } },
      _count: { select: { questions: true } },
    },
  });

  console.log('\n--- FINAL CLEAN DATABASE STATE ---');
  for (const c of finalCerts) {
    console.log(`Certification: ${c.name} (${c.code})`);
    console.log(`  Total Questions in Bank: ${c._count.questions}`);
    console.log(`  Exams (${c.exams.length}):`);
    for (const e of c.exams) {
      console.log(`    - ${e.title} (${e.durationMinutes} mins, passing: ${e.passingPercentage}%, ${e._count.examQuestions} questions)`);
    }
  }

  const finalProducts = await prisma.product.findMany();
  console.log(`Products (${finalProducts.length}):`);
  for (const p of finalProducts) {
    console.log(`  - ${p.name} (₹${p.priceInr}) | Platform Access: ${p.isPlatformAccess}`);
  }
}

cleanDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
