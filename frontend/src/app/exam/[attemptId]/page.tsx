'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { formatSecondsToTime } from '@/lib/utils';

export default function ExamRunnerPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersState, setAnswersState] = useState<
    Record<string, { selectedOptionIds: string[]; isMarkedForReview: boolean }>
  >({});

  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-submit lock ref to avoid multi-calls
  const isAutoSubmitting = useRef(false);

  // 1. Fetch Attempt Data
  const loadAttempt = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attempts/${attemptId}`);
      const data = res.data;

      // If already submitted, redirect to results immediately
      if (data.isCompleted || data.status !== 'IN_PROGRESS') {
        router.push(`/results/${attemptId}`);
        return;
      }

      setAttempt(data);

      // Hydrate answers state from saved server answers
      const map: Record<string, { selectedOptionIds: string[]; isMarkedForReview: boolean }> = {};
      data.questions.forEach((q: any) => {
        map[q.id] = {
          selectedOptionIds: q.userAnswer?.selectedOptionIds || [],
          isMarkedForReview: q.userAnswer?.isMarkedForReview || false,
        };
      });
      setAnswersState(map);

      // Calculate initial remaining seconds based on server expiresAt
      const serverExpiresAt = new Date(data.expiresAt).getTime();
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((serverExpiresAt - now) / 1000));
      setRemainingSeconds(diffSecs);

      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load exam attempt');
      setLoading(false);
    }
  }, [attemptId, router]);

  useEffect(() => {
    loadAttempt();
  }, [loadAttempt]);

  // 2. Countdown Timer Loop
  useEffect(() => {
    if (remainingSeconds === null || !attempt || attempt.status !== 'IN_PROGRESS') {
      return;
    }

    if (remainingSeconds <= 0) {
      handleFinalSubmit(true);
      return;
    }

    const interval = setInterval(() => {
      // Re-calculate against server expiresAt to prevent clock drift
      const serverExpiresAt = new Date(attempt.expiresAt).getTime();
      const diffSecs = Math.max(0, Math.floor((serverExpiresAt - Date.now()) / 1000));

      setRemainingSeconds(diffSecs);

      if (diffSecs <= 0) {
        clearInterval(interval);
        handleFinalSubmit(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, attempt]);

  // 3. Auto-save answer to Backend
  const saveAnswerToBackend = async (
    questionId: string,
    selectedOptionIds: string[],
    isMarkedForReview: boolean,
  ) => {
    setSavingStatus('saving');
    try {
      const res = await api.post(`/attempts/${attemptId}/answers`, {
        questionId,
        selectedOptionIds,
        isMarkedForReview,
      });

      if (res.data?.isAutoSubmitted) {
        router.push(`/results/${attemptId}`);
        return;
      }

      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 1500);
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('expired')) {
        router.push(`/results/${attemptId}`);
        return;
      }
      setSavingStatus('error');
    }
  };

  // Option Click Handler
  const handleSelectOption = (optionId: string, isMultipleChoice: boolean) => {
    const currentQ = attempt?.questions[currentIndex];
    if (!currentQ) return;

    const currentAnswer = answersState[currentQ.id] || {
      selectedOptionIds: [],
      isMarkedForReview: false,
    };

    let newSelected: string[];
    if (isMultipleChoice) {
      if (currentAnswer.selectedOptionIds.includes(optionId)) {
        newSelected = currentAnswer.selectedOptionIds.filter((id) => id !== optionId);
      } else {
        newSelected = [...currentAnswer.selectedOptionIds, optionId];
      }
    } else {
      // Single choice
      newSelected = [optionId];
    }

    const updated = {
      ...answersState,
      [currentQ.id]: {
        ...currentAnswer,
        selectedOptionIds: newSelected,
      },
    };

    setAnswersState(updated);
    saveAnswerToBackend(currentQ.id, newSelected, currentAnswer.isMarkedForReview);
  };

  // Mark for Review Toggle
  const handleToggleMarkReview = () => {
    const currentQ = attempt?.questions[currentIndex];
    if (!currentQ) return;

    const currentAnswer = answersState[currentQ.id] || {
      selectedOptionIds: [],
      isMarkedForReview: false,
    };

    const newMarked = !currentAnswer.isMarkedForReview;

    const updated = {
      ...answersState,
      [currentQ.id]: {
        ...currentAnswer,
        isMarkedForReview: newMarked,
      },
    };

    setAnswersState(updated);
    saveAnswerToBackend(currentQ.id, currentAnswer.selectedOptionIds, newMarked);
  };

  // 4. Submit Exam
  const handleFinalSubmit = async (auto = false) => {
    if (isAutoSubmitting.current || submitting) return;
    isAutoSubmitting.current = true;
    setSubmitting(true);

    try {
      await api.post(`/attempts/${attemptId}/submit`);
      router.push(`/results/${attemptId}`);
    } catch (err) {
      // If error occurs or already submitted, navigate to results
      router.push(`/results/${attemptId}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          Loading secure examination environment...
        </span>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Exam could not be loaded'}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/dashboard')} className="mt-4" variant="outline">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const questions = attempt.questions || [];
  const currentQ = questions[currentIndex];
  const isMultiple = currentQ?.type === 'MULTIPLE_CHOICE';
  const currentAnswer = answersState[currentQ?.id] || {
    selectedOptionIds: [],
    isMarkedForReview: false,
  };

  // Stats for navigator & submit confirmation
  const totalCount = questions.length;
  const answeredCount = Object.values(answersState).filter(
    (a) => a.selectedOptionIds && a.selectedOptionIds.length > 0,
  ).length;
  const unansweredCount = totalCount - answeredCount;
  const markedCount = Object.values(answersState).filter((a) => a.isMarkedForReview).length;

  const isLowTime = remainingSeconds !== null && remainingSeconds <= 300; // < 5 mins

  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen">
      {/* Top Fixed Exam Banner */}
      <header className="sticky top-0 z-40 border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 sm:px-8 max-w-7xl h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-sm sm:text-base text-foreground truncate max-w-xs sm:max-w-md">
              {attempt.examTitle}
            </span>
            <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-mono">
              {attempt.certification?.code}
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            {/* Auto-save status */}
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-muted-foreground">
              {savingStatus === 'saving' && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span>Saving...</span>
                </>
              )}
              {savingStatus === 'saved' && (
                <>
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  <span className="text-primary font-medium">Auto-saved</span>
                </>
              )}
              {savingStatus === 'error' && (
                <span className="text-destructive">Save failed (retrying)</span>
              )}
            </div>

            {/* Countdown Timer */}
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm sm:text-base transition-colors ${
                isLowTime
                  ? 'border-destructive bg-destructive/10 text-destructive animate-pulse'
                  : 'border-border bg-muted/50 text-foreground'
              }`}
            >
              <Clock className="h-4 w-4 shrink-0" />
              <span>
                {remainingSeconds !== null
                  ? formatSecondsToTime(remainingSeconds)
                  : '--:--:--'}
              </span>
            </div>

            {/* Finish / Submit button */}
            <Button
              size="sm"
              onClick={() => setConfirmSubmitOpen(true)}
              className="bg-primary hover:bg-[#C16345] text-primary-foreground font-semibold text-xs"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              <span>Submit Exam</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <div className="container mx-auto px-4 sm:px-8 py-6 max-w-7xl flex-1 flex flex-col lg:flex-row gap-8">
        {/* Left / Center: Question Card */}
        <div className="flex-1 flex flex-col space-y-6">
          <Card className="flex-1 flex flex-col justify-between border-muted shadow-sm">
            <CardHeader className="pb-4 border-b space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-primary">
                    Question {currentIndex + 1} of {totalCount}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {currentQ?.domain?.name || 'Domain'}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {currentQ?.difficulty}
                  </Badge>
                </div>

                <Button
                  variant={currentAnswer.isMarkedForReview ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleToggleMarkReview}
                  className={`text-xs flex items-center space-x-1.5 ${
                    currentAnswer.isMarkedForReview
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span>
                    {currentAnswer.isMarkedForReview
                      ? 'Marked for Review'
                      : 'Mark for Review'}
                  </span>
                </Button>
              </div>

              {/* Question Text */}
              <h2 className="text-base sm:text-lg font-medium text-foreground leading-relaxed pt-2">
                {currentQ?.text}
              </h2>

              <div className="text-[11px] text-muted-foreground font-medium">
                {isMultiple
                  ? 'Select all applicable options (Multiple Choice)'
                  : 'Select one option (Single Choice)'}
              </div>
            </CardHeader>

            {/* Question Options */}
            <CardContent className="pt-6 space-y-3 flex-1">
              {currentQ?.options?.map((option: any) => {
                const isSelected = currentAnswer.selectedOptionIds.includes(option.id);

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectOption(option.id, isMultiple)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start space-x-3.5 ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary shadow-sm'
                        : 'border-border bg-card hover:bg-muted/40 text-foreground'
                    }`}
                  >
                    {/* Key badge / radio or checkbox marker */}
                    <div
                      className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {option.key}
                    </div>

                    <div className="flex-1 text-sm leading-relaxed pt-0.5">
                      {option.text}
                    </div>
                  </button>
                );
              })}
            </CardContent>

            {/* Bottom Question Controls */}
            <CardFooter className="flex items-center justify-between border-t bg-muted/10 p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="text-xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span>Previous</span>
              </Button>

              <div className="text-xs text-muted-foreground font-mono">
                {currentIndex + 1} / {totalCount}
              </div>

              {currentIndex < totalCount - 1 ? (
                <Button
                  size="sm"
                  onClick={() =>
                    setCurrentIndex((prev) => Math.min(totalCount - 1, prev + 1))
                  }
                  className="text-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setConfirmSubmitOpen(true)}
                  className="bg-primary hover:bg-[#C16345] text-primary-foreground text-xs font-semibold"
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  <span>Submit Exam</span>
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Right: Question Navigator Panel */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <Card className="border-muted shadow-sm">
            <CardHeader className="p-4 pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Question Navigator</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {answeredCount} of {totalCount} answered
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Question numbers grid */}
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {questions.map((q: any, idx: number) => {
                  const ans = answersState[q.id];
                  const isAnswered = ans && ans.selectedOptionIds && ans.selectedOptionIds.length > 0;
                  const isMarked = ans?.isMarkedForReview;
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative h-10 rounded-lg text-xs font-semibold transition-all flex items-center justify-center ${
                        isCurrent
                          ? 'ring-2 ring-primary ring-offset-2 font-bold'
                          : ''
                      } ${
                        isAnswered
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted/70 text-foreground hover:bg-muted'
                      }`}
                    >
                      <span>{idx + 1}</span>

                      {/* Review indicator flag dot */}
                      {isMarked && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-500 border-2 border-background" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-3 border-t grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <div className="flex items-center space-x-1.5">
                  <div className="h-3 w-3 rounded bg-primary" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="h-3 w-3 rounded bg-muted border" />
                  <span>Unanswered ({unansweredCount})</span>
                </div>
                <div className="flex items-center space-x-1.5 col-span-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span>Marked for review ({markedCount})</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button
                variant="outline"
                className="w-full text-xs"
                onClick={() => setConfirmSubmitOpen(true)}
              >
                Review & Submit Exam
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog Before Submission (Section 21) */}
      <Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <span>Submit Mock Exam?</span>
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to finish and submit your exam attempt?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Answered Questions:</span>
              <span className="font-semibold text-primary">
                {answeredCount} of {totalCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Unanswered Questions:</span>
              <span className={`font-semibold ${unansweredCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {unansweredCount}
              </span>
            </div>
            {markedCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Marked for Review:</span>
                <span className="font-semibold text-amber-600">
                  {markedCount}
                </span>
              </div>
            )}
          </div>

          {unansweredCount > 0 && (
            <p className="text-xs text-destructive">
              Warning: You have {unansweredCount} unanswered questions. Unanswered questions receive 0 points.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setConfirmSubmitOpen(false)}
            disabled={submitting}
          >
            Cancel & Continue Exam
          </Button>
          <Button
            onClick={() => handleFinalSubmit(false)}
            disabled={submitting}
            className="bg-primary hover:bg-[#C16345] text-primary-foreground font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Calculating Score...</span>
              </>
            ) : (
              'Confirm & Submit'
            )}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
