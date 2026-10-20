import { DEFAULT_SETTINGS } from '../config/defaultSettings';
import type { PracticeAttempt, PracticeSession } from '../types';
import {
  CURRENT_SCHEMA_VERSION,
  MAX_STORED_SESSIONS,
  STORAGE_KEYS,
  createAppData,
  migrateStorage,
} from './appData';
import { STORAGE_PREFIX, createMemoryStorage, createStorageService } from './storage';

function makeSession(
  id: string,
  startedAt: string,
  extra: Partial<PracticeSession> = {},
): PracticeSession {
  return {
    id,
    mode: 'regular',
    operations: ['addition'],
    difficulty: 'beginner',
    sessionLength: 10,
    currentQuestionIndex: 0,
    attemptedCount: 1,
    correctCount: 1,
    incorrectCount: 0,
    mistakeReviewCount: 0,
    isActive: false,
    startedAt,
    completedAt: startedAt,
    ...extra,
  };
}

function makeAttempt(id: string, extra: Partial<PracticeAttempt> = {}): PracticeAttempt {
  return {
    id,
    sessionId: 's-1',
    questionId: `q-${id}`,
    operation: 'multiplication',
    difficulty: 'easy',
    firstOperand: 3,
    secondOperand: 4,
    correctAnswer: 12,
    selectedAnswer: 12,
    result: 'correct',
    source: 'regular',
    answeredAt: '2026-10-20T12:00:00.000Z',
    ...extra,
  };
}

function setup() {
  const backend = createMemoryStorage();
  const data = createAppData(createStorageService(backend));
  return { backend, data };
}

const raw = (backend: Storage, key: string) => backend.getItem(`${STORAGE_PREFIX}${key}`);

