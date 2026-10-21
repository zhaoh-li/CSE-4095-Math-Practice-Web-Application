import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { appData } from '../services/appData';
import type { MistakePattern, PracticeAttempt, PracticeSession } from '../types';
import { TestApp } from './TestApp';

/**
 * Runs the axe accessibility checker on the whole page.
 * Color contrast is skipped here because jsdom can't draw colors; it is
 * checked separately for every theme in colorVision.test.ts.
 */
async function expectNoAccessibilityViolations() {
  const results = await axe.run(document.body, {
    rules: { 'color-contrast': { enabled: false } },
  });
  const problems = results.violations.map(
    (v) => `${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`,
  );
  expect(problems).toEqual([]);
}

function seedHistory() {
  const attempt: PracticeAttempt = {
    id: 'a1',
    sessionId: 's1',
    questionId: 'q1',
    operation: 'multiplication',
    difficulty: 'easy',
    firstOperand: 7,
    secondOperand: 8,
    correctAnswer: 56,
    selectedAnswer: 54,
    result: 'incorrect',
    source: 'regular',
    answeredAt: '2026-10-20T12:00:00.000Z',
  };
  const session: PracticeSession = {
    id: 's1',
    mode: 'regular',
    operations: ['multiplication'],
    difficulty: 'easy',
    sessionLength: 5,
    currentQuestionIndex: 0,
    attemptedCount: 1,
    correctCount: 0,
    incorrectCount: 1,
    mistakeReviewCount: 0,
    isActive: false,
    startedAt: '2026-10-20T12:00:00.000Z',
    completedAt: '2026-10-20T12:01:00.000Z',
  };
  const pattern: MistakePattern = {
    id: 'm1',
    operation: 'multiplication',
    firstOperand: 7,
    secondOperand: 8,
    correctAnswer: 56,
    difficulty: 'easy',
    incorrectCount: 1,
    similarCorrectCount: 1,
    isMastered: false,
    createdAt: '2026-10-20T12:00:00.000Z',
    lastIncorrectAt: '2026-10-20T12:00:00.000Z',
  };
  appData.saveAttempt(attempt);
  appData.saveSession(session);
  appData.saveMistakePatterns([pattern]);
  return session;
}

const config = {
  mode: 'regular',
  operations: ['addition'],
  difficulty: 'beginner',
  sessionLength: 5,
};

describe('automated accessibility check (axe)', () => {
  it.each([
    ['home', '/'],
    ['practice setup', '/practice/setup'],
    ['statistics (empty)', '/statistics'],
    ['settings', '/settings'],
    ['privacy', '/privacy'],
    ['not found', '/nope'],
  ])('%s page has no violations', async (_name, path) => {
    render(<TestApp initialEntries={[path]} />);
    await expectNoAccessibilityViolations();
  });

  it('statistics page with history has no violations', async () => {
    seedHistory();
    render(<TestApp initialEntries={['/statistics']} />);
    await expectNoAccessibilityViolations();
  });

  it('summary page has no violations', async () => {
    const session = seedHistory();
    render(<TestApp initialEntries={[{ pathname: '/practice/summary', state: { session } }]} />);
    await expectNoAccessibilityViolations();
  });

  it('flash card front, back, and shortcut help have no violations', async () => {
    const user = userEvent.setup();
    render(<TestApp initialEntries={[{ pathname: '/practice/session', state: { config } }]} />);
    await expectNoAccessibilityViolations();

    await user.keyboard('?');
    await user.keyboard('1');
    await user.keyboard('f');
    await expectNoAccessibilityViolations();
  });

  it('confirmation dialogs have no violations', async () => {
    seedHistory();
    const user = userEvent.setup();
    render(<TestApp initialEntries={['/statistics']} />);
    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await expectNoAccessibilityViolations();
  });
});
