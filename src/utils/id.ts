let fallbackCounter = 0;

/** Creates a unique ID. Uses crypto.randomUUID when the browser supports it. */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  fallbackCounter += 1;
  return `id-${Date.now().toString(36)}-${fallbackCounter.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
