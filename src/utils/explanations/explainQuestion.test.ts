import { DIFFICULTY_LEVELS, MATH_OPERATIONS, type MathOperation } from '../../types';
import { calculateAnswer, formatNumber } from '../questions/buildQuestion';
import { OPERATION_GENERATORS } from '../questions/operations';
import { createSeededRandom } from '../random';
import { explainQuestion, speakMath, type Explanation } from './explainQuestion';

const facts = (operation: MathOperation, a: number, b: number) => ({
  operation,
  firstOperand: a,
  secondOperand: b,
  correctAnswer: calculateAnswer(operation, a, b),
});

const linesOf = (e: Explanation) => ('lines' in e ? e.lines : []);

describe('break-apart strategies from the plan', () => {
  it.each<[MathOperation, number, number, string, string[]]>([
    // Easy
    ['addition', 8, 5, 'Make a ten.', ['8 + 5 = 8 + 2 + 3', '= 10 + 3', '= 13']],
    ['subtraction', 14, 6, 'Count back through 10.', ['14 − 6 = 14 − 4 − 2', '= 10 − 2', '= 8']],
    ['multiplication', 6, 7, 'Use a fact you know.', ['6 × 7 = 5 × 7 + 7', '= 35 + 7', '= 42']],
    [
      'division',
      42,
      6,
      'Think multiplication.',
      ['42 ÷ 6 → 6 × ? = 42', '6 × 7 = 42', 'So 42 ÷ 6 = 7'],
    ],
    // Intermediate
    [
      'addition',
      47,
      38,
      'Add the tens, then the ones.',
      ['47 + 38 = (40 + 30) + (7 + 8)', '= 70 + 15', '= 85'],
    ],
    [
      'subtraction',
      82,
      37,
      'Split the second number.',
      ['82 − 37 = 82 − 30 − 7', '= 52 − 7', '= 45'],
    ],
    ['multiplication', 12, 7, 'Break it apart.', ['12 × 7 = 10 × 7 + 2 × 7', '= 70 + 14', '= 84']],
    [
      'division',
      96,
      8,
      'Split the big number into easy parts.',
      ['96 ÷ 8 = 80 ÷ 8 + 16 ÷ 8', '= 10 + 2', '= 12'],
    ],
    // Advanced
    [
      'addition',
      456,
      378,
      'Add the hundreds, tens, and ones.',
      ['456 + 378 = (400 + 300) + (50 + 70) + (6 + 8)', '= 700 + 120 + 14', '= 834'],
    ],
    [
      'subtraction',
      603,
      298,
      'Round, then fix.',
      ['603 − 298 = 603 − 300 + 2', '= 303 + 2', '= 305'],
    ],
    [
      'multiplication',
      47,
      6,
      'Break it apart.',
      ['47 × 6 = 40 × 6 + 7 × 6', '= 240 + 42', '= 282'],
    ],
    [
      'division',
      282,
      6,
      'Split the big number into easy parts.',
      ['282 ÷ 6 = 240 ÷ 6 + 42 ÷ 6', '= 40 + 7', '= 47'],
    ],
  ])('%s %i, %i uses "%s"', (operation, a, b, title, lines) => {
    const explanation = explainQuestion(facts(operation, a, b));
    expect(explanation.kind).toBe('steps');
    expect(explanation.title).toBe(title);
    expect(linesOf(explanation)).toEqual(lines);
  });

  it('keeps the question order in the first line (5 + 8, not 8 + 5)', () => {
    expect(linesOf(explainQuestion(facts('addition', 5, 8)))[0]).toBe('5 + 8 = 8 + 2 + 3');
  });

  it('keeps the factor order when the big number comes second', () => {
    expect(linesOf(explainQuestion(facts('multiplication', 6, 47)))[0]).toBe(
      '6 × 47 = 6 × 40 + 6 × 7',
    );
  });

  it('counts whole tens like objects', () => {
    expect(linesOf(explainQuestion(facts('addition', 40, 30)))).toEqual([
      '40 + 30 → 4 tens + 3 tens = 7 tens',
      '= 70',
    ]);
  });

  it('hops back by tens when only tens are taken away', () => {
    expect(linesOf(explainQuestion(facts('subtraction', 82, 30)))).toEqual([
      '82 − 30 → take away 3 tens',
      '82 → 72 → 62 → 52',
      '= 52',
    ]);
  });

  it('formats big numbers with commas', () => {
    expect(linesOf(explainQuestion(facts('subtraction', 1000, 298))).join(' ')).toContain('1,000');
  });
});

