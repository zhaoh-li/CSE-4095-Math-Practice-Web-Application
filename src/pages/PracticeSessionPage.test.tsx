import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../AppRoutes';
import type { PracticeConfig } from '../types';

function renderSession(config: PracticeConfig) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[{ pathname: '/practice/session', state: { config } }]}>
      <AppRoutes />
    </MemoryRouter>,
  );
  return user;
}

async function answerCurrentCard(user: ReturnType<typeof userEvent.setup>) {
  const front = screen.getByRole('region', { name: 'Question' });
  await user.click(within(front).getAllByRole('button', { name: /^Choice/ })[0]);
  await user.click(within(front).getByRole('button', { name: 'Flip Card' }));
  await user.click(screen.getByRole('button', { name: 'I Got It Right' }));
}

describe('PracticeSessionPage', () => {
  it('plays through a 5-question session and shows a finish message', async () => {
    const user = renderSession({
      mode: 'regular',
      operations: ['addition'],
      difficulty: 'beginner',
      sessionLength: 5,
    });

    for (let n = 1; n <= 5; n++) {
      expect(screen.getByText(`Question ${n} of 5`)).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 2, name: /^What is \d+ plus \d+\?$/ }),
      ).toBeInTheDocument();
      await answerCurrentCard(user);
    }

    expect(screen.getByRole('heading', { name: 'Great job!' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Practice Again' }));
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
  });

  it('moves focus to the new question after answering', async () => {
    const user = renderSession({
      mode: 'regular',
      operations: ['division'],
      difficulty: 'easy',
      sessionLength: 10,
    });
    await answerCurrentCard(user);
    expect(screen.getByRole('heading', { level: 2, name: /^What is/ })).toHaveFocus();
  });
});
