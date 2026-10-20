import type { ColorVisionMode } from '../types';

export interface ColorVisionPreview {
  background: string;
  button: string;
  buttonText: string;
  buttonBorder: string;
  correct: string;
  correctBorder: string;
  wrong: string;
  wrongBorder: string;
}

export interface ColorVisionInfo {
  label: string;
  description: string;
  /** Sample colors for the preview in Settings. Keep in sync with index.css. */
  preview: ColorVisionPreview;
}

export const COLOR_VISION_INFO: Record<ColorVisionMode, ColorVisionInfo> = {
  off: {
    label: 'Standard',
    description: 'The normal Sunny Sky colors.',
    preview: {
      background: '#fff6d5',
      button: '#5aafe8',
      buttonText: '#1e2a4a',
      buttonBorder: '#1f6fb2',
      correct: '#9bdc9f',
      correctBorder: '#2e7d32',
      wrong: '#f7b2c1',
      wrongBorder: '#b4234a',
    },
  },
  'red-green': {
    label: 'Red-green',
    description: 'For protanopia and deuteranopia, the most common types. Blue and orange.',
    preview: {
      background: '#f1f5fa',
      button: '#0072b2',
      buttonText: '#ffffff',
      buttonBorder: '#003f63',
      correct: '#a6d8f5',
      correctBorder: '#0062a0',
      wrong: '#f9c58d',
      wrongBorder: '#a04e00',
    },
  },
  'blue-yellow': {
    label: 'Blue-yellow',
    description: 'For tritanopia. Teal and magenta, with no blue-yellow pairs.',
    preview: {
      background: '#faf4f6',
      button: '#00737d',
      buttonText: '#ffffff',
      buttonBorder: '#004349',
      correct: '#9edfd9',
      correctBorder: '#00695f',
      wrong: '#f7b6ce',
      wrongBorder: '#a8104f',
    },
  },
  'high-contrast': {
    label: 'High contrast',
    description: 'Black and white with thick borders. Works for any type, including low vision.',
    preview: {
      background: '#ffffff',
      button: '#000000',
      buttonText: '#ffffff',
      buttonBorder: '#000000',
      correct: '#ffffff',
      correctBorder: '#000000',
      wrong: '#ffffff',
      wrongBorder: '#000000',
    },
  },
};
