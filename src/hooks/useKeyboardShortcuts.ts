import { useEffect, useRef } from 'react';
import { shouldIgnoreShortcut } from '../utils/keyboard';

/**
 * Listens for page-wide key presses. The handler returns true when it used
 * the key, which stops the browser's default action for it.
 * Keys are ignored while typing, with Ctrl/Cmd/Alt, on key repeat, or while
 * a dialog is open (see shouldIgnoreShortcut).
 */
export function useKeyboardShortcuts(
  handler: (event: KeyboardEvent) => boolean | void,
  enabled: boolean,
) {
  // Always call the latest handler without re-adding the listener each render
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (shouldIgnoreShortcut(event)) return;
      if (handlerRef.current(event) === true) event.preventDefault();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