describe('rules for small and special problems', () => {
  it.each<[MathOperation, number, number, string]>([
    ['addition', 0, 1, "Adding 0 doesn't change a number."],
    ['addition', 7, 0, "Adding 0 doesn't change a number."],
    ['addition', 1, 1, 'Double 1 is 2.'],
    ['addition', 6, 6, 'Double 6 is 12.'],
    ['subtraction', 9, 0, "Taking away 0 doesn't change a number."],
    ['subtraction', 5, 5, 'A number minus itself is 0.'],
    ['multiplication', 0, 7, 'Anything times 0 is 0.'],
    ['multiplication', 8, 1, 'Anything times 1 is itself.'],
    ['division', 0, 4, '0 divided by any number is 0.'],
    ['division', 9, 1, 'Dividing by 1 keeps a number the same.'],
    ['division', 7, 7, 'A number divided by itself is 1.'],
  ])('%s %i, %i → "%s"', (operation, a, b, title) => {
    const explanation = explainQuestion(facts(operation, a, b));
    expect(explanation).toMatchObject({ kind: 'rule', title });
  });

  it('multiples of 10: take off the zeros, multiply, put them back', () => {
    expect(explainQuestion(facts('multiplication', 20, 10))).toEqual({
      kind: 'rule',
      title: 'Take off the zeros, multiply, then put them back.',
      lines: ['20 × 10 → 2 × 1 = 2', 'Put back 2 zeros: 200'],
    });
    expect(linesOf(explainQuestion(facts('multiplication', 30, 4)))).toEqual([
      '30 × 4 → 3 × 4 = 12',
      'Put back the zero: 120',
    ]);
  });
});

describe('pictures for small problems', () => {
  it('addition up to 10 shows two groups of dots', () => {
    expect(explainQuestion(facts('addition', 3, 2))).toMatchObject({
      kind: 'picture',
      picture: { type: 'add', first: 3, second: 2 },
      caption: '3 dots and 2 dots make 5 dots.',
    });
  });

  it('subtraction from up to 10 crosses dots out', () => {
    expect(explainQuestion(facts('subtraction', 7, 3))).toMatchObject({
      kind: 'picture',
      picture: { type: 'subtract', total: 7, takeAway: 3 },
    });
  });

  it('small times tables show rows of dots', () => {
    expect(explainQuestion(facts('multiplication', 3, 4))).toMatchObject({
      kind: 'picture',
      picture: { type: 'groups', mode: 'rows', groups: 3, perGroup: 4 },
    });
  });

  it('small division shares dots into equal groups', () => {
    expect(explainQuestion(facts('division', 12, 3))).toMatchObject({
      kind: 'picture',
      picture: { type: 'groups', mode: 'share', groups: 3, perGroup: 4 },
      caption: 'Share 12 dots into 3 equal groups. Each group gets 4.',
    });
  });

  it('bigger problems use steps instead of pictures', () => {
    expect(explainQuestion(facts('addition', 8, 5)).kind).toBe('steps');
    expect(explainQuestion(facts('multiplication', 6, 7)).kind).toBe('steps');
    expect(explainQuestion(facts('division', 42, 6)).kind).toBe('steps');
  });
});

/** Works out the math in a step like "= 70 + 15" or "47 + 38 = (40 + 30) + (7 + 8)". */
function evaluate(expression: string): number {
  const js = expression.replace(/,/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  if (!/^[\d\s+\-*/()]+$/.test(js)) throw new Error(`Not plain math: ${expression}`);
  return Function(`"use strict"; return (${js});`)() as number;
}

describe('every explanation is correct', () => {
  it('for thousands of random questions at every level and operation', () => {
    const random = createSeededRandom(2026);
    for (const operation of MATH_OPERATIONS) {
      for (const difficulty of DIFFICULTY_LEVELS) {
        for (let i = 0; i < 250; i++) {
          const q = OPERATION_GENERATORS[operation](difficulty, random);
          const explanation = explainQuestion(q);
          const answer = formatNumber(q.correctAnswer);

          if (explanation.kind === 'picture') {
            expect(explanation.caption).toContain(String(q.correctAnswer));
            continue;
          }
          const lines = explanation.lines;
          expect(lines.length).toBeGreaterThan(0);
          expect(lines.length).toBeLessThanOrEqual(4);
          // The last line always shows the answer
          expect(lines.at(-1)).toMatch(new RegExp(`${answer.replace(',', '\\,')}$`));

          // Each step must be true. Steps that continue from the question (the
          // first line, and lines starting with "=") must equal the answer.
          lines.forEach((line, index) => {
            if (line.includes('→') || /[a-z?]/i.test(line)) return;
            const sides = line
              .split('=')
              .map((side) => side.trim())
              .filter(Boolean);
            const values = sides.map(evaluate);
            expect({ line, allEqual: values.every((v) => v === values[0]) }).toEqual({
              line,
              allEqual: true,
            });
            const continuesFromQuestion = index === 0 || line.startsWith('=');
            if (continuesFromQuestion) {
              expect({ line, value: values[0] }).toEqual({ line, value: q.correctAnswer });
            }
          });
        }
      }
    }
  });
});

describe('speakMath', () => {
  it('reads math symbols as words for screen readers', () => {
    expect(speakMath('47 + 38 = (40 + 30) + (7 + 8)')).toBe(
      '47 plus 38 equals 40 plus 30 plus 7 plus 8',
    );
    expect(speakMath('42 ÷ 6 → 6 × ? = 42')).toBe('42 divided by 6 , then 6 times what equals 42');
    expect(speakMath('14 − 6')).toBe('14 minus 6');
  });
});
