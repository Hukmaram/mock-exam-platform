'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  LayoutDashboard,
  BrainCircuit,
  HelpCircle,
  BookOpen,
  Target,
} from 'lucide-react';
import { formatMinutes } from '@/lib/utils';

function getReadinessTier(score: number, total: number) {
  if (total === 41) {
    if (score >= 36) {
      return {
        tier: 'Strong Candidate (~88%+)',
        message: 'Ready to schedule the official certification. Demonstrates command across agent architecture, MCP tooling, evaluation, and multi-agent coordination.',
        badgeVariant: 'default' as const,
        color: 'text-primary dark:text-[#E08569] bg-primary/10 dark:bg-primary/20 border-primary/30',
      };
    }
    if (score >= 29) {
      return {
        tier: 'Borderline Candidate (~70–85%)',
        message: 'Passing standard achieved (≥29/41), but review is advised. Prioritize studying your lowest scoring domain and reviewing incorrect questions before the exam.',
        badgeVariant: 'warning' as const,
        color: 'text-[#9E6400] dark:text-[#E0B55E] bg-[#FDF6E9] dark:bg-[#2B2313] border-[#F2DEB6] dark:border-[#4D3A1B]',
      };
    }
    return {
      tier: 'Needs Preparation (<70%)',
      message: 'Score is below the 29/41 threshold. Spend 1–2 weeks reviewing the domain documentation, study the rationales below, and retake the practice exam.',
      badgeVariant: 'destructive' as const,
      color: 'text-[#B94A4A] dark:text-[#E88B8B] bg-[#FDF2F2] dark:bg-[#2D1616] border-[#F5D0D0] dark:border-[#522424]',
    };
  }
  const pct = Math.round((score / Math.max(total, 1)) * 100);
  if (pct >= 85) {
    return {
      tier: `Strong Candidate (${pct}%)`,
      message: 'High probability of passing the official exam. Solid conceptual mastery.',
      badgeVariant: 'default' as const,
      color: 'text-primary dark:text-[#E08569] bg-primary/10 dark:bg-primary/20 border-primary/30',
    };
  }
  if (pct >= 70) {
    return {
      tier: `Borderline Candidate (${pct}%)`,
      message: 'Passing threshold met. Review flagged questions to reinforce weaker topic areas.',
      badgeVariant: 'warning' as const,
      color: 'text-[#9E6400] dark:text-[#E0B55E] bg-[#FDF6E9] dark:bg-[#2B2313] border-[#F2DEB6] dark:border-[#4D3A1B]',
    };
  }
  return {
    tier: `Needs Focused Study (${pct}%)`,
    message: 'Below the passing cutoff. Review all detailed answer rationales below and retake.',
    badgeVariant: 'destructive' as const,
    color: 'text-[#B94A4A] dark:text-[#E88B8B] bg-[#FDF2F2] dark:bg-[#2D1616] border-[#F5D0D0] dark:border-[#522424]',
  };
}

