import { MATH_OPERATIONS, type Question } from '../../types';
import { calculateAnswer } from './buildQuestion';

export const CHOICE_COUNT = 4;

const isWholeNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

/** Lists everything wrong with a question. An empty list means the question is valid. */
export function getQuestionErrors(question: Question): string[] {
  const errors: string[] = [];
  const { operation, firstOperand, secondOperand, correctAnswer, choices } = question;

  if (!MATH_OPERATIONS.includes(operation)) errors.push(`unknown operation "${operation}"`);
  if (!isWholeNumber(firstOperand)) errors.push('first operand is not a whole number');
  if (!isWholeNumber(secondOperand)) errors.push('second operand is not a whole number');
  if (operation === 'division' && secondOperand === 0) errors.push('division by zero');
  if (!isWholeNumber(correctAnswer)) errors.push('answer is not a whole number');
  if (
    errors.length === 0 &&
    calculateAnswer(operation, firstOperand, secondOperand) !== correctAnswer
  ) {
    errors.push('answer does not match the operands');
  }
  if (!question.displayText.trim()) errors.push('display text is empty');

  if (!Array.isArray(choices) || choices.length !== CHOICE_COUNT) {
    errors.push(`there must be exactly ${CHOICE_COUNT} choices`);
  } else {
    if (!choices.every(isWholeNumber)) errors.push('a choice is not a whole number');
    if (new Set(choices).size !== choices.length) errors.push('choices are not unique');
    if (choices.filter((c) => c === correctAnswer).length !== 1) {
      errors.push('the correct answer must appear exactly once');
    }
  }

  return errors;
}

export function isValidQuestion(question: Question): boolean {
  return getQuestionErrors(question).length === 0;
}
