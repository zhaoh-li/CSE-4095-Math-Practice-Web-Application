import { DEFAULT_SETTINGS } from '../config/defaultSettings';
import type {
  ActiveSessionSnapshot,
  AppSettings,
  MistakePattern,
  PracticeAttempt,
  PracticeSession,
} from '../types';
import {
  createStorageService,
  type ReadResult,
  type StorageService,
  type WriteResult,
} from './storage';
import { addToArchive, EMPTY_ARCHIVE, type AttemptArchive } from '../utils/attemptArchive';
import {
  isActiveSessionSnapshot,
  isStoredAttempt,
  isStoredMistakePattern,
  isStoredSession,
  parseAttemptArchive,
  parseList,
  parseSettings,
} from './validators';

export const STORAGE_KEYS = {
  schemaVersion: 'schemaVersion',
  settings: 'settings',
  sessions: 'sessions',
  attempts: 'attempts',
  mistakePatterns: 'mistakePatterns',
  activeSession: 'activeSession',
  attemptArchive: 'attemptArchive',
} as const;

/** Bump this and add a migration whenever the stored data shape changes. */
export const CURRENT_SCHEMA_VERSION = 2;

/** Only the most recent sessions are kept in detail. */
export const MAX_STORED_SESSIONS = 100;

/**
 * Answers kept in full detail. Beyond this, the oldest ARCHIVE_BATCH answers
 * are turned into totals (see attemptArchive.ts), so statistics stay exact
 * while storage stays small.
 */
export const MAX_DETAILED_ATTEMPTS = 2000;
export const ARCHIVE_BATCH = 500;

/** Upgrades stored data from version N to N + 1. */
export type Migration = (storage: StorageService) => void;

/** Migrations keyed by the version they upgrade FROM. */
export const MIGRATIONS: Record<number, Migration> = {
  /**
   * v1 → v2: sound effects arrived. Before that, "Sound effects" was saved as
   * off only because it did nothing yet, so switch it on once for everyone.
   */
  1: (storage) => {
    const settings = storage.read<Record<string, unknown> | null>(
      STORAGE_KEYS.settings,
      (raw) =>
        typeof raw === 'object' && raw !== null && !Array.isArray(raw)
          ? { value: raw as Record<string, unknown> }
          : { value: null },
      null,
    ).value;
    if (settings) storage.write(STORAGE_KEYS.settings, { ...settings, soundEffectsEnabled: true });
  },
};

export interface MigrationResult {
  fromVersion: number | null;
  toVersion: number;
  /** True when the data came from a newer app version and was left untouched. */
  isFromNewerVersion: boolean;
}

/** Brings stored data up to the current schema version. Never deletes other apps' data. */
export function migrateStorage(
  storage: StorageService,
  migrations: Record<number, Migration> = MIGRATIONS,
  currentVersion: number = CURRENT_SCHEMA_VERSION,
): MigrationResult {
  const stored = storage.read<number | null>(
    STORAGE_KEYS.schemaVersion,
    (raw) =>
      Number.isInteger(raw) && (raw as number) >= 0
        ? { value: raw as number }
        : { value: null, problem: 'invalid' },
    null,
  ).value;

  const hasAppData = storage.keys().some((key) => key !== STORAGE_KEYS.schemaVersion);

  // A brand-new install: nothing to migrate
  if (stored === null && !hasAppData) {
    storage.write(STORAGE_KEYS.schemaVersion, currentVersion);
    return { fromVersion: null, toVersion: currentVersion, isFromNewerVersion: false };
  }

  // Data saved before versioning existed counts as version 0
  let version = stored ?? 0;

  if (version > currentVersion) {
    return { fromVersion: version, toVersion: version, isFromNewerVersion: true };
  }

  const fromVersion = version;
  while (version < currentVersion) {
    migrations[version]?.(storage);
    version += 1;
    storage.write(STORAGE_KEYS.schemaVersion, version);
  }
  return { fromVersion, toVersion: version, isFromNewerVersion: false };
}

const sessionTime = (session: PracticeSession) => session.completedAt ?? session.startedAt;

/** Kinds of saved data, in words a child or parent understands. */
export const DATA_CATEGORY_NAMES = {
  settings: 'your settings',
  sessions: 'your session history',
  attempts: 'your answer history',
  mistakePatterns: 'your mistake list',
  activeSession: 'your unfinished session',
  attemptArchive: 'your older answer totals',
} as const;

export type DataCategory = keyof typeof DATA_CATEGORY_NAMES;

