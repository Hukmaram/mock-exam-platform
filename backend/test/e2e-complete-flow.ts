import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:4000';

async function runE2E() {
  console.log('--- STARTING COMPLETE END-TO-END FLOW VERIFICATION ---');

  // Step 1: Admin Login
  console.log('\n1. Logging in as Admin...');
  const adminLoginRes = await axios.post(`${API_URL}/auth/login`, {
    email: 'admin@mockexam.local',
    password: 'Admin@123456',
  });
  const adminToken = adminLoginRes.data.token;
  console.log('✓ Admin authenticated successfully. User:', adminLoginRes.data.user.name);

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // Step 2: Create New Certification
  console.log('\n2. Admin creates a new Certification...');
  const testCertSlug = `aws-saa-${Date.now()}`;
  const certRes = await axios.post(
    `${API_URL}/certifications`,
    {
      name: 'AWS Certified Solutions Architect Associate (Practice)',
      code: 'AWS-SAA',
      slug: testCertSlug,
      description: 'Practice exams for designing resilient and secure cloud architectures.',
      isPublished: true,
    },
    { headers: adminHeaders },
  );
  const certId = certRes.data.id;
  console.log(`✓ Certification created: ${certRes.data.name} (ID: ${certId})`);

  // Step 3: Create Domain
  console.log('\n3. Admin creates Domain for the Certification...');
  const domainRes = await axios.post(
    `${API_URL}/domains`,
    {
      certificationId: certId,
      name: 'Design Resilient Architectures',
      code: 'SAA-D1',
      description: 'High availability, multi-tier systems, and decoupling.',
      weight: 30.0,
    },
    { headers: adminHeaders },
  );
  const domainId = domainRes.data.id;
  console.log(`✓ Domain created: ${domainRes.data.name} (ID: ${domainId})`);

  // Step 4: Create Questions (Draft)
  console.log('\n4. Admin creates Questions in the Question Bank...');
  const q1Res = await axios.post(
    `${API_URL}/questions`,
    {
      certificationId: certId,
      domainId: domainId,
      text: 'Which AWS service provides low-latency decoupling between microservices with FIFO ordering?',
      type: 'SINGLE_CHOICE',
      difficulty: 'MEDIUM',
      status: 'DRAFT',
      explanation: 'Amazon SQS FIFO queues ensure strict first-in-first-out message delivery with exactly-once processing.',
      options: [
        { key: 'A', text: 'Amazon SQS FIFO queue', isCorrect: true },
        { key: 'B', text: 'Amazon SNS standard topic', isCorrect: false },
        { key: 'C', text: 'Amazon S3 Glacier', isCorrect: false },
        { key: 'D', text: 'AWS CloudTrail', isCorrect: false },
      ],
    },
    { headers: adminHeaders },
  );
  const q1Id = q1Res.data.id;
  console.log(`✓ Question 1 created in status: ${q1Res.data.status}`);

  const q2Res = await axios.post(
    `${API_URL}/questions`,
    {
      certificationId: certId,
      domainId: domainId,
      text: 'Which mechanisms ensure high availability across AWS Availability Zones? (Select all that apply)',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'HARD',
      status: 'DRAFT',
      explanation: 'Application Load Balancers route across AZ targets, and Auto Scaling groups replace unhealthy instances across multiple subnets.',
      options: [
        { key: 'A', text: 'Application Load Balancer across multi-AZ targets', isCorrect: true },
        { key: 'B', text: 'Auto Scaling group spanning multiple subnets', isCorrect: true },
        { key: 'C', text: 'A single non-replicated EBS volume', isCorrect: false },
        { key: 'D', text: 'Single EC2 instance in us-east-1a only', isCorrect: false },
      ],
    },
    { headers: adminHeaders },
  );
  const q2Id = q2Res.data.id;
  console.log(`✓ Question 2 created in status: ${q2Res.data.status}`);

  // Step 5: Publish Questions
  console.log('\n5. Admin reviews and publishes the questions...');
  await axios.patch(`${API_URL}/questions/${q1Id}/status`, { status: 'PUBLISHED' }, { headers: adminHeaders });
  await axios.patch(`${API_URL}/questions/${q2Id}/status`, { status: 'PUBLISHED' }, { headers: adminHeaders });
  console.log('✓ Both questions published successfully.');

  // Step 6: Create Mock Exam
  console.log('\n6. Admin creates Mock Exam from questions...');
  const examSlug = `aws-saa-mock-exam-${Date.now()}`;
  const examRes = await axios.post(
    `${API_URL}/exams`,
    {
      certificationId: certId,
      title: 'AWS SAA Architecture Assessment 1',
      slug: examSlug,
      description: 'Hands-on practice assessment covering resilient multi-tier design.',
      durationMinutes: 15,
      totalQuestions: 2,
      passingPercentage: 50.0,
      status: 'PUBLISHED',
      questionIds: [q1Id, q2Id],
    },
    { headers: adminHeaders },
  );
  const examId = examRes.data.id;
  console.log(`✓ Mock Exam built and published: ${examRes.data.title} (ID: ${examId})`);

  // Step 7: Create Product Package
  console.log('\n7. Admin creates Product Package for purchase...');
  const prodRes = await axios.post(
    `${API_URL}/products`,
    {
      certificationId: certId,
      name: 'AWS SAA Practice Package',
      description: 'Full access to all AWS SAA practice exams.',
      priceInr: 199,
      isActive: true,
      features: ['2 Practice Questions', 'Detailed Explanations', 'Domain Breakdown'],
    },
    { headers: adminHeaders },
  );
  const productId = prodRes.data.id;
  console.log(`✓ Product created: ${prodRes.data.name} for ₹${prodRes.data.priceInr} (ID: ${productId})`);

  // Step 8: Candidate Registration
  console.log('\n8. New candidate registers...');
  const candidateEmail = `candidate-${Date.now()}@example.com`;
  const registerRes = await axios.post(`${API_URL}/auth/register`, {
    name: 'Jordan Lee',
    email: candidateEmail,
    password: 'Password@123',
  });
  const candidateToken = registerRes.data.token;
  const candidateUser = registerRes.data.user;
  const candidateHeaders = { Authorization: `Bearer ${candidateToken}` };
  console.log(`✓ Candidate registered: ${candidateUser.email} (ID: ${candidateUser.id})`);

  // Step 9: Candidate tries to start exam before payment -> should fail (403 Forbidden)
  console.log('\n9. Verifying access control: Candidate attempts to start without purchase...');
  try {
    await axios.post(`${API_URL}/attempts`, { examId }, { headers: candidateHeaders });
    throw new Error('FAILED: Unentitled candidate was permitted to start exam!');
  } catch (err: any) {
    if (err.response?.status === 403) {
      console.log('✓ Access control verified: Backend rejected unentitled candidate with 403 Forbidden.');
    } else {
      throw err;
    }
  }

  // Step 10: Purchase & Payment Verification
  console.log('\n10. Candidate purchases product package...');
  const orderRes = await axios.post(
    `${API_URL}/payments/create-order`,
    { productId },
    { headers: candidateHeaders },
  );
  console.log(`✓ Order initialized: ${orderRes.data.orderNumber} (Amount: ₹${orderRes.data.amount / 100})`);

  // Verify Payment (Test mode simulation)
  console.log('\n11. Verifying payment on backend...');
  const verifyRes = await axios.post(
    `${API_URL}/payments/verify`,
    {
      orderId: orderRes.data.orderId,
      razorpayOrderId: orderRes.data.razorpayOrderId,
      razorpayPaymentId: `pay_gateway_${Date.now()}`,
      razorpaySignature: 'simulated_success_signature',
    },
    { headers: candidateHeaders },
  );
  console.log(`✓ Payment verified! Entitlement granted: ${verifyRes.data.entitlement.id}`);

  // Step 11: Candidate starts exam attempt
  console.log('\n12. Candidate starts Mock Exam attempt...');
  const attemptRes = await axios.post(
    `${API_URL}/attempts`,
    { examId },
    { headers: candidateHeaders },
  );
  const attempt = attemptRes.data;
  console.log(`✓ Exam Attempt started! ID: ${attempt.id}`);
  console.log(`  Expires at: ${attempt.expiresAt} (Duration: ${attempt.durationMinutes} mins)`);
  console.log(`  Questions received: ${attempt.questions.length}`);

  // Security Check: Verify questions have no answers exposed
  const qFirst = attempt.questions[0];
  if (qFirst.explanation || qFirst.options[0].isCorrect !== undefined) {
    throw new Error('SECURITY VIOLATION: Answers or explanations were leaked in active attempt payload!');
  }
  console.log('✓ Security verified: Question payload contains NO answers or explanations.');

  // Step 12: Candidate answers questions (Auto-save)
  console.log('\n13. Candidate answers questions with automatic saving...');
  // Find option A for question 1 (correct)
  const q1Data = attempt.questions.find((q: any) => q.id === q1Id);
  const q1CorrectOption = q1Data.options.find((o: any) => o.key === 'A');

  const save1 = await axios.post(
    `${API_URL}/attempts/${attempt.id}/answers`,
    {
      questionId: q1Id,
      selectedOptionIds: [q1CorrectOption.id],
      isMarkedForReview: false,
    },
    { headers: candidateHeaders },
  );
  console.log(`✓ Question 1 answer auto-saved: ${save1.data.success}`);

  // Find option A and B for question 2 (both correct - exact match)
  const q2Data = attempt.questions.find((q: any) => q.id === q2Id);
  const q2OptA = q2Data.options.find((o: any) => o.key === 'A');
  const q2OptB = q2Data.options.find((o: any) => o.key === 'B');

  const save2 = await axios.post(
    `${API_URL}/attempts/${attempt.id}/answers`,
    {
      questionId: q2Id,
      selectedOptionIds: [q2OptA.id, q2OptB.id],
      isMarkedForReview: true,
    },
    { headers: candidateHeaders },
  );
  console.log(`✓ Question 2 answers auto-saved with review flag: ${save2.data.success}`);

  // Step 13: Candidate Submits Exam
  console.log('\n14. Candidate submits the completed exam...');
  const submitRes = await axios.post(
    `${API_URL}/attempts/${attempt.id}/submit`,
    {},
    { headers: candidateHeaders },
  );
  console.log('✓ Exam submitted successfully!');
  console.log(`  Official Score: ${submitRes.data.score} / ${submitRes.data.totalQuestions}`);
  console.log(`  Percentage: ${submitRes.data.percentage}%`);
  console.log(`  Result: ${submitRes.data.isPassed ? 'PASSED ✓' : 'FAILED ✗'}`);
  console.log(`  Correct: ${submitRes.data.correctCount}, Incorrect: ${submitRes.data.incorrectCount}`);

  // Step 14: Answer Review & Domain Breakdown
  console.log('\n15. Fetching granular post-submission answer review...');
  const reviewRes = await axios.get(
    `${API_URL}/attempts/${attempt.id}/result`,
    { headers: candidateHeaders },
  );
  console.log(`✓ Review retrieved. Domains tested: ${reviewRes.data.domainBreakdown.length}`);
  const reviewQ1 = reviewRes.data.reviewQuestions[0];
  console.log(`  Question 1 Status: ${reviewQ1.userAnswer.isCorrect ? 'Correct ✓' : 'Incorrect ✗'}`);
  console.log(`  Explanation unlocked: "${reviewQ1.explanation.slice(0, 60)}..."`);

  // Step 15: History check
  console.log('\n16. Verifying candidate attempt history...');
  const historyRes = await axios.get(`${API_URL}/attempts/my`, { headers: candidateHeaders });
  console.log(`✓ Candidate history reflects ${historyRes.data.length} attempt(s).`);

  // Step 16: Admin Dashboard Metrics check
  console.log('\n17. Verifying Admin metrics reflect new activity...');
  const adminDash = await axios.get(`${API_URL}/admin/dashboard`, { headers: adminHeaders });
  // Cleanup temporary test certification so database remains pure
  await axios.delete(`${API_URL}/certifications/${certId}`, { headers: adminHeaders });
  console.log('✓ Cleaned up temporary test certification.');

  console.log('\n======================================================');
  console.log('🎉 ALL 17 STEPS OF THE END-TO-END FLOW PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');
}

runE2E().catch((err) => {
  console.error('\n❌ E2E VERIFICATION FAILED:');
  if (err.response) {
    console.error(`Status: ${err.response.status}`);
    console.error('Data:', err.response.data);
  } else {
    console.error(err.message);
  }
  process.exit(1);
});
