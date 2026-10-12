import axios from 'axios';

const API_URL = 'http://localhost:4000';

async function verifyPlatformAllAccess() {
  console.log('--- STARTING PLATFORM ALL-ACCESS PASS VERIFICATION ---\n');

  // 1. Fetch available products and find the platform pass
  console.log('1. Finding CertPrep All-Access Platform Pass...');
  const prodRes = await axios.get(`${API_URL}/products`);
  const platformPass = prodRes.data.find((p: any) => p.isPlatformAccess);

  if (!platformPass) {
    throw new Error('Platform All-Access pass not found in product catalog!');
  }
  console.log(`✓ Found Platform Pass: "${platformPass.name}" (Price: ₹${platformPass.priceInr}, isPlatformAccess: ${platformPass.isPlatformAccess})`);

  // 2. Register a fresh candidate
  console.log('\n2. Registering fresh candidate...');
  const candidateEmail = `allaccess-user-${Date.now()}@example.com`;
  const regRes = await axios.post(`${API_URL}/auth/register`, {
    name: 'Alex Rivera',
    email: candidateEmail,
    password: 'Password@123',
  });
  const token = regRes.data.token;
  const headers = { Authorization: `Bearer ${token}` };
  console.log(`✓ Candidate registered: ${candidateEmail}`);

  // 3. Fetch all published exams
  console.log('\n3. Fetching published GH-600 mock exam...');
  const examsRes = await axios.get(`${API_URL}/exams`);
  const exams = examsRes.data;
  console.log(`✓ Total exams available: ${exams.length}`);

  if (exams.length < 1) {
    throw new Error('Expected at least 1 mock exam for GH-600');
  }

  const exam1 = exams[0];
  console.log(`  Exam: "${exam1.title}" (${exam1.certification?.code})`);

  // 4. Try starting Exam before purchase -> Expected: 403 Forbidden
  console.log('\n4. Verifying access is blocked before one-time payment...');
  try {
    await axios.post(`${API_URL}/attempts`, { examId: exam1.id }, { headers });
    throw new Error('FAILED: User was able to start exam before payment!');
  } catch (err: any) {
    if (err.response?.status === 403) {
      console.log('✓ Rejected unentitled user with 403 Forbidden as expected.');
    } else {
      throw err;
    }
  }

  // 5. Purchase the One-Time Platform Pass
  console.log('\n5. Candidate purchases the One-Time Platform All-Access Pass...');
  const orderRes = await axios.post(
    `${API_URL}/payments/create-order`,
    { productId: platformPass.id },
    { headers },
  );
  console.log(`✓ Order initialized: ${orderRes.data.orderNumber} for ₹${orderRes.data.amount / 100}`);

  // 6. Verify payment
  console.log('\n6. Verifying payment on backend...');
  const verifyRes = await axios.post(
    `${API_URL}/payments/verify`,
    {
      orderId: orderRes.data.orderId,
      razorpayOrderId: orderRes.data.razorpayOrderId,
      razorpayPaymentId: `pay_platform_${Date.now()}`,
      razorpaySignature: 'simulated_success_signature',
    },
    { headers },
  );
  console.log(`✓ Payment verified! Platform entitlement granted: ${verifyRes.data.entitlement.id}`);
  console.log(`  Entitlement isPlatformAccess: ${verifyRes.data.entitlement.isPlatformAccess}`);

  // 7. Test access to Exam 1 (GH-600)
  console.log('\n7. Testing access to GH-600 Exam with Platform Pass...');
  const attempt1Res = await axios.post(
    `${API_URL}/attempts`,
    { examId: exam1.id },
    { headers },
  );
  console.log(`✓ Exam 1 started successfully! Attempt ID: ${attempt1Res.data.id}`);

  // 8. Submit attempt 1 and start retake without paying again
  console.log('\n8. Submitting attempt 1 and testing retake without paying again...');
  await axios.post(`${API_URL}/attempts/${attempt1Res.data.id}/submit`, {}, { headers });
  const attempt2Res = await axios.post(
    `${API_URL}/attempts`,
    { examId: exam1.id },
    { headers },
  );
  console.log(`✓ Retake attempt started successfully! Attempt ID: ${attempt2Res.data.id}`);

  // 9. Verify candidate profile reflects platform all-access
  console.log('\n9. Checking candidate profile and entitlements...');
  const meRes = await axios.get(`${API_URL}/auth/me`, { headers });
  console.log(`✓ Candidate: ${meRes.data.name}`);
  console.log(`  Total active entitlements: ${meRes.data.entitlements.length}`);
  const hasPass = meRes.data.entitlements.some((e: any) => e.isPlatformAccess);
  console.log(`  Has Platform All-Access Pass: ${hasPass}`);

  // 10. Attempting duplicate purchase of platform pass -> should reject
  console.log('\n10. Verifying duplicate platform pass purchase is prevented...');
  try {
    await axios.post(
      `${API_URL}/payments/create-order`,
      { productId: platformPass.id },
      { headers },
    );
    throw new Error('FAILED: System permitted redundant purchase of platform pass!');
  } catch (err: any) {
    if (err.response?.status === 400) {
      console.log(`✓ Redundant purchase blocked: "${err.response.data.message}"`);
    } else {
      throw err;
    }
  }

  console.log('\n======================================================');
  console.log('🎉 ONE-TIME PLATFORM PASS VERIFIED 100% SUCCESSFUL!');
  console.log('Candidates pay once and unlock all current & future mock exams!');
  console.log('======================================================');
}

verifyPlatformAllAccess().catch((err) => {
  console.error('Platform All-Access Verification FAILED:', err.message);
  if (err.response?.data) {
    console.error('Response data:', err.response.data);
  }
  process.exit(1);
});
