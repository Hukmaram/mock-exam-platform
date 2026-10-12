# CertPrep AI — Paid Online Mock Examination Platform

> **A production-quality, extensible mock exam platform built with Next.js (App Router), NestJS, Prisma ORM, PostgreSQL, and Razorpay.**

The platform is designed around a clean **modular monolith** architecture. It supports arbitrary technical certifications without schema redesign, debuting with **GH-600 (GitHub Agentic AI Developer Certification)**.

---

## 1. Key Features

- **Extensible Certification Architecture:** Not hardcoded to any single certification. Certifications own Domains, which own Questions, which compose Exams.
- **Role-Based Access Control:** Strict separation between candidate (`USER`) and staff (`ADMIN`) roles with JWT authentication and HTTP-only cookie support.
- **Server-Side Exam Engine:** Server timestamps enforce strict expiration and automatic submission upon timer expiration. Client-side countdown is continuously synchronized with `expiresAt`.
- **Instant Auto-Save:** Candidate answers are automatically persisted to the database on selection—safeguarding against accidental tab closure, network interruptions, or page refreshes.
- **Modular Scoring Engine:** Exact-match multi-select evaluation and single-choice grading, generating granular domain-by-domain proficiency analytics.
- **Zero-Distraction Candidate UI:** Full-screen exam interface featuring a real-time question navigator, mark-for-review flags, state indicators, and submission confirmation modals.
- **Post-Exam Answer Review:** Once submitted, candidates unlock comprehensive answer rationales and verified correct answers. (Security rule: answers and explanations are stripped from active exam payloads).
- **Payment Gateway Architecture:** Integrated with **Razorpay** with HMAC SHA-256 signature verification and webhook processing. Includes test-mode simulation for instant evaluation.
- **Question Bank Management & Import:** Admin panel supporting creation, filtering, editing, and bulk import from **CSV** and **JSON**. All imported questions enter `DRAFT` status for admin review.
- **Exam Builder:** Supports both manual question selection and automated random question selection conforming to domain and certification constraints.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form |
| **Backend** | NestJS, TypeScript, Passport.js, JWT, Class-Validator, Razorpay SDK, CSV-Parse |
| **Database** | PostgreSQL 16, Prisma ORM |
| **Infrastructure** | Docker, Docker Compose, Multi-stage production container builds |

---

## 3. Seed Credentials & Test Accounts

