import type { MathOperation } from '../../types';
import { formatNumber, type QuestionFacts } from '../questions/buildQuestion';

/** Dots to draw for small problems. */
export type ExplanationPicture =
  | { type: 'add'; first: number; second: number }
  | { type: 'subtract'; total: number; takeAway: number }
  /** × as rows of dots, ÷ as dots shared into equal groups. */
  | { type: 'groups'; mode: 'rows' | 'share'; groups: number; perGroup: number };

export type Explanation =
  /** A rule worth remembering, e.g. "Anything times 1 is itself." */
  | { kind: 'rule'; title: string; lines: string[] }
  /** Count the dots. */
  | { kind: 'picture'; title: string; picture: ExplanationPicture; caption: string }
  /** Break the problem into smaller steps. */
  | { kind: 'steps'; title: string; lines: string[] };

const n = formatNumber;
const SYMBOL: Record<MathOperation, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
};

/** Joins non-zero terms with +, e.g. [40, 0, 7] → "40 + 7". */
const sumOf = (terms: number[]) =>
  terms
    .filter((t) => t !== 0)
    .map(n)
    .join(' + ') || '0';

/** "(40 + 30)" with brackets only when there is more than one term. */
const group = (terms: number[]) => {
  const nonZero = terms.filter((t) => t !== 0);
  return nonZero.length > 1 ? `(${sumOf(nonZero)})` : sumOf(nonZero);
};

/** Removes repeated lines (e.g. when a step adds nothing new). */
const tidy = (lines: string[]) => lines.filter((line, i) => line !== lines[i - 1]);

/** Splits a number into hundreds, tens, and ones values: 456 → [400, 50, 6]. */
const placeValues = (value: number) => [
  Math.floor(value / 100) * 100,
  Math.floor((value % 100) / 10) * 10,
  value % 10,
];

// ---------- Rules (checked first, at every level) ----------

function ruleFor({
  operation,
  firstOperand: a,
  secondOperand: b,
  correctAnswer: c,
}: QuestionFacts): Explanation | null {
  const rule = (title: string, example: string): Explanation => ({
    kind: 'rule',
    title,
    lines: [example],
  });
  const fact = `${n(a)} ${SYMBOL[operation]} ${n(b)} = ${n(c)}`;

  switch (operation) {
    case 'addition':
      if (a === 0 || b === 0) return rule("Adding 0 doesn't change a number.", fact);
      if (a === b) return rule(`Double ${n(a)} is ${n(c)}.`, fact);
      return null;
    case 'subtraction':
      if (b === 0) return rule("Taking away 0 doesn't change a number.", fact);
      if (a === b) return rule('A number minus itself is 0.', fact);
      return null;
    case 'multiplication':
      if (a === 0 || b === 0) return rule('Anything times 0 is 0.', fact);
      if (a === 1 || b === 1) return rule('Anything times 1 is itself.', fact);
      return multiplesOfTen(a, b, c);
    case 'division':
      if (a === 0) return rule('0 divided by any number is 0.', fact);
      if (b === 1) return rule('Dividing by 1 keeps a number the same.', fact);
      if (a === b) return rule('A number divided by itself is 1.', fact);
      return null;
  }
}

/** 30 × 4 → 3 × 4 = 12 → put the zero back → 120. Also 20 × 10 → 2 × 1 = 2 → 200. */
function multiplesOfTen(a: number, b: number, c: number): Explanation | null {
  const trailingZeros = (value: number) => {
    let zeros = 0;
    while (value >= 10 && value % 10 === 0) {
      value /= 10;
      zeros += 1;
    }
    return { core: value, zeros };
  };
  const first = trailingZeros(a);
  const second = trailingZeros(b);
  const zeros = first.zeros + second.zeros;
  if (zeros === 0) return null;
  const coreProduct = first.core * second.core;
  return {
    kind: 'rule',
    title: 'Take off the zeros, multiply, then put them back.',
    lines: [
      `${n(a)} × ${n(b)} → ${n(first.core)} × ${n(second.core)} = ${n(coreProduct)}`,
      `Put back ${zeros === 1 ? 'the zero' : `${zeros} zeros`}: ${n(c)}`,
    ],
  };
}

// ---------- Pictures (small, Beginner-sized problems) ----------

