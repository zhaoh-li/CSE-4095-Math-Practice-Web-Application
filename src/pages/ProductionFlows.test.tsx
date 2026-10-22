import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { DEFAULT_SETTINGS } from '../config/defaultSettings';
import { FEEDBACK_MESSAGES } from '../config/feedbackMessages';
import { createAppRoutes } from '../routes';
import { appData } from '../services/appData';
import { STORAGE_PREFIX } from '../services/storage';
import { TestApp } from '../test/TestApp';
import type { PracticeConfig, SelfReportedResult } from '../types';
import { PrivacyPage } from './PrivacyPage';
import { SettingsPage } from './SettingsPage';

type User = ReturnType<typeof userEvent.setup>;

const config: PracticeConfig = {
  mode: 'regular',
  operations: ['addition'],
  difficulties: ['beginner'],
  sessionLength: 5,
};

function renderAt(path: string, state?: unknown) {
  const user = userEvent.setup();
  const utils = render(<TestApp initialEntries={[{ pathname: path, state }]} />);
  return { user, ...utils };
}

async function answer(user: User, result: SelfReportedResult = 'correct') {
  await user.keyboard('1');
  await user.keyboard('f');
  await user.keyboard(result === 'correct' ? 'r' : 'w');
}

const nav = () => within(screen.getByRole('navigation', { name: 'Main' }));

describe('a mixed-operation session', () => {
  it('uses only the chosen operations and finishes with a summary', async () => {
    const { user } = renderAt('/practice/session', {
      config: { ...config, operations: ['subtraction', 'multiplication'], sessionLength: 10 },
    });
    for (let i = 0; i < 10; i++) await answer(user);
    const operations = new Set(appData.loadAttempts().map((a) => a.operation));
    expect([...operations].every((op) => op === 'subtraction' || op === 'multiplication')).toBe(
      true,
    );
    expect(screen.getByText('Subtraction and Multiplication')).toBeInTheDocument();
  });
});

describe('unfinished sessions', () => {
  it('pick up exactly where they left off after a refresh', async () => {
    const first = renderAt('/practice/session', { config });
    await answer(first.user, 'correct');
    await answer(first.user, 'incorrect');
    // On question 3: pick an answer and flip, then "refresh"
    await first.user.keyboard('2');
    await first.user.keyboard('f');
    const picked = screen.getByText(/you picked:/i).textContent;
    first.unmount();

    const second = renderAt('/practice/session');
    expect(screen.getByText('Question 3 of 5')).toBeInTheDocument();
    expect(document.querySelector('[data-flipped="true"]')).toBeInTheDocument();
    expect(screen.getByText(/you picked:/i).textContent).toBe(picked);

    await second.user.keyboard('r');
    await answer(second.user);
    await answer(second.user);
    const tiles = within(screen.getByRole('list', { name: 'Your results' }));
    expect(tiles.getByText('Questions').previousSibling).toHaveTextContent('5');
    expect(tiles.getByText('Incorrect').previousSibling).toHaveTextContent('1');
    // Finished sessions are not offered again
    expect(appData.loadActiveSession()).toBeNull();
  });

  it('are offered on the setup page, and can be continued', async () => {
    const first = renderAt('/practice/session', { config });
    await answer(first.user);
    first.unmount();

    const { user } = renderAt('/practice/setup');
    const banner = screen.getByRole('region', { name: /unfinished session/i });
    expect(banner).toHaveTextContent('You were on question 2 of 5');
    await user.click(within(banner).getByRole('button', { name: 'Continue Session' }));
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
  });

  it('can be thrown away with Start Over, keeping the answers in history', async () => {
    const first = renderAt('/practice/session', { config });
    await answer(first.user);
    first.unmount();

    const { user } = renderAt('/practice/setup');
    await user.click(screen.getByRole('button', { name: 'Start Over' }));
    expect(screen.queryByRole('region', { name: /unfinished session/i })).not.toBeInTheDocument();
    expect(appData.loadActiveSession()).toBeNull();
    expect(appData.loadSessions()[0]).toMatchObject({ attemptedCount: 1, isActive: false });
  });
});

