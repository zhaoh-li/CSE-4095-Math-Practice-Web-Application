import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { appData } from '../services/appData';
import { TestApp } from '../test/TestApp';
import type { MistakePattern, PracticeAttempt, PracticeConfig } from '../types';

function renderAt(path: string, state?: unknown) {
  const user = userEvent.setup();
  render(<TestApp initialEntries={[{ pathname: path, state }]} />);
  return user;
}

const attempt = (id: string, result: 'correct' | 'incorrect'): PracticeAttempt => ({
  id,
  sessionId: 's1',
  questionId: `q-${id}`,
  operation: 'addition',
  difficulty: 'beginner',
  firstOperand: 2,
  secondOperand: 3,
  correctAnswer: 5,
  selectedAnswer: 5,
  result,
  source: 'regular',
  answeredAt: '2026-10-21T12:00:00.000Z',
});

const pattern: MistakePattern = {
  id: 'm1',
  operation: 'multiplication',
  firstOperand: 7,
  secondOperand: 8,
  correctAnswer: 56,
  difficulty: 'easy',
  incorrectCount: 1,
  similarCorrectCount: 0,
  isMastered: false,
  createdAt: '2026-10-21T12:00:00.000Z',
  lastIncorrectAt: '2026-10-21T12:00:00.000Z',
};

describe('1. several difficulty levels', () => {
  const config: PracticeConfig = {
    mode: 'regular',
    operations: ['addition'],
    difficulties: ['beginner', 'advanced'],
    sessionLength: 20,
  };

  it('a session mixes questions from all chosen levels', async () => {
    const user = renderAt('/practice/session', { config });
    for (let i = 0; i < 20; i++) await user.keyboard('1fr');
    const levels = new Set(appData.loadAttempts().map((a) => a.difficulty));
    expect(levels).toEqual(new Set(['beginner', 'advanced']));
  });

  it('the summary and recent sessions list every chosen level', async () => {
    const user = renderAt('/practice/session', { config: { ...config, sessionLength: 5 } });
    for (let i = 0; i < 5; i++) await user.keyboard('1fr');
    expect(screen.getByText('Levels').nextSibling).toHaveTextContent('Beginner and Advanced');

    await user.click(
      within(screen.getByRole('main')).getByRole('link', { name: 'View Statistics' }),
    );
    const table = within(screen.getByRole('region', { name: 'Recent sessions table' }));
    expect(table.getAllByRole('row')[1]).toHaveTextContent('Beginner, Advanced');
  });

  it('a single level still reads naturally', async () => {
    const user = renderAt('/practice/session', {
      config: { ...config, difficulties: ['easy'], sessionLength: 5 },
    });
    for (let i = 0; i < 5; i++) await user.keyboard('1fr');
    expect(screen.getByText('Level').nextSibling).toHaveTextContent('Easy (Level 2)');
  });
});

describe('2. home page', () => {
  it('shows an empty progress summary and explains Review Mistakes for new users', () => {
    renderAt('/');
    const progress = screen.getByRole('region', { name: 'Your progress' });
    expect(progress).toHaveTextContent('No practice yet. Start your first session!');
    const review = screen.getByRole('button', { name: 'Review Mistakes' });
    expect(review).toBeDisabled();
    expect(review).toHaveAccessibleDescription(
      'Answer some practice questions first. Any you miss will show up here.',
    );
  });

  it('summarizes progress and mistakes waiting for review', () => {
    appData.saveAttempt(attempt('a1', 'correct'));
    appData.saveAttempt(attempt('a2', 'correct'));
    appData.saveAttempt(attempt('a3', 'incorrect'));
    appData.saveMistakePatterns([pattern]);
    renderAt('/');
    expect(screen.getByRole('region', { name: 'Your progress' })).toHaveTextContent(
      "You've answered 3 questions and said you got 2 right. 1 mistake is ready to review.",
    );
  });

  it('Review Mistakes opens setup with mistake review chosen', async () => {
    appData.saveMistakePatterns([pattern]);
    const user = renderAt('/');
    await user.click(screen.getByRole('link', { name: 'Review Mistakes' }));
    expect(screen.getByRole('radio', { name: /practice my mistakes/i })).toBeChecked();
  });
});

describe('3. flipping without picking an answer', () => {
  const config: PracticeConfig = {
    mode: 'regular',
    operations: ['addition'],
    difficulties: ['beginner'],
    sessionLength: 5,
  };

  it('works with the button, and the result still counts', async () => {
    const user = renderAt('/practice/session', { config });
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));
    expect(screen.getByText("You didn't pick an answer.")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }));

    const [saved] = appData.loadAttempts();
    expect(saved.result).toBe('incorrect');
    expect(saved).not.toHaveProperty('selectedAnswer');
    // A wrong self-report still becomes a mistake to review
    expect(appData.loadMistakePatterns()).toHaveLength(1);
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
  });

  it('works with the F key', async () => {
    const user = renderAt('/practice/session', { config });
    await user.keyboard('fr');
    expect(appData.loadAttempts()[0]).toMatchObject({ result: 'correct' });
  });

  it('a "right" report counts as right even if a different answer was picked', async () => {
    const user = renderAt('/practice/session', { config });
    const front = within(screen.getByRole('region', { name: 'Question' }));
    const choices = front.getAllByRole('button', { name: /^Choice/ });
    const question = screen.getByRole('heading', { level: 2, name: /^What is/ }).textContent ?? '';
    const [a, b] = question.match(/\d+/g)!.map(Number);
    const wrong = choices.find((c) => !c.textContent?.includes(String(a + b)))!;
    await user.click(wrong);
    await user.keyboard('fr');
    expect(appData.loadAttempts()[0].result).toBe('correct');
  });
});

describe('4. statistics accuracy note', () => {
  it('explains that results come from self-reports', () => {
    appData.saveAttempt(attempt('a1', 'correct'));
    renderAt('/statistics');
    expect(screen.getByText(/not from automatic grading/i)).toHaveTextContent(
      /what you said after each card/i,
    );
  });
});
