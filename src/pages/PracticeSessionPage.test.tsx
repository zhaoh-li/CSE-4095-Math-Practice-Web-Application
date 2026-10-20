import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../AppRoutes';
import type { PracticeConfig, SelfReportedResult } from '../types';

const baseConfig: PracticeConfig = {
  mode: 'regular',
  operations: ['addition'],
  difficulty: 'beginner',
  sessionLength: 5,
};

function renderSession(config: Partial<PracticeConfig> = {}) {
  const user = userEvent.setup();
  render(
    <MemoryRouter
      initialEntries={[
        { pathname: '/practice/session', state: { config: { ...baseConfig, ...config } } },
      ]}
    >
      <AppRoutes />
    </MemoryRouter>,
  );
  return user;
}

type User = ReturnType<typeof userEvent.setup>;

async function answerCard(user: User, result: SelfReportedResult = 'correct') {
  const front = screen.getByRole('region', { name: 'Question' });
  await user.click(within(front).getAllByRole('button', { name: /^Choice/ })[0]);
  await user.click(within(front).getByRole('button', { name: 'Flip Card' }));
  await user.click(
    screen.getByRole('button', {
      name: result === 'correct' ? 'I Got It Right' : 'I Got It Wrong',
    }),
  );
}

const currentProblem = () => screen.getByRole('heading', { level: 2, name: /^What is/ });

describe('PracticeSessionPage', () => {
  it('redirects to setup with a friendly message when there is no setup', () => {
    render(
      <MemoryRouter initialEntries={['/practice/session']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Set Up Your Practice' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/choose what to practice first/i);
  });

  it('redirects to setup when the setup data is invalid', () => {
    renderSession({ operations: [] });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Set Up Your Practice' }),
    ).toBeInTheDocument();
  });

  it('shows and updates progress after every answer', async () => {
    const user = renderSession({ sessionLength: 10 });
    const bar = () => screen.getByRole('progressbar', { name: 'Session progress' });

    expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
    expect(bar()).toHaveAttribute('aria-valuenow', '0');
    expect(bar()).toHaveAttribute('aria-valuemax', '10');

    await answerCard(user);
    expect(screen.getByText('Question 2 of 10')).toBeInTheDocument();
    expect(bar()).toHaveAttribute('aria-valuenow', '1');
    expect(bar()).toHaveAttribute('aria-valuetext', 'Question 2 of 10. 1 answered.');
  });

  it('shows a new question and moves focus to it after each answer', async () => {
    const user = renderSession({
      operations: ['multiplication'],
      difficulty: 'easy',
      sessionLength: 10,
    });
    const first = currentProblem().textContent;
    await answerCard(user);
    expect(currentProblem()).toHaveFocus();
    expect(currentProblem().textContent).not.toBe(first);
  });

  it('goes to the summary with correct totals after the last question', async () => {
    const user = renderSession({ sessionLength: 5 });
    const results: SelfReportedResult[] = [
      'correct',
      'incorrect',
      'correct',
      'correct',
      'incorrect',
    ];
    for (const result of results) await answerCard(user, result);

    expect(screen.getByRole('heading', { level: 1, name: 'Nice effort!' })).toBeInTheDocument();
    const stats = within(screen.getByRole('list', { name: 'Your results' }));
    expect(stats.getByText('Questions').previousSibling).toHaveTextContent('5');
    expect(stats.getByText('Correct').previousSibling).toHaveTextContent('3');
    expect(stats.getByText('Incorrect').previousSibling).toHaveTextContent('2');
    expect(stats.getByText('Accuracy').previousSibling).toHaveTextContent('60%');
  });

  describe('continuous practice', () => {
    it('has no fixed end or progress bar', async () => {
      const user = renderSession({ sessionLength: 'continuous' });
      for (let i = 0; i < 25; i++) await answerCard(user);
      expect(screen.getByText('Question 26')).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('asks before ending, and can keep going', async () => {
      const user = renderSession({ sessionLength: 'continuous' });
      await answerCard(user);
      await user.click(screen.getByRole('button', { name: 'End Session' }));

      expect(screen.getByText(/end this session/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Yes, end it' })).toHaveFocus();

      await user.click(screen.getByRole('button', { name: 'Keep practicing' }));
      expect(screen.getByRole('button', { name: 'End Session' })).toHaveFocus();
      expect(screen.getByText('Question 2')).toBeInTheDocument();
    });

    it('shows a summary after ending', async () => {
      const user = renderSession({ sessionLength: 'continuous' });
      await answerCard(user, 'correct');
      await answerCard(user, 'correct');
      await user.click(screen.getByRole('button', { name: 'End Session' }));
      await user.click(screen.getByRole('button', { name: 'Yes, end it' }));

      expect(screen.getByRole('heading', { level: 1, name: 'Amazing work!' })).toBeInTheDocument();
      expect(screen.getByText('Keep going')).toBeInTheDocument();
    });
  });

  it('goes back to setup without asking when ending before any answers', async () => {
    const user = renderSession({ sessionLength: 'continuous', difficulty: 'advanced' });
    await user.click(screen.getByRole('button', { name: 'End Session' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Set Up Your Practice' }),
    ).toBeInTheDocument();
    // The previous choices are kept
    expect(screen.getByRole('radio', { name: 'Advanced' })).toBeChecked();
  });

  it('marks a fixed-length session that ends early', async () => {
    const user = renderSession({ sessionLength: 20 });
    await answerCard(user);
    await user.click(screen.getByRole('button', { name: 'End Session' }));
    await user.click(screen.getByRole('button', { name: 'Yes, end it' }));
    expect(screen.getByText('20 questions (ended early)')).toBeInTheDocument();
  });
});
