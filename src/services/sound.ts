/**
 * Sound effects, made in the browser with the Web Audio API.
 * No audio files are downloaded, so it works offline and loads nothing from
 * anywhere else.
 */

type AudioContextClass = typeof AudioContext;

let context: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (context) return context;
  const Ctor: AudioContextClass | undefined =
    typeof window === 'undefined'
      ? undefined
      : (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: AudioContextClass }).webkitAudioContext);
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

/** One soft bell-like note: a quick start, then a smooth fade out. */
function playNote(ctx: AudioContext, frequency: number, startAt: number, volume: number) {
  const duration = 0.35;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  gain.connect(ctx.destination);

  // A sine for the main tone plus a quiet one an octave up for a little sparkle
  for (const [multiplier, level] of [
    [1, 1],
    [2, 0.25],
  ] as const) {
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency * multiplier, startAt);
    const partGain = ctx.createGain();
    partGain.gain.setValueAtTime(level, startAt);
    oscillator.connect(partGain);
    partGain.connect(gain);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.05);
  }
}

/** Notes of the rising chime: G5 then C6 ("ding-ding!"), under half a second. */
export const CHIME_NOTES_HZ = [783.99, 1046.5] as const;
const NOTE_GAP_SECONDS = 0.11;
const CHIME_VOLUME = 0.18;

/**
 * Plays the "correct answer" chime. Does nothing (and never throws) if the
 * browser has no audio support. Browsers only allow sound after a click or
 * key press, which is always the case here.
 */
export function playCorrectChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') void ctx.resume();
    const start = ctx.currentTime + 0.01;
    CHIME_NOTES_HZ.forEach((frequency, index) =>
      playNote(ctx, frequency, start + index * NOTE_GAP_SECONDS, CHIME_VOLUME),
    );
  } catch {
    // Sound is a nice extra; never let it break practice
  }
}

/** For tests: forget the shared audio context. */
export function resetSoundForTests(): void {
  context = null;
}
