import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cert = await prisma.certification.findUnique({
    where: { slug: 'gh-600' },
    include: {
      domains: { include: { _count: { select: { questions: true } } } },
      exams: { include: { examQuestions: true } },
      _count: { select: { questions: true } },
      products: true,
    },
  });

  if (!cert) {
    console.error('GH-600 certification not found in database!');
    process.exit(1);
  }

  console.log(`Certification: ${cert.name} (${cert.code})`);
  console.log(`Total Questions in Question Bank: ${cert._count.questions}`);
  console.log('\nDomains Breakdown:');
  for (const d of cert.domains) {
    console.log(`  [${d.code}] ${d.name} (${d.weight}% weight): ${d._count.questions} questions`);
  }

  console.log('\nMock Exams:');
  for (const e of cert.exams) {
    console.log(`  Title: ${e.title}`);
    console.log(`  Duration: ${e.durationMinutes} minutes`);
    console.log(`  Passing Score: ${e.passingPercentage}%`);
    console.log(`  Questions Attached: ${e.examQuestions.length}`);
  }

  console.log('\nProducts Available on Platform:');
  const allProducts = await prisma.product.findMany();
  for (const p of allProducts) {
    console.log(`  Product: ${p.name} — ₹${p.priceInr} | isPlatformAccess: ${p.isPlatformAccess} | Cert: ${p.certificationId || 'ALL'}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