function pictureFor({
  operation,
  firstOperand: a,
  secondOperand: b,
  correctAnswer: c,
}: QuestionFacts): Explanation | null {
  switch (operation) {
    case 'addition':
      if (c > 10) return null;
      return {
        kind: 'picture',
        title: 'Count all the dots.',
        picture: { type: 'add', first: a, second: b },
        caption: `${a} dots and ${b} dots make ${c} dots.`,
      };
    case 'subtraction':
      if (a > 10) return null;
      return {
        kind: 'picture',
        title: 'Take some dots away and count what is left.',
        picture: { type: 'subtract', total: a, takeAway: b },
        caption: `Start with ${a} dots and take away ${b}. ${c} are left.`,
      };
    case 'multiplication':
      if (Math.min(a, b) > 5 || Math.max(a, b) > 10) return null;
      return {
        kind: 'picture',
        title: 'Count the rows of dots.',
        picture: { type: 'groups', mode: 'rows', groups: a, perGroup: b },
        caption: `${a} rows of ${b} dots make ${c} dots.`,
      };
    case 'division':
      if (b > 5 || c > 10) return null;
      return {
        kind: 'picture',
        title: 'Share the dots into equal groups.',
        picture: { type: 'groups', mode: 'share', groups: b, perGroup: c },
        caption: `Share ${a} dots into ${b} equal groups. Each group gets ${c}.`,
      };
  }
}

// ---------- Break-apart strategies ----------

function additionSteps(a: number, b: number, c: number): Explanation {
  // Easy: make a ten (both single digits, answer over 10)
  if (a < 10 && b < 10) {
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    const need = 10 - big;
    return {
      kind: 'steps',
      title: 'Make a ten.',
      lines: [
        `${a} + ${b} = ${big} + ${need} + ${small - need}`,
        `= 10 + ${small - need}`,
        `= ${c}`,
      ],
    };
  }
  const [aH, aT, aO] = placeValues(a);
  const [bH, bT, bO] = placeValues(b);
  // Whole tens or whole hundreds: count them like objects (4 tens + 3 tens = 7 tens)
  const place = a % 100 === 0 && b % 100 === 0 ? 100 : a % 10 === 0 && b % 10 === 0 ? 10 : 0;
  if (place) {
    const word = place === 100 ? 'hundreds' : 'tens';
    return {
      kind: 'steps',
      title: `Add the ${word}.`,
      lines: [
        `${n(a)} + ${n(b)} → ${a / place} ${word} + ${b / place} ${word} = ${c / place} ${word}`,
        `= ${n(c)}`,
      ],
    };
  }
  // Advanced: hundreds, tens, and ones
  if (a >= 100 || b >= 100) {
    return {
      kind: 'steps',
      title: 'Add the hundreds, tens, and ones.',
      lines: tidy([
        `${n(a)} + ${n(b)} = ${[group([aH, bH]), group([aT, bT]), group([aO, bO])].filter((g) => g !== '0').join(' + ')}`,
        `= ${sumOf([aH + bH, aT + bT, aO + bO])}`,
        `= ${n(c)}`,
      ]),
    };
  }
  // Intermediate: tens and ones
  return {
    kind: 'steps',
    title: 'Add the tens, then the ones.',
    lines: tidy([
      `${n(a)} + ${n(b)} = ${[group([aT, bT]), group([aO, bO])].filter((g) => g !== '0').join(' + ')}`,
      `= ${sumOf([aT + bT, aO + bO])}`,
      `= ${n(c)}`,
    ]),
  };
}

function subtractionSteps(a: number, b: number, c: number): Explanation {
  // Advanced: round and fix when the second number is just under a hundred
  if (b >= 100 && b % 100 >= 90) {
    const rounded = Math.ceil(b / 100) * 100;
    const extra = rounded - b;
    return {
      kind: 'steps',
      title: 'Round, then fix.',
      lines: [
        `${n(a)} − ${n(b)} = ${n(a)} − ${n(rounded)} + ${n(extra)}`,
        `= ${n(a - rounded)} + ${n(extra)}`,
        `= ${n(c)}`,
      ],
    };
  }
  // Easy: count back through 10 (e.g. 14 − 6)
  const ones = a % 10;
  if (b < 10 && b > ones && a >= 10) {
    const rest = b - ones;
    return {
      kind: 'steps',
      title: 'Count back through 10.',
      lines: [
        `${n(a)} − ${b} = ${n(a)} − ${ones} − ${rest}`,
        `= ${n(a - ones)} − ${rest}`,
        `= ${n(c)}`,
      ],
    };
  }
  // A single digit that doesn't cross a ten: just subtract the ones
  if (b < 10) {
    return {
      kind: 'steps',
      title: 'Subtract the ones.',
      lines: [
        `${n(a)} − ${b} = ${n(a - ones)} + (${ones} − ${b})`,
        `= ${n(a - ones)} + ${ones - b}`,
        `= ${n(c)}`,
      ],
    };
  }
  // Intermediate and advanced: split the second number into its places
  const parts = placeValues(b).filter((p) => p !== 0);
  // Only whole tens or hundreds to take away: hop back one at a time (82 − 30: 72, 62, 52)
  if (parts.length === 1) {
    const step = parts[0] >= 100 ? 100 : 10;
    const hops = parts[0] / step;
    const word = step === 100 ? (hops === 1 ? 'hundred' : 'hundreds') : hops === 1 ? 'ten' : 'tens';
    const stops = Array.from({ length: hops + 1 }, (_, i) => n(a - i * step));
    return {
      kind: 'steps',
      title: `Count back by ${step === 100 ? 'hundreds' : 'tens'}.`,
      lines: [`${n(a)} − ${n(b)} → take away ${hops} ${word}`, stops.join(' → '), `= ${n(c)}`],
    };
  }
  const lines = [`${n(a)} − ${n(b)} = ${n(a)} − ${parts.map(n).join(' − ')}`];
  let running = a;
  parts.forEach((part, index) => {
    running -= part;
    const remaining = parts.slice(index + 1);
    lines.push(`= ${[n(running), ...remaining.map(n)].join(' − ')}`);
  });
  return { kind: 'steps', title: 'Split the second number.', lines: tidy(lines) };
}

