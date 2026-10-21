import styles from './KeyHint.module.css';

interface KeyHintProps {
  children: string;
  /**
   * Badges on buttons are decorative (the button's aria-keyshortcuts says the
   * same thing), so screen readers skip them. Inside a sentence like
   * "Press F to flip", set this to false so the key is read aloud.
   */
  decorative?: boolean;
}

/** A small key badge, e.g. [F]. */
export function KeyHint({ children, decorative = true }: KeyHintProps) {
  return (
    <kbd className={styles.key} aria-hidden={decorative || undefined}>
      {children}
    </kbd>
  );
}
