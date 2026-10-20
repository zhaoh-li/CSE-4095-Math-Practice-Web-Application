// Vite's ?raw import gives the stylesheet as plain text
import css from '../index.css?raw';
import { COLOR_VISION_MODES, type ColorVisionMode } from '../types';
import { COLOR_VISION_INFO, type ColorVisionPreview } from './colorVision';

/** Reads the --color-* tokens from one CSS block. */
function tokensIn(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No CSS block for ${selector}`);
  const body = css.slice(start, css.indexOf('\n}', start));
  return Object.fromEntries(
    [...body.matchAll(/(--color-[\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map(([, name, value]) => [
      name,
      value.toLowerCase(),
    ]),
  );
}

/** The full palette for a theme: the defaults plus that theme's overrides. */
function themeTokens(mode: ColorVisionMode): Record<string, string> {
  const base = tokensIn(':root');
  return mode === 'off' ? base : { ...base, ...tokensIn(`:root[data-color-vision='${mode}']`) };
}

const PREVIEW_TOKENS: Record<keyof ColorVisionPreview, string> = {
  background: '--color-bg',
  button: '--color-primary',
  buttonText: '--color-primary-text',
  buttonBorder: '--color-primary-border',
  correct: '--color-positive',
  correctBorder: '--color-positive-border',
  wrong: '--color-negative',
  wrongBorder: '--color-negative-border',
};

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// [foreground, background, minimum ratio] — 4.5 for text, 3 for borders and focus rings
const CONTRAST_PAIRS: [string, string, number][] = [
  ['--color-text', '--color-bg', 4.5],
  ['--color-text-muted', '--color-surface', 4.5],
  ['--color-heading', '--color-bg', 4.5],
  ['--color-heading', '--color-surface', 4.5],
  ['--color-primary-text', '--color-primary', 4.5],
  ['--color-primary-text', '--color-primary-hover', 4.5],
  ['--color-primary-border', '--color-bg', 3],
  // Secondary (white) buttons
  ['--color-text', '--color-secondary', 4.5],
  ['--color-text', '--color-secondary-hover', 4.5],
  ['--color-primary-border', '--color-secondary', 3],
  ['--color-border', '--color-surface', 3],
  ['--color-text', '--color-selected-bg', 4.5],
  ['--color-text', '--color-card-back', 4.5],
  ['--color-positive-text', '--color-positive', 4.5],
  ['--color-negative-text', '--color-negative', 4.5],
  ['--color-positive-border', '--color-card-back', 3],
  ['--color-negative-border', '--color-card-back', 3],
  ['--color-danger-text', '--color-danger', 4.5],
  ['--color-focus', '--color-bg', 3],
  ['--color-focus', '--color-surface', 3],
  ['--color-error', '--color-error-bg', 4.5],
];

describe.each(COLOR_VISION_MODES)('color theme "%s"', (mode) => {
  const tokens = themeTokens(mode);

  it('has preview colors that match the stylesheet', () => {
    const preview = COLOR_VISION_INFO[mode].preview;
    for (const [key, token] of Object.entries(PREVIEW_TOKENS)) {
      expect({ key, color: preview[key as keyof ColorVisionPreview] }).toEqual({
        key,
        color: tokens[token],
      });
    }
  });

  it.each(CONTRAST_PAIRS)('%s on %s has enough contrast', (fg, bg, min) => {
    expect(tokens[fg]).toBeDefined();
    expect(tokens[bg]).toBeDefined();
    expect(contrast(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(min);
  });
});

it('the three color vision themes look clearly different from the standard one', () => {
  const standard = themeTokens('off');
  for (const mode of COLOR_VISION_MODES.filter((m) => m !== 'off')) {
    const theme = themeTokens(mode);
    for (const token of ['--color-bg', '--color-primary', '--color-positive', '--color-negative']) {
      expect({ mode, token, same: theme[token] === standard[token] }).toEqual({
        mode,
        token,
        same: false,
      });
    }
  }
});
