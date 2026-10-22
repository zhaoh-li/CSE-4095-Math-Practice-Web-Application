import { DEFAULT_PRACTICE_CONFIG } from '../config/practiceOptions';
import { describeOperations, isPracticeConfig } from './practiceConfig';

describe('isPracticeConfig', () => {
  it('accepts the default config', () => {
    expect(isPracticeConfig(DEFAULT_PRACTICE_CONFIG)).toBe(true);
  });

  it('accepts continuous practice', () => {
    expect(isPracticeConfig({ ...DEFAULT_PRACTICE_CONFIG, sessionLength: 'continuous' })).toBe(
      true,
    );
  });

  it.each([
    ['null', null],
    ['a string', 'addition'],
    ['no operations', { ...DEFAULT_PRACTICE_CONFIG, operations: [] }],
    ['an unknown operation', { ...DEFAULT_PRACTICE_CONFIG, operations: ['modulo'] }],
    ['an unknown difficulty', { ...DEFAULT_PRACTICE_CONFIG, difficulties: ['expert'] }],
    ['an unsupported length', { ...DEFAULT_PRACTICE_CONFIG, sessionLength: 7 }],
    ['an unknown mode', { ...DEFAULT_PRACTICE_CONFIG, mode: 'race' }],
  ])('rejects %s', (_name, value) => {
    expect(isPracticeConfig(value)).toBe(false);
  });
});

describe('describeOperations', () => {
  it.each([
    [['addition'], 'Addition'],
    [['subtraction', 'addition'], 'Addition and Subtraction'],
    [['division', 'addition', 'multiplication'], 'Addition, Multiplication and Division'],
  ] as const)('describes %j as "%s"', (operations, expected) => {
    expect(describeOperations({ ...DEFAULT_PRACTICE_CONFIG, operations: [...operations] })).toBe(
      expected,
    );
  });
});
