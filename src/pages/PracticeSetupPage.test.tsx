import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../AppRoutes';

function renderSetup() {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/practice/setup']}>
      <AppRoutes />
    </MemoryRouter>,
  );
  return user;
}

const startButton = () => screen.getByRole('button', { name: 'Start Session' });

describe('PracticeSetupPage', () => {
  it('starts with sensible defaults', () => {
    renderSetup();
    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Subtraction' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Beginner' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '10 questions' })).toBeChecked();
    expect(startButton()).toBeEnabled();
  });

  it('allows more than one operation to be selected', async () => {
    const user = renderSetup();
    await user.click(screen.getByRole('checkbox', { name: 'Multiplication' }));
    await user.click(screen.getByRole('checkbox', { name: 'Division' }));
    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Multiplication' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Division' })).toBeChecked();
  });

  it('selects and clears all operations with the shortcut', async () => {
    const user = renderSetup();
    await user.click(screen.getByRole('button', { name: 'Select all' }));
    for (const name of ['Addition', 'Subtraction', 'Multiplication', 'Division']) {
      expect(screen.getByRole('checkbox', { name })).toBeChecked();
    }
    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(screen.getByRole('checkbox', { name: 'Addition' })).not.toBeChecked();
  });

  it('disables Start and explains why when no operation is selected', async () => {
    const user = renderSetup();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Addition' }));
    expect(startButton()).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(/pick at least one operation/i);
  });

  it('allows only one difficulty level, with a description for each', async () => {
    const user = renderSetup();
    const advanced = screen.getByRole('radio', { name: 'Advanced' });
    await user.click(advanced);
    expect(advanced).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Beginner' })).not.toBeChecked();
    expect(advanced).toHaveAccessibleDescription(/numbers up to 1,000/i);
  });

  it('can be used with the keyboard', async () => {
    const user = renderSetup();
    screen.getByRole('checkbox', { name: 'Subtraction' }).focus();
    await user.keyboard(' ');
    expect(screen.getByRole('checkbox', { name: 'Subtraction' })).toBeChecked();

    screen.getByRole('radio', { name: 'Beginner' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Easy' })).toBeChecked();
  });

  it('passes the chosen settings to the practice session', async () => {
    const user = renderSetup();
    await user.click(screen.getByRole('checkbox', { name: 'Subtraction' }));
    await user.click(screen.getByRole('radio', { name: 'Intermediate' }));
    await user.click(screen.getByRole('radio', { name: 'Keep going' }));
    await user.click(startButton());

    expect(screen.getByRole('heading', { level: 1, name: 'Practice Session' })).toBeInTheDocument();
    // "Keep going" shows no total
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    // Only addition or subtraction, at intermediate level (numbers 10–100)
    const problem = screen.getByRole('heading', { level: 2, name: /^What is/ });
    expect(problem.textContent).toMatch(/^\d+ [+−] \d+ = \?$/);
  });
});

describe('PracticeSessionPage without setup', () => {
  it('sends the student back to setup', () => {
    render(
      <MemoryRouter initialEntries={['/practice/session']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Go to Practice Setup' })).toHaveAttribute(
      'href',
      '/practice/setup',
    );
  });
});