describe('settings', () => {
  it('uses defaults when nothing is saved', () => {
    expect(setup().data.loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('saves and loads settings', () => {
    const { data } = setup();
    const settings = {
      ...DEFAULT_SETTINGS,
      colorVisionMode: 'red-green' as const,
      defaultDifficulty: 'advanced' as const,
    };
    expect(data.saveSettings(settings)).toEqual({ ok: true });
    expect(data.loadSettings()).toEqual(settings);
  });

  it('keeps valid fields and resets only invalid ones', () => {
    const { backend, data } = setup();
    backend.setItem(
      `${STORAGE_PREFIX}settings`,
      JSON.stringify({
        colorVisionMode: 'blue-yellow',
        defaultDifficulty: 'expert',
        defaultOperations: [],
        defaultSessionLength: 7,
        cardAnimationsEnabled: 'yes',
      }),
    );
    expect(data.loadSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      colorVisionMode: 'blue-yellow',
    });
  });

  it('resets an unknown color theme to the standard one', () => {
    const { backend, data } = setup();
    backend.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify({ colorVisionMode: 'purple' }));
    expect(data.loadSettings().colorVisionMode).toBe('off');
  });

  it('turns the old on/off color-blind setting into the red-green theme', () => {
    const { backend, data } = setup();
    backend.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify({ colorBlindMode: true }));
    expect(data.loadSettings().colorVisionMode).toBe('red-green');
  });

  it('recovers from settings that are not an object', () => {
    const { backend, data } = setup();
    backend.setItem(`${STORAGE_PREFIX}settings`, '[1,2,3]');
    expect(data.loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe('sessions', () => {
  it('saves sessions and loads them newest first', () => {
    const { data } = setup();
    data.saveSession(makeSession('old', '2026-10-01T10:00:00.000Z'));
    data.saveSession(makeSession('new', '2026-10-20T10:00:00.000Z'));
    data.saveSession(makeSession('mid', '2026-10-10T10:00:00.000Z'));
    expect(data.loadSessions().map((s) => s.id)).toEqual(['new', 'mid', 'old']);
  });

  it('updates a session instead of duplicating it', () => {
    const { data } = setup();
    const session = makeSession('s', '2026-10-20T10:00:00.000Z', {
      isActive: true,
      completedAt: undefined,
    });
    data.saveSession(session);
    data.saveSession({
      ...session,
      attemptedCount: 2,
      correctCount: 2,
      isActive: false,
      completedAt: '2026-10-20T10:05:00.000Z',
    });
    const sessions = data.loadSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ attemptedCount: 2, isActive: false });
  });

  it(`keeps only the ${MAX_STORED_SESSIONS} most recent sessions`, () => {
    const { data } = setup();
    for (let i = 0; i < MAX_STORED_SESSIONS + 5; i++) {
      const day = String(1 + (i % 28)).padStart(2, '0');
      const hour = String(i % 24).padStart(2, '0');
      data.saveSession(
        makeSession(`s-${i}`, `2026-0${1 + Math.floor(i / 28)}-${day}T${hour}:00:00.000Z`),
      );
    }
    const sessions = data.loadSessions();
    expect(sessions).toHaveLength(MAX_STORED_SESSIONS);
    // The oldest ones (January) were dropped first
    expect(sessions.some((s) => s.id === 's-0')).toBe(false);
  });

  it('drops invalid session records but keeps the valid ones', () => {
    const { backend, data } = setup();
    backend.setItem(
      `${STORAGE_PREFIX}sessions`,
      JSON.stringify([makeSession('good', '2026-10-20T10:00:00.000Z'), { id: 'bad' }, 'nonsense']),
    );
    expect(data.loadSessions().map((s) => s.id)).toEqual(['good']);
  });
});

describe('attempts', () => {
  it('saves every attempt with its details', () => {
    const { data } = setup();
    data.saveAttempt(makeAttempt('a1', { result: 'incorrect', selectedAnswer: 11 }));
    data.saveAttempt(makeAttempt('a2'));
    const attempts = data.loadAttempts();
    expect(attempts).toHaveLength(2);
    expect(attempts[0]).toMatchObject({
      selectedAnswer: 11,
      result: 'incorrect',
      operation: 'multiplication',
      difficulty: 'easy',
      sessionId: 's-1',
      answeredAt: '2026-10-20T12:00:00.000Z',
    });
  });

  it('does not save the same attempt twice', () => {
    const { data } = setup();
    data.saveAttempt(makeAttempt('a1'));
    data.saveAttempt(makeAttempt('a1'));
    expect(data.loadAttempts()).toHaveLength(1);
  });

  it('survives a "browser restart" (a new data store over the same storage)', () => {
    const { backend, data } = setup();
    data.saveAttempt(makeAttempt('a1'));
    const reopened = createAppData(createStorageService(backend));
    expect(reopened.loadAttempts().map((a) => a.id)).toEqual(['a1']);
  });

  it('drops invalid attempt records', () => {
    const { backend, data } = setup();
    backend.setItem(
      `${STORAGE_PREFIX}attempts`,
      JSON.stringify([makeAttempt('ok'), { ...makeAttempt('bad'), result: 'maybe' }]),
    );
    expect(data.loadAttempts().map((a) => a.id)).toEqual(['ok']);
  });
});

describe('reset and clear', () => {
  it('resetStatistics clears history but keeps settings', () => {
    const { data } = setup();
    data.saveSettings({ ...DEFAULT_SETTINGS, colorVisionMode: 'high-contrast' });
    data.saveSession(makeSession('s', '2026-10-20T10:00:00.000Z'));
    data.saveAttempt(makeAttempt('a'));
    data.resetStatistics();
    expect(data.loadSessions()).toEqual([]);
    expect(data.loadAttempts()).toEqual([]);
    expect(data.loadSettings().colorVisionMode).toBe('high-contrast');
  });

  it('clearAllData removes only this app’s data', () => {
    const { backend, data } = setup();
    backend.setItem('otherApp', 'keep');
    data.saveSettings({ ...DEFAULT_SETTINGS, colorVisionMode: 'high-contrast' });
    data.saveAttempt(makeAttempt('a'));
    data.clearAllData();
    expect(data.loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(data.loadAttempts()).toEqual([]);
    expect(backend.getItem('otherApp')).toBe('keep');
    expect(raw(backend, STORAGE_KEYS.schemaVersion)).toBe(String(CURRENT_SCHEMA_VERSION));
  });
});

describe('migrateStorage', () => {
  it('marks a fresh install with the current version', () => {
    const backend = createMemoryStorage();
    const result = migrateStorage(createStorageService(backend));
    expect(result).toEqual({
      fromVersion: null,
      toVersion: CURRENT_SCHEMA_VERSION,
      isFromNewerVersion: false,
    });
    expect(raw(backend, 'schemaVersion')).toBe(String(CURRENT_SCHEMA_VERSION));
  });

  it('runs each migration in order up to the current version', () => {
    const backend = createMemoryStorage();
    const storage = createStorageService(backend);
    storage.write('schemaVersion', 1);
    storage.write('settings', { old: true });
    const order: number[] = [];
    const result = migrateStorage(storage, { 1: () => order.push(1), 2: () => order.push(2) }, 3);
    expect(order).toEqual([1, 2]);
    expect(result).toMatchObject({ fromVersion: 1, toVersion: 3 });
    expect(raw(backend, 'schemaVersion')).toBe('3');
  });

  it('treats unversioned existing data as version 0', () => {
    const storage = createStorageService(createMemoryStorage());
    storage.write('attempts', []);
    const ran: number[] = [];
    const result = migrateStorage(storage, { 0: () => ran.push(0) }, 1);
    expect(ran).toEqual([0]);
    expect(result.fromVersion).toBe(0);
  });

  it('leaves data from a newer app version untouched', () => {
    const backend = createMemoryStorage();
    const storage = createStorageService(backend);
    storage.write('schemaVersion', 99);
    storage.write('settings', { future: true });
    const result = migrateStorage(storage, {}, 1);
    expect(result.isFromNewerVersion).toBe(true);
    expect(raw(backend, 'schemaVersion')).toBe('99');
    expect(raw(backend, 'settings')).toBe('{"future":true}');
  });

  it('does not touch data that belongs to other apps', () => {
    const backend = createMemoryStorage();
    backend.setItem('otherApp:settings', 'keep');
    migrateStorage(createStorageService(backend));
    expect(backend.getItem('otherApp:settings')).toBe('keep');
  });
});

describe('mistake patterns', () => {
  const pattern = (id: string, extra: Record<string, unknown> = {}) => ({
    id,
    operation: 'division',
    firstOperand: 24,
    secondOperand: 6,
    correctAnswer: 4,
    difficulty: 'easy',
    incorrectCount: 2,
    similarCorrectCount: 1,
    isMastered: false,
    createdAt: '2026-10-20T12:00:00.000Z',
    lastIncorrectAt: '2026-10-20T12:00:00.000Z',
    ...extra,
  });

  it('saves and loads mistake patterns', () => {
    const { data } = setup();
    data.saveMistakePatterns([pattern('m1') as never]);
    expect(data.loadMistakePatterns()).toEqual([pattern('m1')]);
  });

  it('loads them again after a "browser restart"', () => {
    const { backend, data } = setup();
    data.saveMistakePatterns([pattern('m1') as never]);
    expect(createAppData(createStorageService(backend)).loadMistakePatterns()).toHaveLength(1);
  });

  it('drops invalid records and keeps the valid ones', () => {
    const { backend, data } = setup();
    backend.setItem(
      `${STORAGE_PREFIX}mistakePatterns`,
      JSON.stringify([
        pattern('good'),
        pattern('bad-count', { incorrectCount: 0 }),
        pattern('bad-op', { operation: 'modulo' }),
        { id: 'partial' },
      ]),
    );
    expect(data.loadMistakePatterns().map((p) => p.id)).toEqual(['good']);
  });

  it('resetStatistics clears mistakes too', () => {
    const { data } = setup();
    data.saveMistakePatterns([pattern('m1') as never]);
    data.resetStatistics();
    expect(data.loadMistakePatterns()).toEqual([]);
  });
});
