import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestApp } from '../test/TestApp';
import { DEFAULT_SETTINGS } from '../config/defaultSettings';
import { appData } from '../services/appData';
import type { MistakePattern, PracticeConfig, SelfReportedResult } from '../types';

type User = ReturnType<typeof userEvent.setup>;

function renderAt(path: string, state?: unknown) {
  const user = userEvent.setup();
  render(<TestApp initialEntries={[{ pathname: path, state }]} />);
  return user;
}

function pattern(id: string, extra: Partial<MistakePattern> = {}): MistakePattern {
  return {
    id,
    operation: 'multiplication',
    firstOperand: 7,
    secondOperand: 8,
    correctAnswer: 56,
    difficulty: 'easy',
    incorrectCount: 2,
    similarCorrectCount: 0,
    isMastered: false,
    createdAt: '2026-10-20T12:00:00.000Z',
    lastIncorrectAt: '2026-10-20T12:00:00.000Z',
    ...extra,
  };
}

async function answerCard(user: User, result: SelfReportedResult) {
  const front = screen.getByRole('region', { name: 'Question' });
  await user.click(within(front).getAllByRole('button', { name: /^Choice/ })[0]);
  await user.click(within(front).getByRole('button', { name: 'Flip Card' }));
  await user.click(
    screen.getByRole('button', {
      name: result === 'correct' ? 'I Got It Right' : 'I Got It Wrong',
    }),
  );
}

const reviewConfig: PracticeConfig = {
  mode: 'mistake-review',
  operations: ['multiplication'],
  difficulties: ['easy'],
  sessionLength: 'continuous',
};

