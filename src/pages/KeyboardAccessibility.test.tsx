import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestApp } from '../test/TestApp';
import { DEFAULT_SETTINGS } from '../config/defaultSettings';
import { appData } from '../services/appData';
import type { PracticeConfig } from '../types';

const config: PracticeConfig = {
  mode: 'regular',
  operations: ['addition'],
  difficulty: 'beginner',
  sessionLength: 5,
};

function renderAt(path: string, state?: unknown) {
  const user = userEvent.setup();
  render(<TestApp initialEntries={[{ pathname: path, state }]} />);
  return user;
}

describe('keyboard-only practice', () => {
  it('completes a whole session using only shortcut keys', async () => {
    const user = renderAt('/practice/session', { config });
    for (let i = 0; i < 5; i++) {
      await user.keyboard('1');
      await user.keyboard('f');
      await user.keyboard(i % 2 === 0 ? 'r' : 'w');
    }
    expect(screen.getByRole('list', { name: 'Your results' })).toBeInTheDocument();
    expect(appData.loadAttempts().map((a) => a.result)).toEqual([
      'correct',
      'incorrect',
      'correct',
      'incorrect',
      'correct',
    ]);
  });

  it('completes a session from setup with Tab, Space, and Enter only', async () => {
    const user = renderAt('/practice/setup');
    // Tab until Start Session has focus, then press Enter
    const start = screen.getByRole('button', { name: 'Start Session' });
    for (let i = 0; i < 40 && document.activeElement !== start; i++) await user.tab();
    expect(start).toHaveFocus();
    await user.keyboard('{Enter}');

    // On the card: Tab to the first choice, Space to pick, Tab to Flip, Enter
    const front = within(screen.getByRole('region', { name: 'Question' }));
    const firstChoice = front.getAllByRole('button', { name: /^Choice/ })[0];
    for (let i = 0; i < 10 && document.activeElement !== firstChoice; i++) await user.tab();
    await user.keyboard(' ');
    expect(firstChoice).toHaveAttribute('aria-pressed', 'true');
    const flip = front.getByRole('button', { name: 'Flip Card' });
    for (let i = 0; i < 10 && document.activeElement !== flip; i++) await user.tab();
    await user.keyboard('{Enter}');
    expect(document.querySelector('[data-flipped="true"]')).toBeInTheDocument();
  });

  it('announces the question number when a new card appears', async () => {
    const user = renderAt('/practice/session', { config });
    await user.keyboard('1fr');
    const live = [...document.querySelectorAll('[aria-live="polite"]')].map((el) => el.textContent);
    // An encouraging message comes first, e.g. "Super! Question 2 of 5."
    expect(live.some((text) => text?.endsWith('Question 2 of 5.'))).toBe(true);
  });
});

describe('shortcut help', () => {
  it('opens with the ? key and with the button, and closes with Esc', async () => {
    const user = renderAt('/practice/session', { config });
    const toggle = screen.getByRole('button', { name: 'Keyboard shortcuts' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.keyboard('?');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('region', { name: 'Keyboard shortcuts' });
    expect(within(panel).getByText('Flip the card')).toBeInTheDocument();
    expect(within(panel).getByText('I got it wrong')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('does not react to shortcuts while the End Session dialog question is open', async () => {
    const user = renderAt('/practice/session', {
      config: { ...config, sessionLength: 'continuous' },
    });
    await user.keyboard('1fr');
    await user.click(screen.getByRole('button', { name: 'End Session' }));
    // Focus is on "Yes, end it"; pressing 2 must not pick an answer
    await user.keyboard('2');
    const choices = screen.getAllByRole('button', { name: /^Choice/ });
    for (const c of choices) expect(c).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('keyboard shortcuts setting', () => {
  it('can be turned off in Settings', async () => {
    const user = renderAt('/settings');
    const toggle = screen.getByRole('switch', { name: /keyboard shortcuts/i });
    expect(toggle).toBeChecked();
    await user.click(toggle);
    expect(appData.loadSettings().keyboardShortcutsEnabled).toBe(false);
  });

  it('when off, the session ignores the keys and hides the help button', async () => {
    appData.saveSettings({ ...DEFAULT_SETTINGS, keyboardShortcutsEnabled: false });
    const user = renderAt('/practice/session', { config });
    await user.keyboard('1');
    expect(screen.getAllByRole('button', { name: /^Choice/ })[0]).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.queryByRole('button', { name: 'Keyboard shortcuts' })).not.toBeInTheDocument();
  });

  it('typing in Settings never triggers card shortcuts', async () => {
    const user = renderAt('/settings');
    // Space on a focused switch toggles it as normal
    const toggle = screen.getByRole('switch', { name: /^animations/i });
    toggle.focus();
    await user.keyboard(' ');
    expect(toggle).not.toBeChecked();
  });
});

describe('discoverability', () => {
  it('the home page mentions keyboard shortcuts when they are on', () => {
    renderAt('/');
    expect(screen.getByText(/practice with your keyboard/i)).toHaveTextContent(
      'Press ? on a flash card',
    );
  });

  it('and hides the tip when they are off', () => {
    appData.saveSettings({ ...DEFAULT_SETTINGS, keyboardShortcutsEnabled: false });
    renderAt('/');
    expect(screen.queryByText(/practice with your keyboard/i)).not.toBeInTheDocument();
  });
});

describe('animations setting', () => {
  it('turning animations off stops movement across the whole app', async () => {
    const user = renderAt('/settings');
    await user.click(screen.getByRole('switch', { name: /^animations/i }));
    expect(document.documentElement.dataset.animations).toBe('off');
    await user.click(screen.getByRole('switch', { name: /^animations/i }));
    expect(document.documentElement.dataset.animations).toBeUndefined();
  });
});
