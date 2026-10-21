import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestApp } from '../test/TestApp';
import { appData } from '../services/appData';
import type { PracticeSession } from '../types';

const finishedSession: PracticeSession = {
  id: 's-1',
  mode: 'regular',
  operations: ['subtraction', 'addition'],
  difficulty: 'intermediate',
  sessionLength: 10,
  currentQuestionIndex: 9,
  attemptedCount: 10,
  correctCount: 9,
  incorrectCount: 1,
  mistakeReviewCount: 0,
  isActive: false,
  startedAt: '2026-10-20T12:00:00.000Z',
  completedAt: '2026-10-20T12:06:00.000Z',
};

function renderSummary(session: unknown = finishedSession) {
  const user = userEvent.setup();
  render(<TestApp initialEntries={[{ pathname: '/practice/summary', state: { session } }]} />);
  return user;
}

const statValue = (label: string) =>
  within(screen.getByRole('list', { name: 'Your results' })).getByText(label).previousSibling;

describe('SessionSummaryPage', () => {
  it('shows totals, accuracy, and an encouraging title', () => {
    renderSummary();
    expect(screen.getByRole('heading', { level: 1, name: 'Amazing work!' })).toBeInTheDocument();
    expect(statValue('Questions')).toHaveTextContent('10');
    expect(statValue('Correct')).toHaveTextContent('9');
    expect(statValue('Incorrect')).toHaveTextContent('1');
    expect(statValue('Accuracy')).toHaveTextContent('90%');
  });

  it('shows what was practiced', () => {
    renderSummary();
    expect(screen.getByText('Addition and Subtraction')).toBeInTheDocument();
    expect(screen.getByText('Intermediate (Level 3)')).toBeInTheDocument();
    expect(screen.getByText('10 questions')).toBeInTheDocument();
    expect(screen.getByText('Mistake review questions').nextSibling).toHaveTextContent('0');
  });

  it.each([
    [10, 'Amazing work!'],
    [7, 'Great job!'],
    [5, 'Nice effort!'],
    [2, 'Way to keep trying!'],
  ])('with %i of 10 correct, says "%s"', (correct, title) => {
    renderSummary({ ...finishedSession, correctCount: correct, incorrectCount: 10 - correct });
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
  });

  it('shows a helpful message when there are no results', () => {
    renderSummary(null);
    expect(screen.getByRole('heading', { level: 1, name: 'No Results Yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start Practice' })).toHaveAttribute(
      'href',
      '/practice/setup',
    );
  });

  describe('actions', () => {
    it('Practice Again starts a new session with the same settings', async () => {
      const user = renderSummary();
      await user.click(screen.getByRole('button', { name: 'Practice Again' }));
      expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 2, name: /^What is \d+ (plus|minus) \d+\?$/ }),
      ).toBeInTheDocument();
    });

    it('Change Settings opens setup with the previous choices', async () => {
      const user = renderSummary();
      await user.click(screen.getByRole('button', { name: 'Change Settings' }));
      expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Subtraction' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Multiplication' })).not.toBeChecked();
      expect(screen.getByRole('radio', { name: 'Intermediate' })).toBeChecked();
    });

    it('links to statistics and home', () => {
      renderSummary();
      const main = within(screen.getByRole('main'));
      expect(main.getByRole('link', { name: 'View Statistics' })).toHaveAttribute(
        'href',
        '/statistics',
      );
      expect(main.getByRole('link', { name: 'Return Home' })).toHaveAttribute('href', '/');
    });

    it('Practice Mistakes starts a review session when there are mistakes', async () => {
      appData.saveMistakePatterns([
        {
          id: 'm1',
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
        },
      ]);
      const user = renderSummary();
      const button = screen.getByRole('button', { name: 'Practice Mistakes' });
      expect(button).toHaveAccessibleDescription('1 mistake to review');
      await user.click(button);
      expect(screen.getByText(/practicing your mistakes/i)).toBeInTheDocument();
    });

    it('says there are no mistakes to practice after a perfect score', () => {
      renderSummary({ ...finishedSession, correctCount: 10, incorrectCount: 0 });
      expect(screen.getByRole('button', { name: 'Practice Mistakes' })).toHaveAccessibleDescription(
        'No mistakes to practice!',
      );
    });
  });
});