describe('practice setup: mistake review option', () => {
  it('is disabled and explains why when there are no mistakes', () => {
    renderAt('/practice/setup');
    const review = screen.getByRole('radio', { name: /practice my mistakes/i });
    expect(review).toBeDisabled();
    expect(review).toHaveAccessibleDescription(/no mistakes to review yet/i);
    expect(screen.getByRole('radio', { name: /regular practice/i })).toBeChecked();
  });

  it('shows how many mistakes are waiting', () => {
    appData.saveMistakePatterns([pattern('a'), pattern('b'), pattern('c', { isMastered: true })]);
    renderAt('/practice/setup');
    expect(
      screen.getByRole('radio', { name: /practice my mistakes/i }),
    ).toHaveAccessibleDescription('2 mistakes to review with similar questions.');
  });

  it('hides operation and level choices in review mode, and starts a review session', async () => {
    appData.saveMistakePatterns([pattern('a')]);
    const user = renderAt('/practice/setup');
    await user.click(screen.getByRole('radio', { name: /practice my mistakes/i }));

    expect(screen.queryByRole('checkbox', { name: 'Addition' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Beginner' })).not.toBeInTheDocument();
    expect(screen.getByText(/questions similar to the ones you missed/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    expect(screen.getByText(/practicing your mistakes/i)).toBeInTheDocument();
  });

  it('switching back to regular practice brings back the usual choices', async () => {
    appData.saveMistakePatterns([pattern('a')]);
    const user = renderAt('/practice/setup');
    await user.click(screen.getByRole('radio', { name: /practice my mistakes/i }));
    await user.click(screen.getByRole('radio', { name: /regular practice/i }));
    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked();
  });
});

describe('mistakes from regular practice', () => {
  it('a wrong answer becomes a mistake to review', async () => {
    const user = renderAt('/practice/session', {
      config: {
        mode: 'regular',
        operations: ['addition'],
        difficulties: ['beginner'],
        sessionLength: 5,
      },
    });
    await answerCard(user, 'incorrect');

    const [saved] = appData.loadMistakePatterns();
    expect(saved).toMatchObject({
      operation: 'addition',
      difficulty: 'beginner',
      incorrectCount: 1,
    });
    expect(appData.loadAttempts()[0]).toMatchObject({
      operation: 'addition',
      firstOperand: saved.firstOperand,
      secondOperand: saved.secondOperand,
    });
  });

  it('a right answer does not', async () => {
    const user = renderAt('/practice/session', {
      config: {
        mode: 'regular',
        operations: ['addition'],
        difficulties: ['beginner'],
        sessionLength: 5,
      },
    });
    await answerCard(user, 'correct');
    expect(appData.loadMistakePatterns()).toEqual([]);
  });
});

describe('mistake review sessions', () => {
  it('redirects to setup if there is nothing to review', () => {
    renderAt('/practice/session', { config: reviewConfig });
    expect(screen.getByRole('status')).toHaveTextContent(/no mistakes to review/i);
  });

  it('asks questions related to the mistake and records which mistake each came from', async () => {
    appData.saveMistakePatterns([pattern('m1')]);
    const user = renderAt('/practice/session', { config: reviewConfig });
    // 7 × 8 related: × or ÷ at easy level
    expect(
      screen.getByRole('heading', { level: 2, name: /^What is \d+ (times|divided by) \d+\?$/ }),
    ).toBeInTheDocument();
    await answerCard(user, 'correct');

    const [attempt] = appData.loadAttempts();
    expect(attempt).toMatchObject({ source: 'mistake-review', mistakePatternId: 'm1' });
    expect(appData.loadMistakePatterns()[0].similarCorrectCount).toBe(1);
  });

  it('mixes questions from several mistakes', async () => {
    appData.saveMistakePatterns([
      pattern('m1'),
      pattern('m2', {
        operation: 'addition',
        firstOperand: 8,
        secondOperand: 5,
        correctAnswer: 13,
      }),
    ]);
    const user = renderAt('/practice/session', { config: reviewConfig });
    for (let i = 0; i < 4; i++) await answerCard(user, 'incorrect');
    const sources = new Set(appData.loadAttempts().map((a) => a.mistakePatternId));
    expect(sources).toEqual(new Set(['m1', 'm2']));
  });

  it('masters a mistake after 3 right answers and ends when nothing is left', async () => {
    appData.saveMistakePatterns([pattern('m1')]);
    const user = renderAt('/practice/session', { config: reviewConfig });
    for (let i = 0; i < 3; i++) await answerCard(user, 'correct');

    expect(
      screen.getByRole('heading', { level: 1, name: 'You mastered all your mistakes!' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Mistakes mastered').nextSibling).toHaveTextContent('1');
    expect(screen.getByText('Mistake review questions').nextSibling).toHaveTextContent('3');
    expect(screen.getByText('Practice type').nextSibling).toHaveTextContent('Mistake review');
    expect(appData.loadMistakePatterns()[0]).toMatchObject({
      isMastered: true,
      similarCorrectCount: 3,
    });
    expect(screen.getByRole('button', { name: 'Practice Mistakes' })).toBeDisabled();
  });

  it('a wrong review answer sets progress back one step', async () => {
    appData.saveMistakePatterns([pattern('m1', { similarCorrectCount: 2 })]);
    const user = renderAt('/practice/session', { config: reviewConfig });
    await answerCard(user, 'incorrect');
    expect(appData.loadMistakePatterns()[0]).toMatchObject({
      similarCorrectCount: 1,
      incorrectCount: 3,
    });
  });

  it('uses the mastery threshold from Settings', async () => {
    appData.saveSettings({ ...DEFAULT_SETTINGS, masteryThreshold: 2 });
    appData.saveMistakePatterns([pattern('m1')]);
    const user = renderAt('/practice/session', { config: reviewConfig });
    await answerCard(user, 'correct');
    await answerCard(user, 'correct');
    expect(appData.loadMistakePatterns()[0].isMastered).toBe(true);
  });
});

describe('statistics: mistakes section', () => {
  function seed() {
    appData.saveMistakePatterns([
      pattern('m1', { incorrectCount: 4 }),
      pattern('m2', {
        operation: 'addition',
        firstOperand: 8,
        secondOperand: 5,
        correctAnswer: 13,
        incorrectCount: 1,
        similarCorrectCount: 2,
      }),
      pattern('m3', {
        operation: 'division',
        firstOperand: 24,
        secondOperand: 6,
        correctAnswer: 4,
        isMastered: true,
        similarCorrectCount: 3,
        masteredAt: '2026-10-20T13:00:00.000Z',
      }),
    ]);
    const base = {
      sessionId: 's1',
      difficulty: 'easy' as const,
      firstOperand: 7,
      secondOperand: 8,
      correctAnswer: 56,
      selectedAnswer: 54,
      answeredAt: '2026-10-20T12:00:00.000Z',
    };
    appData.saveAttempt({
      ...base,
      id: 'a1',
      questionId: 'q1',
      operation: 'multiplication',
      result: 'incorrect',
      source: 'regular',
    });
    appData.saveAttempt({
      ...base,
      id: 'a2',
      questionId: 'q2',
      operation: 'multiplication',
      result: 'incorrect',
      source: 'regular',
    });
    appData.saveAttempt({
      ...base,
      id: 'a3',
      questionId: 'q3',
      operation: 'addition',
      result: 'incorrect',
      source: 'regular',
    });
    appData.saveAttempt({
      ...base,
      id: 'a4',
      questionId: 'q4',
      operation: 'multiplication',
      result: 'correct',
      source: 'mistake-review',
      mistakePatternId: 'm1',
    });
  }

  const tile = (label: string) =>
    within(screen.getByRole('list', { name: 'Mistake totals' })).getByText(label).previousSibling;

  it('shows mistake totals', () => {
    seed();
    renderAt('/statistics');
    expect(tile('Still learning')).toHaveTextContent('2');
    expect(tile('Mastered')).toHaveTextContent('1');
    expect(tile('Review questions')).toHaveTextContent('1');
    expect(tile('Review correct')).toHaveTextContent('1');
  });

  it('shows the most missed operation and facts, most missed first', () => {
    seed();
    renderAt('/statistics');
    const mostMissedPanel = screen.getByRole('heading', { name: 'Most missed operation' })
      .parentElement as HTMLElement;
    expect(mostMissedPanel).toHaveTextContent('Multiplication — missed 2 times');
    const topFacts = screen.getByRole('heading', { name: 'Most missed facts' }).nextElementSibling!;
    const items = within(topFacts as HTMLElement).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('7 × 8 = 56');
    expect(items[0]).toHaveTextContent('missed 4 times');
  });

  it('lists mistakes still being learned with progress, and mastered ones separately', async () => {
    seed();
    const user = renderAt('/statistics');
    const learning = within(screen.getByRole('list', { name: 'Mistakes to practice' }));
    expect(learning.getAllByRole('listitem')).toHaveLength(2);
    expect(learning.getByText('8 + 5 = 13').parentElement).toHaveTextContent('2 of 3 to master');
    expect(learning.getByText('7 × 8 = 56').parentElement).toHaveTextContent('Missed 4 times');
    expect(learning.getByText('7 × 8 = 56').parentElement).toHaveTextContent('Last missed Oct 20');

    await user.click(screen.getByRole('button', { name: /mastered \(1\)/i }));
    const mastered = within(screen.getByRole('list', { name: 'Mastered mistakes' }));
    expect(mastered.getByText('24 ÷ 6 = 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mastered \(1\)/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('shows an empty state when there are no mistakes', () => {
    appData.saveAttempt({
      id: 'a1',
      sessionId: 's1',
      questionId: 'q1',
      operation: 'addition',
      difficulty: 'beginner',
      firstOperand: 1,
      secondOperand: 1,
      correctAnswer: 2,
      selectedAnswer: 2,
      result: 'correct',
      source: 'regular',
      answeredAt: '2026-10-20T12:00:00.000Z',
    });
    renderAt('/statistics');
    expect(screen.getByText('No mistakes yet!')).toBeInTheDocument();
  });

  it('links to mistake practice with review mode chosen', async () => {
    seed();
    const user = renderAt('/statistics');
    await user.click(screen.getByRole('link', { name: 'Practice My Mistakes' }));
    expect(screen.getByRole('radio', { name: /practice my mistakes/i })).toBeChecked();
  });
});

describe('settings: mastery threshold', () => {
  it('can be changed and is saved', async () => {
    const user = renderAt('/settings');
    expect(screen.getByRole('radio', { name: '3 correct answers (default)' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: '5 correct answers' }));
    expect(appData.loadSettings().masteryThreshold).toBe(5);
  });
});
