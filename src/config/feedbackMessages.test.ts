import { createSeededRandom } from '../utils/random';
import { FEEDBACK_MESSAGES, pickFeedbackMessage } from './feedbackMessages';

describe('feedback messages', () => {
  it('never uses shaming words', () => {
    const all = [...FEEDBACK_MESSAGES.correct, ...FEEDBACK_MESSAGES.incorrect]
      .join(' ')
      .toLowerCase();
    for (const word of ['wrong', 'bad', 'fail', 'stupid', 'dumb', 'terrible', 'loser']) {
      expect(all).not.toContain(word);
    }
  });

  it('never shows the same message twice in a row', () => {
    const random = createSeededRandom(1);
    let previous: string | null = null;
    for (let i = 0; i < 200; i++) {
      const message = pickFeedbackMessage(i % 2 ? 'correct' : 'incorrect', previous, random);
      expect(message).not.toBe(previous);
      previous = message;
    }
  });

  it('picks from the right list', () => {
    expect(FEEDBACK_MESSAGES.correct).toContain(pickFeedbackMessage('correct', null));
    expect(FEEDBACK_MESSAGES.incorrect).toContain(pickFeedbackMessage('incorrect', null));
  });

  it('varies the messages', () => {
    const random = createSeededRandom(2);
    const seen = new Set(
      Array.from({ length: 50 }, () => pickFeedbackMessage('correct', null, random)),
    );
    expect(seen.size).toBeGreaterThan(4);
  });
});
