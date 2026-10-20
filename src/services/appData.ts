import { DEFAULT_SETTINGS } from '../config/defaultSettings';
import type { AppSettings, PracticeAttempt, PracticeSession } from '../types';
import { createStorageService, type StorageService, type WriteResult } from './storage';
import { isStoredAttempt, isStoredSession, parseList, parseSettings } from './validators';

export const STORAGE_KEYS = {
  schemaVersion: 'schemaVersion',
  settings: 'settings',
  sessions: 'sessions',
  attempts: 'attempts',
} as const;

/** Bump this and add a migration whenever the stored data shape changes. */
export const CURRENT_SCHEMA_VERSION = 1;

/** Only the most recent sessions are kept in detail. Attempts are kept for statistics. */
export const MAX_STORED_SESSIONS = 100;

/** Upgrades stored data from version N to N + 1. */
export type Migration = (storage: StorageService) => void;

/**
 * Migrations keyed by the version they upgrade FROM.
 * Example for a future change: `1: (storage) => { ...turn v1 data into v2... }`
 */
export const MIGRATIONS: Record<number, Migration> = {};

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
      return storage.write(STORAGE_KEYS.attempts, [...attempts, attempt]);
    },

    /** Clears practice history. Settings are kept. */
    resetStatistics(): void {
      storage.remove(STORAGE_KEYS.sessions);
      storage.remove(STORAGE_KEYS.attempts);
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
