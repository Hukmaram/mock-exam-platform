'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckoutModal } from '@/features/payments/checkout-modal';
import {
  Clock,
  BookOpen,
  CheckCircle2,
  Lock,
  Play,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { formatMinutes } from '@/lib/utils';

export default function ExamIntroPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const { user, hasEntitlement, hasPlatformAccess } = useAuth();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const { data: exam, isLoading } = useQuery({
    queryKey: ['exam-intro', examId],
    queryFn: async () => {
      const res = await api.get(`/exams/${examId}`);
      return res.data;
    },
    enabled: Boolean(examId),
  });

  const isEntitled = hasPlatformAccess || (exam ? hasEntitlement(exam.certificationId, exam.id) : false);

  const handleStartExam = async () => {
    if (!user) {
      router.push(`/login?redirect=/exams/${examId}`);
      return;
    }

    if (!isEntitled) {
      // Find platform all-access pass to purchase
      try {
        const res = await api.get('/products');
        const prod =
          res.data?.find((p: any) => p.isPlatformAccess) ||
          res.data?.find((p: any) => p.certificationId === exam.certificationId) ||
          res.data?.[0];
        if (prod) {
          setSelectedProduct(prod);
        }
      } catch (e) {
        setError('Please purchase platform all-access before starting.');
      }
      return;
    }

    setStarting(true);
    setError(null);

    try {
      const res = await api.post('/attempts', { examId });
      const attemptId = res.data.id;
      router.push(`/exam/${attemptId}`);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to start exam attempt. Please try again.',
      );
      setStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="h-64 rounded-xl bg-muted/20 animate-pulse" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <h2 className="text-xl font-bold">Exam Not Found</h2>
        <Link href="/exams" className="mt-4 inline-block">
          <Button variant="outline">Back to Exams</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-8 py-10 max-w-4xl space-y-8">
      <div>
        <Link
          href={`/certifications/${exam.certification?.slug || ''}`}
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          <span>Back to {exam.certification?.name || 'Certification'}</span>
        </Link>
      </div>

      <Card className="border-muted shadow-md">
        <CardHeader className="space-y-2 border-b bg-muted/10 pb-6">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold">
              {exam.certification?.code || 'CERT'}
            </Badge>
            {isEntitled ? (
              <Badge variant="success" className="text-xs">
                Access Unlocked
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Package Required
              </Badge>
            )}
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">
            {exam.title}
          </CardTitle>
          {exam.description && (
            <CardDescription className="text-sm">
              {exam.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Key Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border bg-card flex flex-col space-y-1">
              <span className="text-xs text-muted-foreground flex items-center space-x-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>Time Allowed</span>
              </span>
              <span className="text-xl font-bold text-foreground">
                {formatMinutes(exam.durationMinutes)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Strict server timer
              </span>
            </div>

            <div className="p-4 rounded-xl border bg-card flex flex-col space-y-1">
              <span className="text-xs text-muted-foreground flex items-center space-x-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span>Questions</span>
              </span>
              <span className="text-xl font-bold text-foreground">
                {exam.totalQuestions} Items
              </span>
              <span className="text-[11px] text-muted-foreground">
                Single & multiple choice
              </span>
            </div>

            <div className="p-4 rounded-xl border bg-card flex flex-col space-y-1">
              <span className="text-xs text-muted-foreground flex items-center space-x-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>Passing Grade</span>
              </span>
              <span className="text-xl font-bold text-foreground">
                {exam.passingPercentage}%
              </span>
              <span className="text-[11px] text-muted-foreground">
                Scaled exact-match grading
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-xl border bg-muted/20 p-5 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Examination Instructions & Rules
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <li className="flex items-start space-x-2">
                <span className="font-bold text-primary">•</span>
                <span>
                  <strong>Server-side timer:</strong> Once you click Start, your attempt is created on the server. If you refresh or close the tab, the timer continues running.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-primary">•</span>
                <span>
                  <strong>Instant auto-save:</strong> Every answer you select is immediately saved. You do not need to press save.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-primary">•</span>
                <span>
                  <strong>Question navigator:</strong> You can jump between questions at any time, or mark questions for review before submitting.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-primary">•</span>
                <span>
                  <strong>Automatic submission:</strong> If your time expires, your exam will be automatically graded and submitted with whatever answers were saved.
                </span>
              </li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t bg-muted/10 p-6">
          <div className="text-xs text-muted-foreground">
            {isEntitled ? (
              <span>Your account has active access to this mock exam.</span>
            ) : (
              <span>Mock exam package purchase required to start attempt.</span>
            )}
          </div>

          <Button
            onClick={handleStartExam}
            disabled={starting}
            size="lg"
            className="w-full sm:w-auto font-semibold px-8 bg-primary hover:bg-[#C16345] text-primary-foreground"
          >
            {starting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Launching Exam Environment...</span>
              </>
            ) : isEntitled ? (
              <>
                <Play className="h-4 w-4 mr-2 fill-current" />
                <span>Start Mock Exam Now</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                <span>Unlock Platform All-Access Pass</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Checkout Modal */}
      {selectedProduct && (
        <CheckoutModal
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
        />
      )}
    </div>
  );
}
