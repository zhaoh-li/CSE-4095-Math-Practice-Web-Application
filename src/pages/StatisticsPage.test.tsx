import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../AppRoutes';
import { DEFAULT_SETTINGS } from '../config/defaultSettings';
import { appData } from '../services/appData';
import type { PracticeAttempt, PracticeSession } from '../types';

let n = 0;
function attempt(extra: Partial<PracticeAttempt>): PracticeAttempt {
  n += 1;
  return {
    id: `a-${n}`,
    sessionId: 's-1',
    questionId: `q-${n}`,
    operation: 'addition',
    difficulty: 'beginner',
    firstOperand: 1,
    secondOperand: 1,
    correctAnswer: 2,
    selectedAnswer: 2,
    result: 'correct',
    source: 'regular',
    answeredAt: '2026-10-20T12:00:00.000Z',
    ...extra,
  };
}

function session(
  id: string,
  completedAt: string,
  extra: Partial<PracticeSession> = {},
): PracticeSession {
  return {
    id,
    mode: 'regular',
    operations: ['addition', 'multiplication'],
    difficulty: 'easy',
    sessionLength: 10,
    currentQuestionIndex: 9,
    attemptedCount: 10,
    correctCount: 7,
    incorrectCount: 3,
    mistakeReviewCount: 0,
    isActive: false,
    startedAt: completedAt,
    completedAt,
    ...extra,
  };
}

function seedHistory() {
  [
    attempt({ operation: 'addition', difficulty: 'beginner', result: 'correct' }),
    attempt({ operation: 'addition', difficulty: 'beginner', result: 'incorrect' }),
    attempt({ operation: 'multiplication', difficulty: 'easy', result: 'correct' }),
    attempt({ operation: 'multiplication', difficulty: 'easy', result: 'correct' }),
  ].forEach((a) => appData.saveAttempt(a));
  appData.saveSession(
    session('older', '2026-10-01T15:00:00.000Z', { correctCount: 5, incorrectCount: 5 }),
  );
  appData.saveSession(session('newer', '2026-10-20T15:00:00.000Z'));
}

function renderStats() {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/statistics']}>
      <AppRoutes />
    </MemoryRouter>,
  );
  return user;
}

const tile = (listName: string, label: string) =>
  within(screen.getByRole('list', { name: listName })).getByText(label).previousSibling;

describe('StatisticsPage', () => {
  it('shows a friendly empty state for new users', () => {
    renderStats();
    expect(screen.getByRole('heading', { name: 'No practice yet!' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Start Practice' }),
    ).toHaveAttribute('href', '/practice/setup');
    expect(screen.queryByRole('button', { name: 'Reset Statistics' })).not.toBeInTheDocument();
  });

  it('shows overall totals and accuracy', () => {
    seedHistory();
    renderStats();
    expect(tile('Overall results', 'Questions')).toHaveTextContent('4');
    expect(tile('Overall results', 'Correct')).toHaveTextContent('3');
    expect(tile('Overall results', 'Incorrect')).toHaveTextContent('1');
    expect(tile('Overall results', 'Accuracy')).toHaveTextContent('75%');
  });

  it('shows a card for each operation', () => {
    seedHistory();
    renderStats();
    const addition = screen.getByRole('article', { name: 'Addition' });
    expect(within(addition).getByRole('meter', { name: 'Addition accuracy' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    expect(within(addition).getByText('Tried').nextSibling).toHaveTextContent('2');
    expect(
      within(screen.getByRole('article', { name: 'Multiplication' })).getByText('100%'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('article', { name: 'Division' })).getByText('Not practiced yet'),
    ).toBeInTheDocument();
  });

  it('shows a clearly labeled card for each level', () => {
    seedHistory();
    renderStats();
    const easy = screen.getByRole('article', { name: 'Easy' });
    expect(within(easy).getByText('Level 2')).toBeInTheDocument();
    expect(within(easy).getByText('100%')).toBeInTheDocument();
    expect(
      within(screen.getByRole('article', { name: 'Advanced' })).getByText('Not practiced yet'),
    ).toBeInTheDocument();
  });

  it('lists recent sessions newest first', () => {
    seedHistory();
    renderStats();
    const table = within(screen.getByRole('region', { name: 'Recent sessions' }));
    const rows = table.getAllByRole('row').slice(1); // skip the header row
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Oct 20');
    expect(rows[0]).toHaveTextContent('70%');
    expect(rows[0]).toHaveTextContent('Addition, Multiplication');
    expect(rows[1]).toHaveTextContent('Oct 1');
    expect(rows[1]).toHaveTextContent('50%');
  });

  describe('reset', () => {
    it('asks for confirmation and can be cancelled', async () => {
      seedHistory();
      const user = renderStats();
      await user.click(screen.getByRole('button', { name: 'Reset Statistics' }));

      const dialog = screen.getByRole('alertdialog', { name: /reset your statistics/i });
      expect(within(dialog).getByRole('button', { name: 'No, keep them' })).toHaveFocus();
      await user.click(within(dialog).getByRole('button', { name: 'No, keep them' }));

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(appData.loadAttempts()).toHaveLength(4);
      expect(screen.getByRole('button', { name: 'Reset Statistics' })).toHaveFocus();
    });

    it('closes with the Escape key', async () => {
      seedHistory();
      const user = renderStats();
      await user.click(screen.getByRole('button', { name: 'Reset Statistics' }));
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('clears history but keeps settings, then refreshes the page', async () => {
      seedHistory();
      appData.saveSettings({ ...DEFAULT_SETTINGS, defaultDifficulty: 'advanced' });
      const user = renderStats();
      await user.click(screen.getByRole('button', { name: 'Reset Statistics' }));
      await user.click(screen.getByRole('button', { name: 'Yes, reset everything' }));

      expect(appData.loadAttempts()).toEqual([]);
      expect(appData.loadSessions()).toEqual([]);
      expect(appData.loadSettings().defaultDifficulty).toBe('advanced');
      expect(screen.getByRole('status')).toHaveTextContent('Your statistics have been reset.');
      expect(screen.getByRole('heading', { name: 'No practice yet!' })).toBeInTheDocument();
    });
  });
});
