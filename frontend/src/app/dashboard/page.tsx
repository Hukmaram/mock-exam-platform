'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Award,
  Layers,
  Clock,
  ArrowRight,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import { formatMinutes } from '@/lib/utils';

export default function UserDashboardPage() {
  const { user, isLoading: authLoading, hasEntitlement, hasPlatformAccess } = useAuth();

  // Fetch user attempts
  const { data: attempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ['my-attempts'],
    queryFn: async () => {
      const res = await api.get('/attempts/my');
      return res.data;
    },
    enabled: Boolean(user),
  });

  // Fetch available exams
  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ['dashboard-exams'],
    queryFn: async () => {
      const res = await api.get('/exams');
      return res.data;
    },
    enabled: Boolean(user),
  });

  if (authLoading || attemptsLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl space-y-6">
        <div className="h-32 rounded-xl bg-muted/20 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="h-28 rounded-xl bg-muted/20 animate-pulse" />
          <div className="h-28 rounded-xl bg-muted/20 animate-pulse" />
          <div className="h-28 rounded-xl bg-muted/20 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <h2 className="text-xl font-bold">Please sign in</h2>
        <p className="text-xs text-muted-foreground mt-2">
          You must be logged in to view your dashboard.
        </p>
        <Link href="/login" className="mt-4 inline-block">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  // Calculate stats
  const completedAttempts = attempts?.filter((a: any) => a.status !== 'IN_PROGRESS') || [];
  const highestScore = completedAttempts.reduce(
    (max: number, a: any) => Math.max(max, a.percentage || 0),
    0,
  );
  const passedCount = completedAttempts.filter((a: any) => a.isPassed).length;

  return (
    <div className="container mx-auto px-4 sm:px-8 py-10 max-w-7xl space-y-10">
      {/* Welcome Banner */}
      <div className="rounded-2xl border p-6 sm:p-8 bg-card shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track your certification mock attempts and resume practice simulations.
          </p>
        </div>

        <Link href="/certifications">
          <Button size="sm" variant="outline" className="text-xs">
            Browse All Certifications
          </Button>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-muted">
          <CardHeader className="p-5 pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center space-x-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span>Total Exams Completed</span>
            </span>
            <CardTitle className="text-3xl font-extrabold mt-1">
              {completedAttempts.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <span className="text-xs text-muted-foreground">
              {passedCount} passed target threshold
            </span>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader className="p-5 pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center space-x-1.5">
              <Award className="h-3.5 w-3.5 text-primary" />
              <span>Highest Score</span>
            </span>
            <CardTitle className="text-3xl font-extrabold mt-1 text-primary">
              {completedAttempts.length > 0 ? `${highestScore}%` : '--'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <span className="text-xs text-muted-foreground">
              Personal best across all attempts
            </span>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader className="p-5 pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center space-x-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Platform Access</span>
            </span>
            <CardTitle className="text-2xl font-extrabold mt-1">
              {user.role === 'ADMIN'
                ? 'Master Admin'
                : hasPlatformAccess
                ? 'All-Access Active'
                : 'Free Tier'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <span className="text-xs text-muted-foreground">
              {hasPlatformAccess
                ? 'All mock exams unlocked'
                : 'Purchase all-access pass to take exams'}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Attempt History Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">My Attempt History</h2>

        {attempts?.length === 0 ? (
          <div className="p-8 text-center border rounded-xl bg-card text-muted-foreground text-xs">
            You haven't attempted any mock exams yet. Select an exam below to begin!
          </div>
        ) : (
          <div className="space-y-3">
            {attempts?.map((att: any) => {
              const isCompleted = att.status !== 'IN_PROGRESS';
              const isPassed = att.isPassed;

              return (
                <div
                  key={att.id}
                  className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {att.exam?.certification?.code || 'EXAM'}
                      </Badge>
                      {att.status === 'IN_PROGRESS' ? (
                        <Badge variant="warning" className="text-[10px]">
                          In Progress
                        </Badge>
                      ) : isPassed ? (
                        <Badge variant="success" className="text-[10px]">
                          Passed ({att.percentage}%)
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">
                          Failed ({att.percentage}%)
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-foreground">
                      {att.exam?.title}
                    </h3>
                    <div className="text-xs text-muted-foreground">
                      Started {new Date(att.startedAt).toLocaleDateString()} at{' '}
                      {new Date(att.startedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                    {att.status === 'IN_PROGRESS' ? (
                      <Link href={`/exam/${att.id}`}>
                        <Button size="sm" className="text-xs">
                          <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                          <span>Resume Exam</span>
                        </Button>
                      </Link>
                    ) : (
                      <>
                        <Link href={`/results/${att.id}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            Review Answers
                          </Button>
                        </Link>
                        <Link href={`/exams/${att.examId}`}>
                          <Button size="sm" className="text-xs">
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />
                            <span>Retake</span>
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Exams Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Available Practice Exams</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams?.map((exam: any) => {
            const isEntitled = hasPlatformAccess || hasEntitlement(exam.certificationId, exam.id);
            return (
              <Card key={exam.id} className="border-muted hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs font-mono">
                      {exam.certification?.code}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatMinutes(exam.durationMinutes)}
                    </span>
                  </div>
                  <CardTitle className="text-base font-semibold">
                    {exam.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 text-xs text-muted-foreground">
                  {exam.totalQuestions} questions • Passing: {exam.passingPercentage}%
                </CardContent>
                <CardFooter className="pt-0">
                  <Link href={`/exams/${exam.id}`} className="w-full">
                    <Button
                      variant={isEntitled ? 'default' : 'outline'}
                      className="w-full text-xs font-semibold"
                    >
                      {isEntitled ? (
                        <>
                          <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                          <span>Start Exam Attempt</span>
                        </>
                      ) : (
                        <span>View Details & Unlock</span>
                      )}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
