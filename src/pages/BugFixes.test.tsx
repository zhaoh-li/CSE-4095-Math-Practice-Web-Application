import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { createAppRoutes } from '../routes';
import { appData } from '../services/appData';
import { TestApp } from '../test/TestApp';
import type { PracticeConfig, PracticeSession } from '../types';
import { calculateAppStatistics } from '../utils/statistics';
import { PrivacyPage } from './PrivacyPage';
import { SettingsPage } from './SettingsPage';
import { StatisticsPage } from './StatisticsPage';

const config: PracticeConfig = {
  mode: 'regular',
  operations: ['addition'],
  difficulties: ['beginner'],
  sessionLength: 5,
};

function renderAt(path: string, state?: unknown) {
  const user = userEvent.setup();
  render(<TestApp initialEntries={[{ pathname: path, state }]} />);
  return user;
}

const nav = () => within(screen.getByRole('navigation', { name: 'Main' }));

describe('bug fix: no "unfinished session" after leaving with zero answers', () => {
  it('leaving before answering does not offer to continue', async () => {
    const user = renderAt('/practice/session', { config });
    await user.click(nav().getByRole('link', { name: 'Practice' }));
    expect(screen.queryByRole('region', { name: /unfinished session/i })).not.toBeInTheDocument();
    expect(appData.loadActiveSession()).toBeNull();
  });

  it('still offers to continue once a question has been answered', async () => {
    const user = renderAt('/practice/session', { config });
    await user.keyboard('1fr');
    expect(appData.loadActiveSession()).not.toBeNull();
  });
});

describe('bug fix: Practice is highlighted during practice', () => {
  it.each([
    ['/practice/setup', undefined],
    ['/practice/session', { config }],
  ])('on %s', (path, state) => {
    renderAt(path, state);
    const current = screen
      .getByRole('navigation', { name: 'Main' })
      .querySelector('[aria-current="page"]');
    expect(current).toHaveTextContent('Practice');
  });

  it('on the summary page', async () => {
    const user = renderAt('/practice/session', { config });
    for (let i = 0; i < 5; i++) await user.keyboard('1fr');
    expect(nav().getByRole('link', { name: 'Practice' })).toHaveAttribute('aria-current', 'page');
  });

  it('and only one item is highlighted on other pages', () => {
    renderAt('/statistics');
    expect(
      screen.getByRole('navigation', { name: 'Main' }).querySelectorAll('[aria-current="page"]'),
    ).toHaveLength(1);
  });
});

describe('bug fix: storage warning shows only once', () => {
  it.each(['/statistics', '/settings'])('on %s', (path) => {
    const spy = vi.spyOn(appData, 'isPersistent', 'get').mockReturnValue(false);
    const router = createMemoryRouter(
      createAppRoutes({ StatisticsPage, SettingsPage, PrivacyPage }),
      {
        initialEntries: [path],
      },
    );
    render(<RouterProvider router={router} />);
    const text = document.body.textContent ?? '';
    expect((text.match(/isn't letting the app save|not saving data/g) ?? []).length).toBe(1);
    spy.mockRestore();
  });
});

describe('bug fix: Esc cancels "End this session?"', () => {
  it('closes the question and keeps practicing', async () => {
    const user = renderAt('/practice/session', {
      config: { ...config, sessionLength: 'continuous' },
    });
    await user.keyboard('1fr');
    await user.click(screen.getByRole('button', { name: 'End Session' }));
    expect(screen.getByText(/end this session/i)).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByText(/end this session/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'End Session' })).toHaveFocus();
    expect(screen.getByText('Question 2')).toBeInTheDocument();
  });
});

describe('bug fix: one-time notices do not come back after a refresh', () => {
  it('the notice shows, and is removed from the page history', async () => {
    const router = createMemoryRouter(
      createAppRoutes({ StatisticsPage, SettingsPage, PrivacyPage }),
      {
        initialEntries: [{ pathname: '/', state: { notice: 'All app data was cleared.' } }],
      },
    );
    render(<RouterProvider router={router} />);
    expect(screen.getByRole('status')).toHaveTextContent('All app data was cleared.');
    // What a refresh would read back from history:
    await vi.waitFor(() => expect(router.state.location.state).toBeNull());
    // ...while the message stays visible right now
    expect(screen.getByRole('status')).toHaveTextContent('All app data was cleared.');
  });

  it('keeps other page data (like chosen setup) when removing the notice', async () => {
    const router = createMemoryRouter(
      createAppRoutes({ StatisticsPage, SettingsPage, PrivacyPage }),
      {
        initialEntries: [{ pathname: '/practice/setup', state: { notice: 'Hi', config } }],
      },
    );
    render(<RouterProvider router={router} />);
    await vi.waitFor(() => expect(router.state.location.state).toEqual({ config }));
  });
});

describe('bug fix: unfinished sessions are not listed as recent', () => {
  it('only finished sessions appear in Recent Sessions', () => {
    const base: PracticeSession = {
      id: 'done',
      mode: 'regular',
      operations: ['addition'],
      difficulties: ['beginner'],
      sessionLength: 5,
      currentQuestionIndex: 4,
      attemptedCount: 5,
      correctCount: 5,
      incorrectCount: 0,
      mistakeReviewCount: 0,
      isActive: false,
      startedAt: '2026-10-21T10:00:00.000Z',
      completedAt: '2026-10-21T10:05:00.000Z',
    };
    const stats = calculateAppStatistics(
      [],
      [base, { ...base, id: 'in-progress', isActive: true, completedAt: undefined }],
    );
    expect(stats.recentSessions.map((s) => s.sessionId)).toEqual(['done']);
  });
});

describe('bug fix: privacy page does not overpromise offline use', () => {
  it('describes internet use accurately', () => {
    renderAt('/privacy');
    expect(screen.queryByText(/without an internet connection/i)).not.toBeInTheDocument();
    expect(screen.getByText(/only used to open the app/i)).toBeInTheDocument();
  });
});
