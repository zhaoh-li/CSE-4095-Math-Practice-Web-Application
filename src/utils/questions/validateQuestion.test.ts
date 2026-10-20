import type { Question } from '../../types';
import { getQuestionErrors, isValidQuestion } from './validateQuestion';

const valid: Question = {
  id: 'q1',
  operation: 'division',
  difficulty: 'easy',
  firstOperand: 24,
  secondOperand: 6,
  correctAnswer: 4,
  displayText: '24 ÷ 6',
  choices: [3, 4, 5, 6],
  source: 'regular',
};

describe('getQuestionErrors', () => {
  it('accepts a valid question', () => {
    expect(getQuestionErrors(valid)).toEqual([]);
    expect(isValidQuestion(valid)).toBe(true);
  });

  it.each<[string, Partial<Question>, RegExp]>([
    ['division by zero', { secondOperand: 0, correctAnswer: 0 }, /division by zero/],
    ['a wrong answer', { correctAnswer: 5, choices: [3, 5, 6, 7] }, /does not match/],
    ['a fractional answer', { firstOperand: 25, correctAnswer: 25 / 6 }, /not a whole number/],
    [
      'a negative answer',
      { operation: 'subtraction', firstOperand: 2, secondOperand: 6, correctAnswer: -4 },
      /not a whole number/,
    ],
    ['too few choices', { choices: [4, 5, 6] }, /exactly 4 choices/],
    ['duplicate choices', { choices: [4, 5, 5, 6] }, /not unique/],
    ['a missing correct answer', { choices: [1, 2, 3, 5] }, /exactly once/],
    ['a fractional choice', { choices: [4, 4.5, 5, 6] }, /not a whole number/],
    ['empty display text', { displayText: ' ' }, /display text/],
  ])('rejects %s', (_name, change, message) => {
    const errors = getQuestionErrors({ ...valid, ...change });
    expect(errors.join('; ')).toMatch(message);
  });
});
