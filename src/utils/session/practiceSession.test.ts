import { DEFAULT_PRACTICE_CONFIG } from '../../config/practiceOptions';
import type { PracticeConfig, Question, SelfReportedResult } from '../../types';
import {
  configFromSession,
  createAttempt,
  createInitialSessionState,
  createPracticeSession,
  hasReachedSessionLength,
  isCompletedSession,
  isLastQuestion,
  sessionReducer,
  type SessionState,
} from './practiceSession';

const NOW = '2026-10-20T12:00:00.000Z';
const LATER = '2026-10-20T12:05:00.000Z';

let questionCounter = 0;
function makeQuestion(overrides: Partial<Question> = {}): Question {
  questionCounter += 1;
  return {
    id: `q-${questionCounter}`,
    operation: 'addition',
    difficulty: 'beginner',
    firstOperand: 2,
    secondOperand: 3,
    correctAnswer: 5,
    displayText: '2 + 3',
    choices: [4, 5, 6, 7],
    source: 'regular',
    ...overrides,
  };
}

function start(config: Partial<PracticeConfig> = {}): SessionState {
  return createInitialSessionState({ ...DEFAULT_PRACTICE_CONFIG, ...config }, makeQuestion(), NOW);
}

function answer(state: SessionState, result: SelfReportedResult = 'correct'): SessionState {
  const attempt = createAttempt(state.session, state.currentQuestion, 5, result, NOW);
  return sessionReducer(state, {
    type: 'recordAttempt',
    attempt,
    nextQuestion: makeQuestion(),
    now: LATER,
  });
}

describe('createPracticeSession', () => {
  it('stores the setup choices and starts with empty totals', () => {
    const session = createPracticeSession(
      {
        mode: 'regular',
        operations: ['addition', 'division'],
        difficulty: 'easy',
        sessionLength: 20,
      },
      NOW,
    );
    expect(session).toMatchObject({
      mode: 'regular',
      operations: ['addition', 'division'],
      difficulty: 'easy',
      sessionLength: 20,
      currentQuestionIndex: 0,
      attemptedCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      mistakeReviewCount: 0,
      isActive: true,
      startedAt: NOW,
    });
    expect(session.id).toBeTruthy();
    expect(session.completedAt).toBeUndefined();
  });
});

describe('createAttempt', () => {
  it('copies the question details, answer, result, session, and time', () => {
    const state = start();
    const attempt = createAttempt(state.session, state.currentQuestion, 6, 'incorrect', NOW);
    expect(attempt).toMatchObject({
      sessionId: state.session.id,
      questionId: state.currentQuestion.id,
      operation: 'addition',
      difficulty: 'beginner',
      firstOperand: 2,
      secondOperand: 3,
      correctAnswer: 5,
      selectedAnswer: 6,
      result: 'incorrect',
      source: 'regular',
      answeredAt: NOW,
    });
    expect(attempt).not.toHaveProperty('mistakePatternId');
  });
});

describe('sessionReducer', () => {
  it('counts a correct answer and moves to the next question', () => {
    const before = start();
    const after = answer(before, 'correct');
    expect(after.session).toMatchObject({
      attemptedCount: 1,
      correctCount: 1,
      incorrectCount: 0,
      currentQuestionIndex: 1,
      isActive: true,
    });
    expect(after.attempts).toHaveLength(1);
    expect(after.currentQuestion.id).not.toBe(before.currentQuestion.id);
  });

  it('counts an incorrect answer', () => {
    const after = answer(start(), 'incorrect');
    expect(after.session.correctCount).toBe(0);
    expect(after.session.incorrectCount).toBe(1);
  });

  it('ignores a second result for the same question', () => {
    const state = start();
    const attempt = createAttempt(state.session, state.currentQuestion, 5, 'correct', NOW);
    const once = sessionReducer(state, {
      type: 'recordAttempt',
      attempt,
      nextQuestion: state.currentQuestion, // pretend the question did not change
      now: NOW,
    });
    const twice = sessionReducer(once, {
      type: 'recordAttempt',
      attempt: { ...attempt, id: 'other', result: 'incorrect' },
      nextQuestion: makeQuestion(),
      now: NOW,
    });
    expect(twice).toBe(once);
    expect(twice.session.attemptedCount).toBe(1);
  });

  it('ignores results for a question that is not on screen', () => {
    const state = start();
    const stale = createAttempt(state.session, makeQuestion(), 5, 'correct', NOW);
    expect(
      sessionReducer(state, {
        type: 'recordAttempt',
        attempt: stale,
        nextQuestion: makeQuestion(),
        now: NOW,
      }),
    ).toBe(state);
  });

  it('counts mistake-review questions', () => {
    const state = start();
    const reviewState = { ...state, currentQuestion: makeQuestion({ source: 'mistake-review' }) };
    expect(answer(reviewState).session.mistakeReviewCount).toBe(1);
  });

  it('finishes a 5-question session after the fifth answer', () => {
    let state = start({ sessionLength: 5 });
    for (let i = 0; i < 4; i++) state = answer(state, i % 2 === 0 ? 'correct' : 'incorrect');
    expect(state.session.isActive).toBe(true);
    expect(isLastQuestion(state.session)).toBe(true);

    const lastQuestion = state.currentQuestion;
    state = answer(state, 'correct');
    expect(state.session).toMatchObject({
      attemptedCount: 5,
      correctCount: 3,
      incorrectCount: 2,
      isActive: false,
      completedAt: LATER,
    });
    expect(hasReachedSessionLength(state.session)).toBe(true);
    // No new question after the last one
    expect(state.currentQuestion).toBe(lastQuestion);
  });

  it('ignores answers after the session has finished', () => {
    let state = start({ sessionLength: 5 });
    for (let i = 0; i < 5; i++) state = answer(state);
    expect(answer(state)).toBe(state);
  });

  it('never finishes continuous practice on its own', () => {
    let state = start({ sessionLength: 'continuous' });
    for (let i = 0; i < 50; i++) state = answer(state);
    expect(state.session.isActive).toBe(true);
    expect(isLastQuestion(state.session)).toBe(false);
    expect(state.session.attemptedCount).toBe(50);
  });

  it('ends a session early with a completion time', () => {
    const state = answer(start({ sessionLength: 'continuous' }));
    const ended = sessionReducer(state, { type: 'endSession', now: LATER });
    expect(ended.session).toMatchObject({ isActive: false, completedAt: LATER, attemptedCount: 1 });
  });
});

describe('configFromSession', () => {
  it('rebuilds the setup choices', () => {
    const config: PracticeConfig = {
      mode: 'regular',
      operations: ['multiplication'],
      difficulty: 'advanced',
      sessionLength: 'continuous',
    };
    expect(configFromSession(createPracticeSession(config))).toEqual(config);
  });
});

describe('isCompletedSession', () => {
  const finished = () => {
    let state = start({ sessionLength: 5 });
    for (let i = 0; i < 5; i++) state = answer(state);
    return state.session;
  };

  it('accepts a finished session', () => {
    expect(isCompletedSession(finished())).toBe(true);
  });

  it.each([
    ['null', () => null],
    ['an active session', () => start().session],
    ['totals that do not add up', () => ({ ...finished(), correctCount: 99 })],
    ['a negative count', () => ({ ...finished(), mistakeReviewCount: -1 })],
    ['missing operations', () => ({ ...finished(), operations: undefined })],
    ['an unknown difficulty', () => ({ ...finished(), difficulty: 'expert' })],
  ])('rejects %s', (_name, make) => {
    expect(isCompletedSession(make())).toBe(false);
  });
});