The platform includes pre-seeded development accounts, 5 certification domains, 25 realistic sample questions, 2 mock exams, and a sample product package:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin@mockexam.local` | `Admin@123456` | Full Admin Console, Question Bank, Orders, Metrics |
| **Normal User** | `user@mockexam.local` | `User@123456` | Pre-entitled candidate with GH-600 package unlocked |

*Note: Sample questions are independent development/sample content for testing and are not official questions from GitHub or Microsoft.*

---

## 4. Quickstart Guide

### Option A: Local Development (PostgreSQL in Docker + Local Dev Servers)

1. **Start PostgreSQL in Docker:**
   ```bash
   docker run -d --name mockexam-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=mockexam -p 5432:5432 postgres:16-alpine
   ```

2. **Setup and Run Backend:**
   ```bash
   cd backend
   npm install
   npx prisma db push
   npx ts-node prisma/seed.ts
   npm run start:dev
   ```
   *Backend will run at [http://localhost:4000](http://localhost:4000)*

3. **Setup and Run Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Frontend will run at [http://localhost:3000](http://localhost:3000)*

---

### Option B: Full Stack Docker Compose

To start the frontend, backend, and postgres services simultaneously:

```bash
docker compose up --build -d
```

To run the database migrations and seed script inside the running container:
```bash
docker compose exec backend npx prisma db push
docker compose exec backend npx ts-node prisma/seed.ts
```

---

## 5. End-to-End Verification & Testing

### Running Backend Unit & Integration Tests

The test suite validates authentication, questions, exams, scoring, and payments:

```bash
cd backend
npm test
```

### Verified Test Suites:
- `ScoringService`: Single-choice evaluation, exact-match multi-select evaluation, unanswered questions, percentage calculations, domain breakdown.
- `AuthService`: User registration, duplicate email rejection, login credentials verification, password hashing.
- `QuestionsService`: Question creation, option validation, status transitions to `PUBLISHED`, answer security redaction for non-admins.
- `PaymentsService`: Order creation, HMAC SHA-256 signature verification, webhook processing, entitlement activation.
- `AttemptsService`: Entitlement checks, exam initiation, server-side timer enforcement, auto-save, auto-submission on expiration.

---

## 6. API Route Reference

### Authentication & Users
- `POST /auth/register` — Register a new account
- `POST /auth/login` — Sign in and receive secure token / HTTP-only cookie
- `POST /auth/logout` — Clear session
- `POST /auth/forgot-password` — Generate password reset token
- `POST /auth/reset-password` — Reset password using token
- `GET  /auth/me` — Current authenticated user profile and entitlements

### Certifications & Domains
- `GET  /certifications` — Public listing of published certifications
- `GET  /certifications/:slug` — Certification details, domains, exams, and pricing
- `POST /certifications` — Create certification (Admin)
- `GET  /domains?certificationId=:id` — List domains for a certification
- `POST /domains` — Create domain (Admin)

### Questions & Question Bank
- `GET    /questions` — Filterable question bank (sanitized for candidates, full for admins)
- `POST   /questions` — Create new question item (Admin)
- `PATCH  /questions/:id/status` — Toggle status (`DRAFT`, `PUBLISHED`, `ARCHIVED`)
- `POST   /questions/import` — Bulk import questions via CSV or JSON into `DRAFT` status

### Exams & Attempts
- `GET  /exams` — List published exams
- `GET  /exams/:id` — Exam introduction and configuration
- `POST /exams` — Create mock exam with manual or random question selection (Admin)
- `POST /attempts` — Start a new exam attempt (enforces package entitlement)
- `GET  /attempts/:id` — Retrieve candidate exam runner state (sanitized questions)
- `POST /attempts/:id/answers` — Auto-save candidate answer (enforces expiration)
- `POST /attempts/:id/submit` — Submit exam and calculate official score
- `GET  /attempts/:id/result` — View score, domain performance, and complete review with rationales
- `GET  /attempts/my` — Candidate attempt history

### Payments & Orders
- `POST /payments/create-order` — Create Razorpay order for mock exam package
- `POST /payments/verify` — Verify HMAC SHA-256 payment signature and grant entitlement
- `POST /payments/webhook` — Razorpay webhook event processor
- `GET  /orders/my` — Candidate order history
- `GET  /admin/dashboard` — Platform revenue, user, and attempt analytics

---

## 7. Question Import Specification

### CSV Format
Import CSV files with the following columns:
```csv
question,type,difficulty,domain,optionA,optionB,optionC,optionD,correctAnswer,explanation
"Which MCP transport is standard for local tools?",SINGLE_CHOICE,EASY,DOM-4,"stdio JSON-RPC","Bluetooth","TCP","UDP",A,"stdio over standard in/out is standard for local MCP tools."
```

### JSON Format
```json
[
  {
    "text": "Which approach follows the principle of least privilege?",
    "type": "SINGLE_CHOICE",
    "difficulty": "MEDIUM",
    "domain": "DOM-5",
    "explanation": "Least privilege provides only the permissions required for the task.",
    "options": [
      { "key": "A", "text": "Grant administrator access", "isCorrect": false },
      { "key": "B", "text": "Grant required permissions only", "isCorrect": true },
      { "key": "C", "text": "Grant organization owner access", "isCorrect": false },
      { "key": "D", "text": "Grant all repository permissions", "isCorrect": false }
    ]
  }
]
```
*(Imported questions always initialize in `DRAFT` status for admin verification).*
