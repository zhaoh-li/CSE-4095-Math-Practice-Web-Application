import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { DEFAULT_SETTINGS } from '../../config/defaultSettings';
import { appData } from '../../services/appData';
import { TestApp } from '../../test/TestApp';
import type { Question } from '../../types';
import { QuestionCard, type QuestionCardProps } from './QuestionCard';

function makeQuestion(extra: Partial<Question>): Question {
  return {
    id: 'q-1',
    operation: 'multiplication',
    difficulty: 'intermediate',
    firstOperand: 12,
    secondOperand: 7,
    correctAnswer: 84,
    displayText: '12 × 7',
    choices: [77, 84, 91, 72],
    source: 'regular',
    ...extra,
  };
}

function renderCard(question: Question, props: Partial<QuestionCardProps> = {}) {
  const user = userEvent.setup();
  render(<QuestionCard question={question} onResult={vi.fn()} {...props} />);
  return user;
}

const back = () => document.querySelector<HTMLElement>('[data-face="back"]')!;

describe('How to solve it', () => {
  it('is on the back of the card and opens to show the steps', async () => {
    const user = renderCard(makeQuestion({}));
    await user.keyboard('1f');
    const toggle = within(back()).getByRole('button', { name: 'How to solve it' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAccessibleName('Hide how to solve it');
    expect(within(back()).getByText('Break it apart.')).toBeInTheDocument();
    const steps = within(back()).getAllByRole('listitem');
    expect(steps.map((s) => s.textContent)).toEqual([
      '12 × 7 = 10 × 7 + 2 × 7',
      '= 70 + 14',
      '= 84',
    ]);
  });

  it('reads steps as words for screen readers', async () => {
    const user = renderCard(makeQuestion({}));
    await user.keyboard('1f');
    await user.click(screen.getByRole('button', { name: 'How to solve it' }));
    expect(within(back()).getAllByRole('listitem')[0]).toHaveAccessibleName(
      '12 times 7 equals 10 times 7 plus 2 times 7',
    );
  });

  it('shows a dot picture for a small problem', async () => {
    const user = renderCard(
      makeQuestion({
        operation: 'addition',
        difficulty: 'beginner',
        firstOperand: 3,
        secondOperand: 2,
        correctAnswer: 5,
        displayText: '3 + 2',
        choices: [4, 5, 6, 7],
      }),
    );
    await user.keyboard('1f');
    await user.click(screen.getByRole('button', { name: 'How to solve it' }));
    const picture = within(back()).getByRole('img', { name: '3 dots and 2 dots make 5 dots.' });
    expect(picture.querySelectorAll('[class*="dot"]:not([class*="dotGroup"])')).toHaveLength(5);
  });

  it('shows a rule for an "obvious" problem like 1 + 1', async () => {
    const user = renderCard(
      makeQuestion({
        operation: 'addition',
        difficulty: 'beginner',
        firstOperand: 1,
        secondOperand: 1,
        correctAnswer: 2,
        displayText: '1 + 1',
        choices: [1, 2, 3, 4],
      }),
    );
    await user.keyboard('1f');
    await user.click(screen.getByRole('button', { name: 'How to solve it' }));
    expect(within(back()).getByText('Double 1 is 2.')).toBeInTheDocument();
  });

  it('is hidden when the setting is off', async () => {
    const user = renderCard(makeQuestion({}), { showExplanation: false });
    await user.keyboard('1f');
    expect(screen.queryByRole('button', { name: /how to solve it/i })).not.toBeInTheDocument();
  });

  it('starts closed on each new card', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <QuestionCard key="a" question={makeQuestion({})} onResult={vi.fn()} />,
    );
    await user.keyboard('1f');
    await user.click(screen.getByRole('button', { name: 'How to solve it' }));
    rerender(<QuestionCard key="b" question={makeQuestion({ id: 'q-2' })} onResult={vi.fn()} />);
    await user.keyboard('1f');
    expect(screen.getByRole('button', { name: 'How to solve it' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('has no accessibility problems when open', async () => {
    const user = renderCard(makeQuestion({}));
    await user.keyboard('1f');
    await user.click(screen.getByRole('button', { name: 'How to solve it' }));
    const results = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});

describe('Show explanations setting', () => {
  it('controls the button in a real session', async () => {
    appData.saveSettings({ ...DEFAULT_SETTINGS, showExplanations: false });
    const user = userEvent.setup();
    const config = {
      mode: 'regular',
      operations: ['addition'],
      difficulty: 'beginner',
      sessionLength: 5,
    };
    render(<TestApp initialEntries={[{ pathname: '/practice/session', state: { config } }]} />);
    await user.keyboard('1f');
    expect(screen.queryByRole('button', { name: /how to solve it/i })).not.toBeInTheDocument();
  });

  it('is described on the Settings page', () => {
    render(<TestApp initialEntries={['/settings']} />);
    expect(screen.getByRole('switch', { name: /show explanations/i })).toHaveAccessibleDescription(
      /how to solve it/i,
    );
  });
});
