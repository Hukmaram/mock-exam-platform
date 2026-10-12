import { Injectable } from '@nestjs/common';
import { QuestionType } from '@prisma/client';

export interface QuestionForScoring {
  id: string;
  type: QuestionType;
  domainId: string;
  domainName: string;
  options: Array<{
    id: string;
    isCorrect: boolean;
  }>;
}

export interface AnswerForScoring {
  questionId: string;
  selectedOptionIds: string[];
}

export interface DomainScore {
  domainId: string;
  domainName: string;
  totalQuestions: number;
  correctCount: number;
  percentage: number;
}

export interface ScoringResult {
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  score: number;
  percentage: number;
  isPassed: boolean;
  domainBreakdown: DomainScore[];
  questionResults: Map<string, boolean>; // questionId -> isCorrect
}

@Injectable()
export class ScoringService {
  /**
   * Scores an entire exam attempt.
   * Modular design allows swapping or tuning scoring logic (e.g. partial credit).
   */
  scoreAttempt(
    questions: QuestionForScoring[],
    answers: AnswerForScoring[],
    passingPercentage: number,
  ): ScoringResult {
    const answerMap = new Map<string, string[]>();
    for (const ans of answers) {
      answerMap.set(ans.questionId, ans.selectedOptionIds || []);
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const domainMap = new Map<
      string,
      { domainName: string; total: number; correct: number }
    >();

    const questionResults = new Map<string, boolean>();

    for (const q of questions) {
      // Initialize domain stats
      if (!domainMap.has(q.domainId)) {
        domainMap.set(q.domainId, {
          domainName: q.domainName,
          total: 0,
          correct: 0,
        });
      }
      domainMap.get(q.domainId)!.total += 1;

      const selectedIds = answerMap.get(q.id) || [];

      if (selectedIds.length === 0) {
        unansweredCount += 1;
        questionResults.set(q.id, false);
        continue;
      }

      const isCorrect = this.evaluateQuestion(q, selectedIds);
      questionResults.set(q.id, isCorrect);

      if (isCorrect) {
        correctCount += 1;
        domainMap.get(q.domainId)!.correct += 1;
      } else {
        incorrectCount += 1;
      }
    }

    const totalQuestions = questions.length;
    const score = correctCount; // 1 point per question
    const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const roundedPercentage = Math.round(percentage * 100) / 100;
    const isPassed = roundedPercentage >= passingPercentage;

    const domainBreakdown: DomainScore[] = [];
    domainMap.forEach((val, domainId) => {
      const domPercentage =
        val.total > 0 ? Math.round((val.correct / val.total) * 10000) / 100 : 0;
      domainBreakdown.push({
        domainId,
        domainName: val.domainName,
        totalQuestions: val.total,
        correctCount: val.correct,
        percentage: domPercentage,
      });
    });

    return {
      totalQuestions,
      correctCount,
      incorrectCount,
      unansweredCount,
      score,
      percentage: roundedPercentage,
      isPassed,
      domainBreakdown,
      questionResults,
    };
  }

  /**
   * Evaluates a single question based on question type.
   */
  evaluateQuestion(question: QuestionForScoring, selectedOptionIds: string[]): boolean {
    const correctOptionIds = question.options
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.id);

    if (question.type === QuestionType.SINGLE_CHOICE) {
      if (selectedOptionIds.length !== 1) {
        return false;
      }
      return correctOptionIds.includes(selectedOptionIds[0]);
    }

    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      // Exact match rule:
      // 1. Every selected option must be correct.
      // 2. Every correct option must be selected.
      if (selectedOptionIds.length !== correctOptionIds.length) {
        return false;
      }

      const selectedSet = new Set(selectedOptionIds);
      for (const correctId of correctOptionIds) {
        if (!selectedSet.has(correctId)) {
          return false;
        }
      }
      return true;
    }

    return false;
  }
}
