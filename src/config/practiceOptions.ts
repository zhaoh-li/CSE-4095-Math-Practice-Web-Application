import type { DifficultyLevel, MathOperation, PracticeConfig, SessionLength } from '../types';

export interface OperationInfo {
  label: string;
  symbol: string;
}

export const OPERATION_INFO: Record<MathOperation, OperationInfo> = {
  addition: { label: 'Addition', symbol: '+' },
  subtraction: { label: 'Subtraction', symbol: '−' },
  multiplication: { label: 'Multiplication', symbol: '×' },
  division: { label: 'Division', symbol: '÷' },
};

export interface DifficultyInfo {
  level: number;
  label: string;
  description: string;
}

// Descriptions are kid-facing. The exact number ranges are set in Phase 4.
export const DIFFICULTY_INFO: Record<DifficultyLevel, DifficultyInfo> = {
  beginner: { level: 1, label: 'Beginner', description: 'Small numbers up to 10.' },
  easy: { level: 2, label: 'Easy', description: 'Numbers up to 20.' },
  intermediate: {
    level: 3,
    label: 'Intermediate',
    description: 'Numbers up to 100 and times tables to 10.',
  },
  advanced: {
    level: 4,
    label: 'Advanced',
    description: 'Bigger numbers and times tables to 12.',
  },
};

export interface SessionLengthOption {
  value: SessionLength;
  label: string;
  description: string;
}

export const SESSION_LENGTH_OPTIONS: SessionLengthOption[] = [
  { value: 5, label: '5 questions', description: 'A quick warm-up.' },
  { value: 10, label: '10 questions', description: 'A short practice.' },
  { value: 20, label: '20 questions', description: 'A full workout.' },
  { value: 'continuous', label: 'Keep going', description: 'No limit. Stop when you like.' },
];

export const DEFAULT_PRACTICE_CONFIG: PracticeConfig = {
  mode: 'regular',
  operations: ['addition'],
  difficulty: 'beginner',
  sessionLength: 10,
};
