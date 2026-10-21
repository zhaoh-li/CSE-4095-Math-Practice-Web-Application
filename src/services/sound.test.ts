import { CHIME_NOTES_HZ, playCorrectChime, resetSoundForTests } from './sound';

interface Started {
  frequency: number;
  startAt: number;
  stopAt: number;
}

/** A pretend AudioContext that records which tones were played and when. */
function installFakeAudio({ state = 'running' }: { state?: AudioContextState } = {}) {
  const started: Started[] = [];
  const resume = vi.fn(() => Promise.resolve());

  class FakeAudioContext {
    state = state;
    currentTime = 5;
    destination = {};
    resume = resume;
    createGain() {
      return {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };
    }
    createOscillator() {
      const record: Started = { frequency: 0, startAt: 0, stopAt: 0 };
      return {
        type: 'sine',
        frequency: { setValueAtTime: (value: number) => (record.frequency = value) },
        connect: vi.fn(),
        start: (at: number) => {
          record.startAt = at;
          started.push(record);
        },
        stop: (at: number) => (record.stopAt = at),
      };
    }
  }

  vi.stubGlobal('AudioContext', FakeAudioContext);
  return { started, resume };
}

beforeEach(() => resetSoundForTests());
afterEach(() => vi.unstubAllGlobals());

describe('playCorrectChime', () => {
  it('plays two notes, the second higher than the first', () => {
    const { started } = installFakeAudio();
    playCorrectChime();

    // Each note has a main tone plus a quiet octave on top
    const mainTones = started.filter((n) => CHIME_NOTES_HZ.includes(n.frequency as never));
    expect(mainTones.map((n) => n.frequency)).toEqual([...CHIME_NOTES_HZ]);
    expect(mainTones[1].frequency).toBeGreaterThan(mainTones[0].frequency);
    expect(mainTones[1].startAt).toBeGreaterThan(mainTones[0].startAt);
  });

  it('is short: everything ends within half a second', () => {
    const { started } = installFakeAudio();
    playCorrectChime();
    const first = Math.min(...started.map((n) => n.startAt));
    const last = Math.max(...started.map((n) => n.stopAt));
    expect(last - first).toBeLessThan(0.6);
  });

  it('wakes up audio the browser has paused', () => {
    const { resume } = installFakeAudio({ state: 'suspended' });
    playCorrectChime();
    expect(resume).toHaveBeenCalled();
  });

  it('does nothing, without errors, when the browser has no audio', () => {
    vi.stubGlobal('AudioContext', undefined);
    expect(() => playCorrectChime()).not.toThrow();
  });

  it('never throws, even if audio setup fails', () => {
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('Audio blocked');
        }
      },
    );
    expect(() => playCorrectChime()).not.toThrow();
  });
});