export default function ExamResultsPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['attempt-result', attemptId],
    queryFn: async () => {
      const res = await api.get(`/attempts/${attemptId}/result`);
      return res.data;
    },
    enabled: Boolean(attemptId),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl space-y-6">
        <div className="h-48 rounded-xl bg-muted/20 animate-pulse" />
        <div className="h-64 rounded-xl bg-muted/20 animate-pulse" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <h2 className="text-xl font-bold">Results Unavailable</h2>
        <p className="text-xs text-muted-foreground mt-2">
          Unable to retrieve examination results.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isPassed = result.isPassed;
  const reviewQuestions = result.reviewQuestions || [];
  const readiness = getReadinessTier(result.score, result.totalQuestions);

  const filteredQuestions = reviewQuestions.filter((q: any) => {
    if (filter === 'all') return true;
    if (filter === 'correct') return q.userAnswer?.isCorrect;
    if (filter === 'incorrect')
      return q.userAnswer?.isAnswered && !q.userAnswer?.isCorrect;
    if (filter === 'unanswered') return !q.userAnswer?.isAnswered;
    return true;
  });

  return (
    <div className="container mx-auto px-4 sm:px-8 py-10 max-w-5xl space-y-10">
      {/* Top Banner / Outcome */}
      <div
        className={`rounded-2xl border p-6 sm:p-8 shadow-xs transition-colors ${
          isPassed
            ? 'border-primary/30 bg-primary/5 dark:bg-primary/10'
            : 'border-destructive/30 bg-destructive/5'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="font-mono text-xs">
                {result.certification?.code || 'CERT'}
              </Badge>
              <Badge
                variant={isPassed ? 'default' : 'destructive'}
                className="text-xs font-bold uppercase tracking-wider"
              >
                {isPassed ? 'Passed' : 'Failed'}
              </Badge>
              {result.status === 'AUTO_SUBMITTED' && (
                <Badge variant="warning" className="text-xs">
                  Auto-submitted on time limit
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {result.examTitle}
            </h1>
            <p className="text-xs text-muted-foreground">
              Passing requirement: {result.passingPercentage}%
            </p>
          </div>

          <div className="flex items-baseline space-x-2 sm:text-right shrink-0">
            <div className="flex flex-col sm:items-end">
              <span className="text-4xl sm:text-5xl font-extrabold text-foreground">
                {result.percentage}%
              </span>
              <span className="text-xs text-muted-foreground font-semibold mt-1">
                Score: {result.score} / {result.totalQuestions}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t text-xs">
          <div className="flex flex-col p-3 rounded-lg bg-background/80 border">
            <span className="text-muted-foreground flex items-center space-x-1 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span>Correct</span>
            </span>
            <span className="text-lg font-bold text-primary">
              {result.correctCount}
            </span>
          </div>

          <div className="flex flex-col p-3 rounded-lg bg-background/80 border">
            <span className="text-muted-foreground flex items-center space-x-1 mb-1">
              <XCircle className="h-3.5 w-3.5 text-destructive" />
              <span>Incorrect</span>
            </span>
            <span className="text-lg font-bold text-destructive">
              {result.incorrectCount}
            </span>
          </div>

          <div className="flex flex-col p-3 rounded-lg bg-background/80 border">
            <span className="text-muted-foreground flex items-center space-x-1 mb-1">
              <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Unanswered</span>
            </span>
            <span className="text-lg font-bold text-foreground">
              {result.unansweredCount}
            </span>
          </div>

          <div className="flex flex-col p-3 rounded-lg bg-background/80 border">
            <span className="text-muted-foreground flex items-center space-x-1 mb-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Time Taken</span>
            </span>
            <span className="text-lg font-bold text-foreground">
              {formatMinutes(result.timeTakenMinutes)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="text-xs">
              <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
          <Link href={`/exams/${result.examId}`}>
            <Button size="sm" className="text-xs font-semibold">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              <span>Retake Exam</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Official Readiness Assessment & Recommendation */}
      <div className={`rounded-xl border p-5 shadow-xs transition-colors ${readiness.color}`}>
        <div className="flex items-start space-x-3.5">
          <div className="p-2 rounded-lg bg-background/90 shadow-xs shrink-0 mt-0.5">
            <Target className="h-5 w-5 text-foreground" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Official Readiness Assessment
                </span>
                <Badge variant={readiness.badgeVariant} className="text-[11px] font-semibold">
                  {readiness.tier}
                </Badge>
              </div>
              {result.totalQuestions > 0 && (
                <span className="text-[11px] text-muted-foreground font-mono">
                  Target: ≥ {Math.ceil(result.totalQuestions * 0.7)}/{result.totalQuestions} (≈ 70%)
                </span>
              )}
            </div>
            <p className="text-sm font-medium leading-relaxed">
              {readiness.message}
            </p>
            {result.totalQuestions > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-black/5 dark:border-white/5 text-[11px] text-muted-foreground">
                <div className={result.score >= Math.ceil(result.totalQuestions * 0.88) ? 'font-semibold text-foreground' : ''}>
                  • {Math.ceil(result.totalQuestions * 0.88)}–{result.totalQuestions} (~88%+): Strong candidate
                </div>
                <div className={result.score >= Math.ceil(result.totalQuestions * 0.7) && result.score < Math.ceil(result.totalQuestions * 0.88) ? 'font-semibold text-foreground' : ''}>
                  • {Math.ceil(result.totalQuestions * 0.7)}–{Math.ceil(result.totalQuestions * 0.88) - 1} (~70–87%): Borderline
                </div>
                <div className={result.score < Math.ceil(result.totalQuestions * 0.7) ? 'font-semibold text-foreground' : ''}>
                  • Under {Math.ceil(result.totalQuestions * 0.7)}: Needs preparation
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Domain Performance Breakdown */}
      {result.domainBreakdown && result.domainBreakdown.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">
              Performance by Domain
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.domainBreakdown.map((dom: any) => {
              const domPassed = dom.percentage >= result.passingPercentage;
              return (
                <div
                  key={dom.domainId}
                  className="rounded-xl border bg-card p-4 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground truncate max-w-[180px]">
                      {dom.domainName}
                    </span>
                    <Badge variant={domPassed ? 'success' : 'secondary'} className="text-[10px]">
                      {dom.percentage}%
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        domPassed ? 'bg-primary' : 'bg-destructive'
                      }`}
                      style={{ width: `${dom.percentage}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-muted-foreground flex justify-between">
                    <span>Score: {dom.correctCount} / {dom.totalQuestions}</span>
                    <span>{domPassed ? 'Proficient' : 'Needs Review'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Question-by-Question Review */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Comprehensive Answer Review
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review every question with your selected response, the verified correct answer, and explanation.
            </p>
          </div>

          {/* Review Filter Pills */}
          <div className="flex items-center space-x-1.5 rounded-lg border bg-muted/40 p-1 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filter === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              All ({reviewQuestions.length})
            </button>
            <button
              onClick={() => setFilter('correct')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filter === 'correct' ? 'bg-background shadow-sm text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              Correct ({result.correctCount})
            </button>
            <button
              onClick={() => setFilter('incorrect')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filter === 'incorrect' ? 'bg-background shadow-sm text-destructive font-semibold' : 'text-muted-foreground'
              }`}
            >
              Incorrect ({result.incorrectCount})
            </button>
            <button
              onClick={() => setFilter('unanswered')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filter === 'unanswered' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              Unanswered ({result.unansweredCount})
            </button>
          </div>
        </div>

        {/* Question Review Cards */}
        <div className="space-y-6">
          {filteredQuestions.map((q: any, idx: number) => {
            const isCorrect = q.userAnswer?.isCorrect;
            const isAnswered = q.userAnswer?.isAnswered;

            return (
              <Card
                key={q.id}
                className={`border shadow-sm overflow-hidden ${
                  !isAnswered
                    ? 'border-border'
                    : isCorrect
                    ? 'border-primary/30'
                    : 'border-destructive/30'
                }`}
              >
                {/* Header */}
                <CardHeader className="bg-muted/10 p-4 border-b space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-foreground">
                        Question {q.orderIndex || idx + 1}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {q.domain?.name}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {q.difficulty}
                      </Badge>
                    </div>

                    <div>
                      {!isAnswered ? (
                        <Badge variant="secondary" className="text-xs">
                          Unanswered
                        </Badge>
                      ) : isCorrect ? (
                        <Badge variant="default" className="text-xs flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Correct</span>
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs flex items-center space-x-1">
                          <XCircle className="h-3 w-3" />
                          <span>Incorrect</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-medium text-foreground pt-1 leading-relaxed">
                    {q.text}
                  </p>
                </CardHeader>

                {/* Options List */}
                <CardContent className="p-4 space-y-2.5">
                  {q.options?.map((opt: any) => {
                    const isUserChoice = q.userAnswer?.selectedOptionIds?.includes(opt.id);
                    const isOptionCorrect = opt.isCorrect;

                    let optionBorder = 'border-border bg-card';
                    if (isOptionCorrect && isUserChoice) {
                      optionBorder = 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/40';
                    } else if (isOptionCorrect && !isUserChoice) {
                      optionBorder = 'border-primary/40 bg-primary/5 text-foreground';
                    } else if (!isOptionCorrect && isUserChoice) {
                      optionBorder = 'border-destructive bg-destructive/10 text-destructive';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border flex items-start space-x-3 text-xs ${optionBorder}`}
                      >
                        <div className="font-bold font-mono h-5 w-5 rounded bg-muted flex items-center justify-center shrink-0">
                          {opt.key}
                        </div>
                        <div className="flex-1 leading-relaxed pt-0.5 space-y-1.5">
                          <div className="text-foreground">{opt.text}</div>
                          {opt.explanation && (
                            <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/40 leading-normal">
                              <span className="font-semibold text-foreground/80">Explanation: </span>
                              {opt.explanation}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center space-x-1.5 text-[11px] font-semibold">
                          {isUserChoice && (
                            <span className="px-2 py-0.5 rounded bg-muted text-foreground">
                              Your Choice
                            </span>
                          )}
                          {isOptionCorrect && (
                            <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground flex items-center space-x-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Correct</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Detailed Explanation Box */}
                  <div className="mt-4 p-4 rounded-xl border bg-muted/20 space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center space-x-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      <span>Overall Explanation</span>
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {q.explanation || 'No explanation provided.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