describe('leaving a session', () => {
  it('asks first, and "Keep practicing" stays on the session', async () => {
    const { user } = renderAt('/practice/session', { config });
    await answer(user);
    await user.click(nav().getByRole('link', { name: 'Statistics' }));

    const dialog = screen.getByRole('alertdialog', { name: /leave this practice session/i });
    expect(dialog).toHaveTextContent("You've answered 1 question");
    await user.click(within(dialog).getByRole('button', { name: 'Keep practicing' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
  });

  it('"End and leave" ends the session and goes where you clicked', async () => {
    const { user } = renderAt('/practice/session', { config });
    await answer(user);
    await user.click(nav().getByRole('link', { name: 'Statistics' }));
    await user.click(screen.getByRole('button', { name: 'End and leave' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Your Statistics' })).toBeInTheDocument();
    expect(appData.loadSessions()[0]).toMatchObject({ attemptedCount: 1, isActive: false });
    expect(appData.loadActiveSession()).toBeNull();
  });

  it('does not ask before any question is answered', async () => {
    const { user } = renderAt('/practice/session', { config });
    await user.click(nav().getByRole('link', { name: 'Home' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /welcome/i })).toBeInTheDocument();
  });

  it('does not ask after the session is finished', async () => {
    const { user } = renderAt('/practice/session', { config });
    for (let i = 0; i < 5; i++) await answer(user);
    await user.click(nav().getByRole('link', { name: 'Home' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});

describe('encouraging messages', () => {
  it('show a cheer after a right answer and support after a wrong one', async () => {
    const { user } = renderAt('/practice/session', { config });
    await answer(user, 'correct');
    const shown = () => document.querySelector('[class*="banner"]')?.textContent ?? '';
    expect(FEEDBACK_MESSAGES.correct.some((m) => shown().includes(m))).toBe(true);
    await answer(user, 'incorrect');
    expect(FEEDBACK_MESSAGES.incorrect.some((m) => shown().includes(m))).toBe(true);
  });

  it('can be turned off in Settings', async () => {
    appData.saveSettings({ ...DEFAULT_SETTINGS, feedbackEffectsEnabled: false });
    const { user } = renderAt('/practice/session', { config });
    await answer(user);
    expect(document.querySelector('[class*="banner"]')).toBeNull();
  });

  it('has a switch on the Settings page', async () => {
    const { user } = renderAt('/settings');
    await user.click(screen.getByRole('switch', { name: /encouraging messages/i }));
    expect(appData.loadSettings().feedbackEffectsEnabled).toBe(false);
  });
});

describe('errors', () => {
  function Broken(): never {
    throw new Error('Something deep inside broke: TypeError at line 42');
  }

  it('a crashing page shows a friendly message, keeps the menu, and offers a way home', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const router = createMemoryRouter(
      createAppRoutes({ StatisticsPage: Broken, SettingsPage, PrivacyPage }),
      { initialEntries: ['/statistics'] },
    );
    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('heading', { level: 1, name: /oops! something went wrong/i }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Go to Home' }),
    ).toHaveAttribute('href', '/');
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    // No technical details for kids
    expect(document.body.textContent).not.toMatch(/TypeError|line 42|stack/i);
    vi.restoreAllMocks();
  });

  it('damaged saved data is fixed and explained in plain words', async () => {
    window.localStorage.setItem(`${STORAGE_PREFIX}settings`, '{not valid json');
    const { user } = renderAt('/');
    const notice = screen.getByText(/some saved information was damaged/i);
    expect(notice).toHaveTextContent('your settings');
    expect(notice).toHaveTextContent('Everything else is safe.');
    await user.click(screen.getByRole('button', { name: /^OK/ }));
    expect(screen.queryByText(/some saved information was damaged/i)).not.toBeInTheDocument();
  });

  it('shows no data notice when everything is fine', () => {
    renderAt('/');
    expect(screen.queryByText(/saved information was damaged/i)).not.toBeInTheDocument();
  });
});

describe('loading pages on demand', () => {
  it('Statistics, Settings, and Privacy still open normally when loaded on demand', async () => {
    for (const [path, heading] of [
      ['/statistics', 'Your Statistics'],
      ['/settings', 'Settings'],
      ['/privacy', 'Privacy'],
    ]) {
      const router = createMemoryRouter(createAppRoutes(), { initialEntries: [path] });
      const { unmount } = render(<RouterProvider router={router} />);
      expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
      unmount();
    }
  });
});

describe('privacy', () => {
  it('the footer links to a plain-language privacy page', async () => {
    const { user } = renderAt('/');
    await user.click(
      within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Privacy' }),
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No personal information' })).toBeInTheDocument();
    expect(screen.getByText(/clear this browser's data/i)).toBeInTheDocument();
  });

  it('Settings shows how much space saved data uses', () => {
    appData.saveSettings(DEFAULT_SETTINGS);
    renderAt('/settings');
    expect(screen.getByText(/saved data uses about/i)).toHaveTextContent(/\d+ (bytes|KB|MB)/);
  });
});
