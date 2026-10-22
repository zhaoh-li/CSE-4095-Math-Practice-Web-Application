import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestApp } from '../test/TestApp';

function renderSetup() {
  const user = userEvent.setup();
  render(<TestApp initialEntries={['/practice/setup']} />);
  return user;
}

const startButton = () => screen.getByRole('button', { name: 'Start Session' });

describe('PracticeSetupPage', () => {
  it('starts with sensible defaults', () => {
    renderSetup();
    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Subtraction' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Beginner' })).toBeChecked();
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
    await user.click(screen.getByRole('button', { name: 'Select all operations' }));
    for (const name of ['Addition', 'Subtraction', 'Multiplication', 'Division']) {
      expect(screen.getByRole('checkbox', { name })).toBeChecked();
    }
    await user.click(screen.getByRole('button', { name: 'Clear all operations' }));
    expect(screen.getByRole('checkbox', { name: 'Addition' })).not.toBeChecked();
  });

  it('disables Start and explains why when no operation is selected', async () => {
    const user = renderSetup();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Addition' }));
    expect(startButton()).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(/pick at least one operation/i);
  });

  it('allows several difficulty levels, with a description for each', async () => {
    const user = renderSetup();
    const advanced = screen.getByRole('checkbox', { name: 'Advanced' });
    await user.click(advanced);
    expect(advanced).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Beginner' })).toBeChecked();
    expect(advanced).toHaveAccessibleDescription(/numbers up to 1,000/i);
  });

  it('selects and clears all levels with the shortcut', async () => {
    const user = renderSetup();
    await user.click(screen.getByRole('button', { name: 'Select all levels' }));
    for (const name of ['Beginner', 'Easy', 'Intermediate', 'Advanced']) {
      expect(screen.getByRole('checkbox', { name })).toBeChecked();
    }
    await user.click(screen.getByRole('button', { name: 'Clear all levels' }));
    expect(screen.getByRole('checkbox', { name: 'Beginner' })).not.toBeChecked();
  });

  it('disables Start and explains why when no level is selected', async () => {
    const user = renderSetup();
    await user.click(screen.getByRole('checkbox', { name: 'Beginner' }));
    expect(startButton()).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Pick at least one level to start.');
    await user.click(screen.getByRole('checkbox', { name: 'Addition' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Pick at least one operation and one level to start.',
    );
  });

  it('can be used with the keyboard', async () => {
    const user = renderSetup();
    screen.getByRole('checkbox', { name: 'Subtraction' }).focus();
    await user.keyboard(' ');
    expect(screen.getByRole('checkbox', { name: 'Subtraction' })).toBeChecked();

    screen.getByRole('checkbox', { name: 'Easy' }).focus();
    await user.keyboard(' ');
    expect(screen.getByRole('checkbox', { name: 'Easy' })).toBeChecked();
  });

  it('passes the chosen settings to the practice session', async () => {
    const user = renderSetup();
    await user.click(screen.getByRole('checkbox', { name: 'Subtraction' }));
    await user.click(screen.getByRole('checkbox', { name: 'Intermediate' }));
    await user.click(screen.getByRole('radio', { name: 'Keep going' }));
    await user.click(startButton());

    expect(screen.getByRole('heading', { level: 1, name: 'Practice Session' })).toBeInTheDocument();
    // "Keep going" shows no total
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    // Only addition or subtraction, at the Beginner or Intermediate level
    const problem = screen.getByRole('heading', { level: 2, name: /^What is/ });
    expect(problem.textContent).toMatch(/^\d+ [+−] \d+ = \?$/);
  });
});
