import { render, screen } from '@testing-library/react';
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
  render(<QuestionCard question={question} onResult={onResult} {...props} />);
  return { user, onResult };
}

const choice = (value: number) => screen.getByRole('button', { name: new RegExp(`: ${value}$`) });
const isFlipped = () => document.querySelector('[data-flipped="true"]') !== null;

describe('flash card keyboard shortcuts', () => {
  it('number keys 1–4 pick the matching answer', async () => {
    const { user } = renderCard();
    await user.keyboard('3');
    expect(choice(63)).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard('1');
    expect(choice(54)).toHaveAttribute('aria-pressed', 'true');
    expect(choice(63)).toHaveAttribute('aria-pressed', 'false');
  });

  it('F flips the card only after an answer is picked', async () => {
    const { user } = renderCard();
    await user.keyboard('f');
    expect(isFlipped()).toBe(false);
    await user.keyboard('2');
    await user.keyboard('F');
    expect(isFlipped()).toBe(true);
  });

  it('Enter flips the card when no button has focus', async () => {
    const { user } = renderCard();
    await user.keyboard('2');
    screen.getByRole('heading', { name: /what is/i }).focus();
    await user.keyboard('{Enter}');
    expect(isFlipped()).toBe(true);
  });

  it('Enter on a focused answer button picks it instead of flipping', async () => {
    const { user } = renderCard();
    await user.keyboard('1');
    choice(63).focus();
    await user.keyboard('{Enter}');
    expect(choice(63)).toHaveAttribute('aria-pressed', 'true');
    expect(isFlipped()).toBe(false);
  });

  it('R reports "right" and W reports "wrong" on the back', async () => {
    const right = renderCard();
    await right.user.keyboard('2f');
    await right.user.keyboard('r');
    expect(right.onResult).toHaveBeenCalledWith('correct', 56);
  });

  it('W reports "wrong"', async () => {
    const { user, onResult } = renderCard();
    await user.keyboard('4f');
    await user.keyboard('w');
    expect(onResult).toHaveBeenCalledWith('incorrect', 48);
  });

  it('each key only works on its own side of the card', async () => {
    const { user, onResult } = renderCard();
    // R and W do nothing on the front
    await user.keyboard('r');
    await user.keyboard('w');
    expect(onResult).not.toHaveBeenCalled();
    // Number keys do nothing on the back
    await user.keyboard('1f');
    await user.keyboard('3');
    expect(screen.getByText(/you picked:/i)).toHaveTextContent('You picked: 54');
  });

  it('only reports once, even if R and W are both pressed', async () => {
    const { user, onResult } = renderCard();
    await user.keyboard('1f');
    await user.keyboard('rw');
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it('ignores keys pressed with Ctrl, so browser shortcuts still work', async () => {
    const { user } = renderCard();
    await user.keyboard('{Control>}2{/Control}');
    expect(choice(56)).toHaveAttribute('aria-pressed', 'false');
  });

  it('announces what happened for screen readers', async () => {
    const { user } = renderCard();
    const live = document.querySelector('[aria-live="polite"]')!;
    await user.keyboard('2');
    expect(live).toHaveTextContent('You picked 56.');
    await user.keyboard('f');
    expect(live).toHaveTextContent('You picked 56. Did you get it right?');
    await user.keyboard('r');
    expect(live).toHaveTextContent('Marked as right.');
  });

  describe('discoverability', () => {
    it('shows key badges and a tip, and tells assistive tech about the keys', () => {
      renderCard();
      const flip = screen.getByRole('button', { name: 'Flip Card' });
      expect(flip).toHaveAttribute('aria-keyshortcuts', 'F Enter');
      expect(flip.querySelector('kbd')).toHaveTextContent('F');
      expect(choice(54)).toHaveAttribute('aria-keyshortcuts', '1');
      expect(screen.getByText(/to pick, then/i)).toHaveTextContent(
        'Press 1–4 to pick, then F to flip.',
      );
      expect(screen.getByRole('button', { name: /I Got It Right/, hidden: true })).toHaveAttribute(
        'aria-keyshortcuts',
        'R',
      );
    });

    it('keeps button names clean (badges are not read as part of the name)', () => {
      renderCard();
      expect(screen.getByRole('button', { name: 'Flip Card' })).toBeInTheDocument();
    });
  });

  describe('when shortcuts are turned off', () => {
    it('ignores the keys and hides all hints', async () => {
      const { user } = renderCard({ shortcutsEnabled: false });
      await user.keyboard('2f');
      expect(choice(56)).toHaveAttribute('aria-pressed', 'false');
      expect(isFlipped()).toBe(false);
      expect(document.querySelector('kbd')).toBeNull();
      expect(screen.getByRole('button', { name: 'Flip Card' })).not.toHaveAttribute(
        'aria-keyshortcuts',
      );
      expect(screen.getByText('Pick an answer, then flip!')).toBeInTheDocument();
    });
  });
});