function multiplicationSteps(a: number, b: number, c: number): Explanation {
  // Intermediate and advanced: break apart the bigger factor into tens and ones
  if (Math.max(a, b) > 10) {
    const bigIsFirst = a >= b;
    const big = bigIsFirst ? a : b;
    const small = bigIsFirst ? b : a;
    const tens = Math.floor(big / 10) * 10;
    const ones = big % 10;
    const term = (part: number) => (bigIsFirst ? `${n(part)} × ${small}` : `${small} × ${n(part)}`);
    return {
      kind: 'steps',
      title: 'Break it apart.',
      lines: [
        `${n(a)} × ${n(b)} = ${term(tens)} + ${term(ones)}`,
        `= ${n(tens * small)} + ${n(ones * small)}`,
        `= ${n(c)}`,
      ],
    };
  }
  // Easy: use a fact you know. Nines are 10 times, minus one group.
  if (a === 9 || b === 9) {
    const other = a === 9 ? b : a;
    return {
      kind: 'steps',
      title: 'Use a fact you know: 10 times, then take one away.',
      lines: [`${a} × ${b} = 10 × ${other} − ${other}`, `= ${10 * other} − ${other}`, `= ${c}`],
    };
  }
  // Otherwise use the 5 times table: 6 × 7 = 5 × 7 + 7
  const split = a >= 6 ? a : b;
  const other = split === a ? b : a;
  const extra = split - 5;
  const extraTerm = extra === 1 ? `${other}` : `${extra} × ${other}`;
  return {
    kind: 'steps',
    title: 'Use a fact you know.',
    lines: [
      `${a} × ${b} = 5 × ${other} + ${extraTerm}`,
      `= ${5 * other} + ${extra * other}`,
      `= ${c}`,
    ],
  };
}

function divisionSteps(a: number, b: number, c: number): Explanation {
  const tens = Math.floor(c / 10) * 10;
  const ones = c % 10;
  // Intermediate and advanced: split the big number into easy parts
  if (c > 10 && ones !== 0) {
    return {
      kind: 'steps',
      title: 'Split the big number into easy parts.',
      lines: [
        `${n(a)} ÷ ${b} = ${n(tens * b)} ÷ ${b} + ${n(ones * b)} ÷ ${b}`,
        `= ${n(tens)} + ${ones}`,
        `= ${n(c)}`,
      ],
    };
  }
  // Easy: think multiplication
  return {
    kind: 'steps',
    title: 'Think multiplication.',
    lines: [
      `${n(a)} ÷ ${b} → ${b} × ? = ${n(a)}`,
      `${b} × ${n(c)} = ${n(a)}`,
      `So ${n(a)} ÷ ${b} = ${n(c)}`,
    ],
  };
}

/**
 * How to solve a question, chosen from its numbers (not its level label), so
 * review questions and borderline problems still get a sensible explanation:
 *   1. a rule, if one applies (+0, ×1, doubles, multiples of 10, …)
 *   2. a picture, for small Beginner-sized problems
 *   3. a break-apart strategy for that operation
 */
export function explainQuestion(facts: QuestionFacts): Explanation {
  const { operation, firstOperand: a, secondOperand: b, correctAnswer: c } = facts;
  const rule = ruleFor(facts);
  if (rule) return rule;
  const picture = pictureFor(facts);
  if (picture) return picture;
  switch (operation) {
    case 'addition':
      return additionSteps(a, b, c);
    case 'subtraction':
      return subtractionSteps(a, b, c);
    case 'multiplication':
      return multiplicationSteps(a, b, c);
    case 'division':
      return divisionSteps(a, b, c);
  }
}

const SPOKEN_WORDS: [RegExp, string][] = [
  [/×/g, ' times '],
  [/÷/g, ' divided by '],
  [/−/g, ' minus '],
  [/\+/g, ' plus '],
  [/=/g, ' equals '],
  [/→/g, ', then '],
  [/\?/g, ' what '],
  [/[()]/g, ' '],
];

/** A line of math in words for screen readers: "8 + 5" → "8 plus 5". */
export function speakMath(line: string): string {
  return SPOKEN_WORDS.reduce((text, [pattern, word]) => text.replace(pattern, word), line)
    .replace(/\s+/g, ' ')
    .trim();
}
