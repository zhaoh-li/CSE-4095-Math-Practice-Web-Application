import { isInteractiveTarget, isTypingTarget, shouldIgnoreShortcut } from './keyboard';

function keyEvent(init: KeyboardEventInit, target: Element = document.body) {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  Object.defineProperty(event, 'target', { value: target });
  return event;
}

function make(html: string) {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);
  return host.firstElementChild!;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('isTypingTarget', () => {
  it.each([
    ['<input type="text">', true],
    ['<input type="checkbox">', true],
    ['<textarea></textarea>', true],
    ['<select><option>a</option></select>', true],
    ['<div contenteditable="true"></div>', true],
    ['<button>Go</button>', false],
    ['<h2 tabindex="-1">Q</h2>', false],
  ])('%s → %s', (html, expected) => {
    expect(isTypingTarget(make(html))).toBe(expected);
  });
});

describe('isInteractiveTarget', () => {
  it('is true for buttons and links, false for headings', () => {
    expect(isInteractiveTarget(make('<button>Go</button>'))).toBe(true);
    expect(isInteractiveTarget(make('<a href="/">Home</a>'))).toBe(true);
    expect(isInteractiveTarget(make('<h2 tabindex="-1">Q</h2>'))).toBe(false);
    expect(isInteractiveTarget(document.body)).toBe(false);
  });
});

describe('shouldIgnoreShortcut', () => {
  it('allows a plain key press on the page', () => {
    expect(shouldIgnoreShortcut(keyEvent({ key: '1' }))).toBe(false);
  });

  it.each([
    ['Ctrl', { key: 'r', ctrlKey: true }],
    ['Cmd', { key: 'r', metaKey: true }],
    ['Alt', { key: 'f', altKey: true }],
    ['a held-down key', { key: '1', repeat: true }],
  ])('ignores keys with %s', (_name, init) => {
    expect(shouldIgnoreShortcut(keyEvent(init))).toBe(true);
  });

  it('still allows Shift, which is needed for "?"', () => {
    expect(shouldIgnoreShortcut(keyEvent({ key: '?', shiftKey: true }))).toBe(false);
  });

  it('ignores keys typed into form fields', () => {
    expect(shouldIgnoreShortcut(keyEvent({ key: '1' }, make('<input type="text">')))).toBe(true);
  });

  it('ignores keys while an inline "are you sure?" question is open', () => {
    make('<div role="group" data-pauses-shortcuts></div>');
    expect(shouldIgnoreShortcut(keyEvent({ key: '1' }))).toBe(true);
  });

  it('ignores keys while a dialog is open', () => {
    make('<div role="alertdialog" aria-modal="true"></div>');
    expect(shouldIgnoreShortcut(keyEvent({ key: 'r' }))).toBe(true);
  });
});
