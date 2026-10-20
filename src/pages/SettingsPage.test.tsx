import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../AppRoutes';
import { DEFAULT_SETTINGS } from '../config/defaultSettings';
import { appData } from '../services/appData';

function renderAt(path = '/settings') {
  const user = userEvent.setup();
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
  return { user, ...utils };
}

describe('SettingsPage', () => {
  it('shows every setting with its current value', () => {
    renderAt();
    expect(screen.getByRole('radio', { name: 'Standard' })).toBeChecked();
    expect(screen.getByRole('switch', { name: /card animations/i })).toBeChecked();
    expect(screen.getByRole('switch', { name: /sound effects/i })).not.toBeChecked();
    expect(screen.getByRole('switch', { name: /show explanations/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Beginner' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '10 questions' })).toBeChecked();
  });

  it('saves changes automatically', async () => {
    const { user } = renderAt();
    await user.click(screen.getByRole('switch', { name: /card animations/i }));
    await user.click(screen.getByRole('radio', { name: 'Advanced' }));
    await user.click(screen.getByRole('radio', { name: '20 questions' }));
    await user.click(screen.getByRole('checkbox', { name: 'Division' }));

    expect(screen.getByRole('status')).toHaveTextContent('Settings saved.');
    expect(appData.loadSettings()).toMatchObject({
      cardAnimationsEnabled: false,
      defaultDifficulty: 'advanced',
      defaultSessionLength: 20,
      defaultOperations: ['addition', 'division'],
    });
  });

  it.each([
    ['Red-green', 'red-green'],
    ['Blue-yellow', 'blue-yellow'],
    ['High contrast', 'high-contrast'],
  ] as const)('switches the whole app to the %s theme', async (label, mode) => {
    const { user } = renderAt();
    await user.click(screen.getByRole('radio', { name: label }));
    expect(document.documentElement.dataset.colorVision).toBe(mode);
    expect(appData.loadSettings().colorVisionMode).toBe(mode);

    await user.click(screen.getByRole('radio', { name: 'Standard' }));
    expect(document.documentElement.dataset.colorVision).toBeUndefined();
    expect(appData.loadSettings().colorVisionMode).toBe('off');
  });

  it('describes each color theme', () => {
    renderAt();
    expect(screen.getByRole('radio', { name: 'Red-green' })).toHaveAccessibleDescription(
      /protanopia and deuteranopia/i,
    );
    expect(screen.getByRole('radio', { name: 'Blue-yellow' })).toHaveAccessibleDescription(
      /tritanopia/i,
    );
  });

  it('applies the saved color theme when the app starts', () => {
    appData.saveSettings({ ...DEFAULT_SETTINGS, colorVisionMode: 'blue-yellow' });
    renderAt('/');
    expect(document.documentElement.dataset.colorVision).toBe('blue-yellow');
  });

  it('does not save an empty list of default operations', async () => {
    const { user } = renderAt();
    await user.click(screen.getByRole('checkbox', { name: 'Addition' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/pick at least one operation/i);
    expect(appData.loadSettings().defaultOperations).toEqual(['addition']);

    await user.click(screen.getByRole('checkbox', { name: 'Subtraction' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(appData.loadSettings().defaultOperations).toEqual(['subtraction']);
  });

  describe('defaults on the practice setup page', () => {
    it('are used when starting practice', () => {
      appData.saveSettings({
        ...DEFAULT_SETTINGS,
        defaultOperations: ['multiplication', 'division'],
        defaultDifficulty: 'intermediate',
        defaultSessionLength: 'continuous',
      });
      renderAt('/practice/setup');
      expect(screen.getByRole('checkbox', { name: 'Addition' })).not.toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Multiplication' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Division' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'Intermediate' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'Keep going' })).toBeChecked();
    });

    it('can be changed for one session without changing the saved defaults', async () => {
      appData.saveSettings({ ...DEFAULT_SETTINGS, defaultDifficulty: 'easy' });
      const { user } = renderAt('/practice/setup');
      await user.click(screen.getByRole('radio', { name: 'Advanced' }));
      expect(screen.getByRole('radio', { name: 'Advanced' })).toBeChecked();
      expect(appData.loadSettings().defaultDifficulty).toBe('easy');
    });
  });

  describe('clear all data', () => {
    it('needs the warning box ticked before deleting', async () => {
      const { user } = renderAt();
      await user.click(screen.getByRole('button', { name: 'Clear All Application Data' }));
      const dialog = within(screen.getByRole('alertdialog', { name: /delete all app data/i }));
      const deleteButton = dialog.getByRole('button', { name: 'Delete everything' });

      expect(deleteButton).toBeDisabled();
      await user.click(dialog.getByRole('checkbox', { name: /cannot be undone/i }));
      expect(deleteButton).toBeEnabled();
    });

    it('clears everything, restores defaults, and returns home', async () => {
      appData.saveSettings({
        ...DEFAULT_SETTINGS,
        colorVisionMode: 'high-contrast',
        defaultDifficulty: 'advanced',
      });
      appData.saveAttempt({
        id: 'a1',
        sessionId: 's1',
        questionId: 'q1',
        operation: 'addition',
        difficulty: 'beginner',
        firstOperand: 1,
        secondOperand: 2,
        correctAnswer: 3,
        selectedAnswer: 3,
        result: 'correct',
        source: 'regular',
        answeredAt: '2026-10-20T12:00:00.000Z',
      });
      window.localStorage.setItem('someOtherApp', 'keep me');

      const { user } = renderAt();
      await user.click(screen.getByRole('button', { name: 'Clear All Application Data' }));
      await user.click(screen.getByRole('checkbox', { name: /cannot be undone/i }));
      await user.click(screen.getByRole('button', { name: 'Delete everything' }));

      expect(appData.loadAttempts()).toEqual([]);
      expect(appData.loadSettings()).toEqual(DEFAULT_SETTINGS);
      expect(window.localStorage.getItem('someOtherApp')).toBe('keep me');
      expect(document.documentElement.dataset.colorVision).toBeUndefined();
      expect(screen.getByRole('heading', { level: 1, name: /welcome/i })).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(/all app data was cleared/i);
    });
  });
});
