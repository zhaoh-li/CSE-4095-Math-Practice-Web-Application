/** Fields where letters and numbers are typed or toggled, so shortcuts must stay out. */
const TYPING_SELECTOR = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

/** Elements that already do something with Enter. */
const INTERACTIVE_SELECTOR = `${TYPING_SELECTOR}, button, a[href], summary, [role="button"], [role="link"]`;

const asElement = (target: EventTarget | null) => (target instanceof Element ? target : null);

export function isTypingTarget(target: EventTarget | null): boolean {
  return asElement(target)?.closest(TYPING_SELECTOR) != null;
}

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return asElement(target)?.closest(INTERACTIVE_SELECTOR) != null;
}

/**
 * True while a dialog or an "are you sure?" question is open. Inline
 * questions mark themselves with data-pauses-shortcuts.
 */
export function isModalOpen(): boolean {
  return document.querySelector('[aria-modal="true"], [data-pauses-shortcuts]') !== null;
}

/**
 * Rules that keep page-wide shortcuts from getting in the way:
 * - not while typing or using a form field
 * - not with Ctrl, Cmd, or Alt, so browser shortcuts (Ctrl+R, Ctrl+F) still work
 * - holding a key down only counts once
 * - not while a dialog is open
 */
export function shouldIgnoreShortcut(event: KeyboardEvent): boolean {
  return (
    event.defaultPrevented ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.repeat ||
    isTypingTarget(event.target) ||
    isModalOpen()
  );
}
