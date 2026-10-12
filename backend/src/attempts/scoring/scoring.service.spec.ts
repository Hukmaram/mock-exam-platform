import { ScoringService, QuestionForScoring, AnswerForScoring } from './scoring.service';
import { QuestionType } from '@prisma/client';

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(() => {
    service = new ScoringService();
  });

  const mockQuestions: QuestionForScoring[] = [
    {
      id: 'q1',
      type: QuestionType.SINGLE_CHOICE,
      domainId: 'd1',
      domainName: 'Architecture',
      options: [
        { id: 'opt1-a', isCorrect: true },
        { id: 'opt1-b', isCorrect: false },
        { id: 'opt1-c', isCorrect: false },
      ],
    },
    {
      id: 'q2',
      type: QuestionType.MULTIPLE_CHOICE,
      domainId: 'd1',
      domainName: 'Architecture',
      options: [
        { id: 'opt2-a', isCorrect: true },
        { id: 'opt2-b', isCorrect: true },
        { id: 'opt2-c', isCorrect: false },
        { id: 'opt2-d', isCorrect: false },
      ],
    },
    {
      id: 'q3',
      type: QuestionType.SINGLE_CHOICE,
      domainId: 'd2',
      domainName: 'Security',
      options: [
        { id: 'opt3-a', isCorrect: false },
        { id: 'opt3-b', isCorrect: true },
      ],
    },
  ];

  it('should score single-choice question correctly when correct option selected', () => {
    const isCorrect = service.evaluateQuestion(mockQuestions[0], ['opt1-a']);
    expect(isCorrect).toBe(true);
  });

  it('should score single-choice question as incorrect when wrong option selected', () => {
    const isCorrect = service.evaluateQuestion(mockQuestions[0], ['opt1-b']);
    expect(isCorrect).toBe(false);
  });

  it('should score multiple-choice question as correct only when exact match is provided', () => {
    // Both correct options selected
    const isCorrect = service.evaluateQuestion(mockQuestions[1], ['opt2-a', 'opt2-b']);
    expect(isCorrect).toBe(true);
  });

  it('should score multiple-choice question as incorrect when partially correct', () => {
    // Only 1 of 2 correct options selected
    const isCorrect = service.evaluateQuestion(mockQuestions[1], ['opt2-a']);
    expect(isCorrect).toBe(false);
  });

  it('should score multiple-choice question as incorrect when extra wrong option selected', () => {
    // Both correct options + 1 wrong option selected
    const isCorrect = service.evaluateQuestion(mockQuestions[1], ['opt2-a', 'opt2-b', 'opt2-c']);
    expect(isCorrect).toBe(false);
  });

  it('should compute full attempt score, percentages, and domain breakdown', () => {
    const answers: AnswerForScoring[] = [
      { questionId: 'q1', selectedOptionIds: ['opt1-a'] }, // Correct (Architecture)
      { questionId: 'q2', selectedOptionIds: ['opt2-a', 'opt2-b'] }, // Correct (Architecture)
      { questionId: 'q3', selectedOptionIds: [] }, // Unanswered (Security)
    ];

    const result = service.scoreAttempt(mockQuestions, answers, 60.0);

    expect(result.totalQuestions).toBe(3);
    expect(result.correctCount).toBe(2);
    expect(result.incorrectCount).toBe(0);
    expect(result.unansweredCount).toBe(1);
    expect(result.score).toBe(2);
    expect(result.percentage).toBe(66.67);
    expect(result.isPassed).toBe(true); // 66.67% >= 60%

    // Domain breakdown check
    expect(result.domainBreakdown).toHaveLength(2);

    const archDomain = result.domainBreakdown.find((d) => d.domainId === 'd1');
    expect(archDomain).toBeDefined();
    expect(archDomain?.totalQuestions).toBe(2);
    expect(archDomain?.correctCount).toBe(2);
    expect(archDomain?.percentage).toBe(100);

    const secDomain = result.domainBreakdown.find((d) => d.domainId === 'd2');
    expect(secDomain).toBeDefined();
    expect(secDomain?.totalQuestions).toBe(1);
    expect(secDomain?.correctCount).toBe(0);
    expect(secDomain?.percentage).toBe(0);
  });

  it('should fail when percentage is below passing percentage', () => {
    const answers: AnswerForScoring[] = [
      { questionId: 'q1', selectedOptionIds: ['opt1-b'] }, // Incorrect
      { questionId: 'q2', selectedOptionIds: ['opt2-c'] }, // Incorrect
      { questionId: 'q3', selectedOptionIds: ['opt3-b'] }, // Correct
    ];

    const result = service.scoreAttempt(mockQuestions, answers, 70.0);
    expect(result.correctCount).toBe(1);
    expect(result.percentage).toBe(33.33);
    expect(result.isPassed).toBe(false);
  });
});
