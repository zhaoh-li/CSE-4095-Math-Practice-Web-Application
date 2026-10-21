import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_SETTINGS } from '../config/defaultSettings';
import { appData } from '../services/appData';
import { playCorrectChime } from '../services/sound';
import { TestApp } from '../test/TestApp';

vi.mock('../services/sound', () => ({ playCorrectChime: vi.fn() }));

const config = {
  mode: 'regular',
  operations: ['addition'],
  difficulty: 'beginner',
  sessionLength: 5,
};

function startSession() {
  const user = userEvent.setup();
  render(<TestApp initialEntries={[{ pathname: '/practice/session', state: { config } }]} />);
  return user;
}

beforeEach(() => vi.mocked(playCorrectChime).mockClear());

describe('correct-answer chime', () => {
  it('is on by default', () => {
    expect(DEFAULT_SETTINGS.soundEffectsEnabled).toBe(true);
  });

  it('plays when an answer is marked right', async () => {
    const user = startSession();
    await user.keyboard('1fr');
    expect(playCorrectChime).toHaveBeenCalledTimes(1);
  });

  it('plays when "I Got It Right" is clicked', async () => {
    const user = startSession();
    await user.keyboard('1f');
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }));
    expect(playCorrectChime).toHaveBeenCalledTimes(1);
  });

  it('does not play when an answer is marked wrong', async () => {
    const user = startSession();
    await user.keyboard('1fw');
    expect(playCorrectChime).not.toHaveBeenCalled();
  });

  it('does not play when Sound effects is off', async () => {
    appData.saveSettings({ ...DEFAULT_SETTINGS, soundEffectsEnabled: false });
    const user = startSession();
    await user.keyboard('1fr');
    expect(playCorrectChime).not.toHaveBeenCalled();
  });

  it('can be switched off and on in Settings', async () => {
    const user = userEvent.setup();
    render(<TestApp initialEntries={['/settings']} />);
    const toggle = screen.getByRole('switch', { name: /sound effects/i });
    expect(toggle).toBeChecked();
    expect(toggle).toHaveAccessibleDescription('Play a happy chime when you get an answer right.');
    await user.click(toggle);
    expect(appData.loadSettings().soundEffectsEnabled).toBe(false);
  });
});
