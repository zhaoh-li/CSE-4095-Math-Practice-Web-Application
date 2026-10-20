import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Question } from '../../types';
import { QuestionCard, type QuestionCardProps } from './QuestionCard';

const question: Question = {
  id: 'q-1',
  operation: 'multiplication',
  difficulty: 'easy',
  firstOperand: 7,
  secondOperand: 8,
  correctAnswer: 56,
  displayText: '7 × 8',
  choices: [54, 56, 63, 48],
  source: 'regular',
};

function renderCard(props: Partial<QuestionCardProps> = {}) {
  const user = userEvent.setup();
  const onResult = vi.fn();
  const utils = render(
    <QuestionCard
      question={question}
      questionNumber={3}
      totalQuestions={10}
      onResult={onResult}
      {...props}
    />,
  );
  return { user, onResult, ...utils };
}

// Query faces by data attribute: hidden regions have no accessible name
const front = () => document.querySelector<HTMLElement>('[data-face="front"]')!;
const back = () => document.querySelector<HTMLElement>('[data-face="back"]')!;
const choice = (value: number) => screen.getByRole('button', { name: new RegExp(`: ${value}$`) });
const flipButton = () => screen.getByRole('button', { name: 'Flip Card' });

describe('QuestionCard front', () => {
  it('shows the question, its number, the total, and four choices', () => {
    renderCard();
    expect(screen.getByText('Question 3 of 10')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What is 7 times 8?' })).toHaveTextContent(
      '7 × 8 = ?',
    );
    const choices = within(screen.getByRole('group', { name: 'Answer choices' })).getAllByRole(
      'button',
    );
    expect(choices.map((c) => c.textContent)).toEqual(['154✓', '256✓', '363✓', '448✓']);
  });

  it('shows only the question number in continuous practice', () => {
    renderCard({ totalQuestions: null, questionNumber: 12 });
    expect(screen.getByText('Question 12')).toBeInTheDocument();
  });

  it('gives each choice an accessible label', () => {
    renderCard();
    expect(screen.getByRole('button', { name: 'Choice 2: 56' })).toBeInTheDocument();
  });

  it('keeps Flip Card disabled until an answer is picked', async () => {
    const { user } = renderCard();
    expect(flipButton()).toBeDisabled();
    await user.click(choice(63));
    expect(flipButton()).toBeEnabled();
  });

  it('highlights the selected answer and lets it be changed before flipping', async () => {
    const { user } = renderCard();
    await user.click(choice(63));
    expect(choice(63)).toHaveAttribute('aria-pressed', 'true');
    await user.click(choice(56));
    expect(choice(56)).toHaveAttribute('aria-pressed', 'true');
    expect(choice(63)).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('QuestionCard flipping', () => {
  it('shows the front first and the back after flipping', async () => {
    const { user } = renderCard();
    expect(front()).not.toHaveAttribute('aria-hidden', 'true');
    expect(back()).toHaveAttribute('aria-hidden', 'true');

    await user.click(choice(54));
    await user.click(flipButton());

    expect(front()).toHaveAttribute('aria-hidden', 'true');
    expect(back()).not.toHaveAttribute('aria-hidden', 'true');
  });

  it('shows the question, correct answer, and the student answer on the back', async () => {
    const { user } = renderCard();
    await user.click(choice(54));
    await user.click(flipButton());

    const backFace = within(back());
    expect(backFace.getByRole('heading', { name: '7 times 8 equals 56' })).toHaveTextContent(
      '7 × 8 = 56',
    );
    expect(backFace.getByText(/you picked/i)).toHaveTextContent('You picked: 54');
  });

  it('moves keyboard focus to the back after flipping', async () => {
    const { user } = renderCard();
    await user.click(choice(54));
    await user.click(flipButton());
    expect(within(back()).getByRole('heading')).toHaveFocus();
  });

  it('locks the answer choices after flipping', async () => {
    const { user } = renderCard();
    await user.click(choice(54));
    await user.click(flipButton());
    const hiddenChoices = within(front()).getAllByRole('button', {
      name: /^Choice/,
      hidden: true,
    });
    for (const button of hiddenChoices) expect(button).toBeDisabled();
    expect(front()).toHaveAttribute('inert');
  });

  it('works the same with animations turned off', async () => {
    const { user, container } = renderCard({ animationsEnabled: false });
    await user.click(choice(56));
    await user.click(flipButton());
    expect(container.querySelector('[data-flipped="true"]')).toBeInTheDocument();
    expect(back()).not.toHaveAttribute('aria-hidden', 'true');
  });
});

describe('QuestionCard self-report', () => {
  it.each([
    ['I Got It Right', 'correct'],
    ['I Got It Wrong', 'incorrect'],
  ])('reports "%s" once with the selected answer', async (label, result) => {
    const { user, onResult } = renderCard();
    await user.click(choice(63));
    await user.click(flipButton());
    await user.click(screen.getByRole('button', { name: label }));

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(result, 63);
  });

  it('prevents reporting both results for the same question', async () => {
    const { user, onResult } = renderCard();
    await user.click(choice(56));
    await user.click(flipButton());
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }));

    expect(screen.getByRole('button', { name: 'I Got It Wrong' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }));
    expect(onResult).toHaveBeenCalledTimes(1);
  });
});

describe('QuestionCard reset', () => {
  it('starts fresh when given a new question', async () => {
    const { user, rerender } = renderCard();
    await user.click(choice(56));
    await user.click(flipButton());

    const next: Question = {
      ...question,
      id: 'q-2',
      firstOperand: 6,
      displayText: '6 × 8',
      correctAnswer: 48,
      choices: [42, 48, 54, 56],
    };
    rerender(
      <QuestionCard
        key={next.id}
        question={next}
        questionNumber={4}
        totalQuestions={10}
        onResult={vi.fn()}
      />,
    );

    expect(screen.getByText('Question 4 of 10')).toBeInTheDocument();
    expect(back()).toHaveAttribute('aria-hidden', 'true');
    expect(flipButton()).toBeDisabled();
    for (const button of within(front()).getAllByRole('button', { name: /^Choice/ })) {
      expect(button).toHaveAttribute('aria-pressed', 'false');
    }
  });
});