export function createAppData(storage: StorageService = createStorageService()) {
  migrateStorage(storage);

  const readSessions = () =>
    storage.read(STORAGE_KEYS.sessions, parseList(isStoredSession), []).value;
  const readAttempts = () =>
    storage.read(STORAGE_KEYS.attempts, parseList(isStoredAttempt), []).value;

  return {
    storage,

    get isPersistent() {
      return storage.isPersistent;
    },

    loadSettings(): AppSettings {
      return storage.read(STORAGE_KEYS.settings, parseSettings, { ...DEFAULT_SETTINGS }).value;
    },

    saveSettings(settings: AppSettings): WriteResult {
      return storage.write(STORAGE_KEYS.settings, settings);
    },

    /** Newest first. */
    loadSessions(): PracticeSession[] {
      return readSessions().sort((a, b) => sessionTime(b).localeCompare(sessionTime(a)));
    },

    /** Adds or updates a session, keeping only the most recent ones. */
    saveSession(session: PracticeSession): WriteResult {
      const others = readSessions().filter((s) => s.id !== session.id);
      const sessions = [session, ...others]
        .sort((a, b) => sessionTime(b).localeCompare(sessionTime(a)))
        .slice(0, MAX_STORED_SESSIONS);
      return storage.write(STORAGE_KEYS.sessions, sessions);
    },

    loadAttempts(): PracticeAttempt[] {
      return readAttempts();
    },

    saveAttempt(attempt: PracticeAttempt): WriteResult {
      const attempts = readAttempts();
      if (attempts.some((a) => a.id === attempt.id)) return { ok: true };
      let updated = [...attempts, attempt];

      if (updated.length > MAX_DETAILED_ATTEMPTS) {
        // Turn the oldest answers into totals before dropping their details
        const toArchive = updated.slice(0, ARCHIVE_BATCH);
        const archived = storage.write(
          STORAGE_KEYS.attemptArchive,
          addToArchive(this.loadAttemptArchive(), toArchive),
        );
        if (archived.ok) updated = updated.slice(ARCHIVE_BATCH);
      }
      return storage.write(STORAGE_KEYS.attempts, updated);
    },

    loadAttemptArchive(): AttemptArchive {
      return storage.read(STORAGE_KEYS.attemptArchive, parseAttemptArchive, EMPTY_ARCHIVE).value;
    },

    /** Roughly how much space this app's saved data takes, in bytes. */
    storageUsageBytes(): number {
      let characters = 0;
      for (const key of storage.keys()) {
        const value = storage.read(key, (raw) => ({ value: JSON.stringify(raw) }), '').value;
        characters += key.length + value.length;
      }
      // Browsers store text as UTF-16: 2 bytes per character
      return characters * 2;
    },

    loadMistakePatterns(): MistakePattern[] {
      return storage.read(STORAGE_KEYS.mistakePatterns, parseList(isStoredMistakePattern), [])
        .value;
    },

    saveMistakePatterns(patterns: readonly MistakePattern[]): WriteResult {
      return storage.write(STORAGE_KEYS.mistakePatterns, patterns);
    },

    /** The unfinished session, if there is one. Damaged data is removed. */
    loadActiveSession(): ActiveSessionSnapshot | null {
      const result = storage.read<ActiveSessionSnapshot | null>(
        STORAGE_KEYS.activeSession,
        (raw) =>
          isActiveSessionSnapshot(raw) ? { value: raw } : { value: null, problem: 'invalid' },
        null,
      );
      if (result.problem) storage.remove(STORAGE_KEYS.activeSession);
      return result.value;
    },

    saveActiveSession(snapshot: ActiveSessionSnapshot): WriteResult {
      return storage.write(STORAGE_KEYS.activeSession, snapshot);
    },

    clearActiveSession(): void {
      storage.remove(STORAGE_KEYS.activeSession);
    },

    /**
     * Closes an unfinished session the student chose not to continue. If it
     * had answers, it's kept in history as ended early.
     */
    abandonActiveSession(now: string = new Date().toISOString()): void {
      const snapshot = this.loadActiveSession();
      if (snapshot && snapshot.session.attemptedCount > 0) {
        this.saveSession({ ...snapshot.session, isActive: false, completedAt: now });
      }
      storage.remove(STORAGE_KEYS.activeSession);
    },

    /**
     * Checks every kind of saved data. Anything damaged is cleaned up (bad
     * records dropped, bad settings reset to defaults) for that kind only;
     * everything else is left alone. Returns the kinds that needed fixing.
     */
    repairStorage(): DataCategory[] {
      const repaired: DataCategory[] = [];
      const check = <T>(
        category: DataCategory,
        parse: (raw: unknown) => ReadResult<T>,
        fallback: T,
      ) => {
        const result = storage.read(STORAGE_KEYS[category], parse, fallback);
        // "unavailable" means storage itself is blocked; there is nothing to repair
        if (!result.problem || result.problem === 'unavailable') return;
        if (category === 'activeSession') storage.remove(STORAGE_KEYS.activeSession);
        else storage.write(STORAGE_KEYS[category], result.value);
        repaired.push(category);
      };

      check('settings', parseSettings, { ...DEFAULT_SETTINGS });
      check('sessions', parseList(isStoredSession), []);
      check('attempts', parseList(isStoredAttempt), []);
      check('mistakePatterns', parseList(isStoredMistakePattern), []);
      check('attemptArchive', parseAttemptArchive, EMPTY_ARCHIVE);
      check<ActiveSessionSnapshot | null>(
        'activeSession',
        (raw) =>
          isActiveSessionSnapshot(raw) ? { value: raw } : { value: null, problem: 'invalid' },
        null,
      );
      return repaired;
    },

    /** Clears practice history and mistakes. Settings are kept. */
    resetStatistics(): void {
      storage.remove(STORAGE_KEYS.sessions);
      storage.remove(STORAGE_KEYS.attempts);
      storage.remove(STORAGE_KEYS.mistakePatterns);
      storage.remove(STORAGE_KEYS.activeSession);
      storage.remove(STORAGE_KEYS.attemptArchive);
    },

    /** Removes everything this app has stored and starts fresh. */
    clearAllData(): void {
      storage.clearAll();
      storage.write(STORAGE_KEYS.schemaVersion, CURRENT_SCHEMA_VERSION);
    },
  };
}

export type AppData = ReturnType<typeof createAppData>;

/** The app's shared data store, backed by localStorage when available. */
export const appData: AppData = createAppData();
