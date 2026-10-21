import { useLocation } from 'react-router';
import { ButtonLink } from '../components/ui/Button';
import { KeyHint } from '../components/ui/KeyHint';
import { useSettings } from '../context/SettingsContext';
import styles from './HomePage.module.css';

export function HomePage() {
  const location = useLocation();
  const { settings } = useSettings();
  const notice = (location.state as { notice?: unknown } | null)?.notice;

  return (
    <section className={styles.hero} aria-labelledby="home-title">
      {typeof notice === 'string' && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
      <h1 id="home-title">Welcome to Math Practice!</h1>
      <p className={styles.intro}>
        Practice addition, subtraction, multiplication, and division with flash cards. Pick an
        answer, flip the card, and see how you did!
      </p>
      <div className={styles.actions}>
        <ButtonLink to="/practice/setup">Start Practice</ButtonLink>
        <ButtonLink to="/statistics" variant="secondary">
          View Statistics
        </ButtonLink>
        <ButtonLink to="/settings" variant="secondary">
          Settings
        </ButtonLink>
      </div>
      {settings.keyboardShortcutsEnabled && (
        <p className={styles.tip}>
          <span aria-hidden="true">⌨️ </span>
          Tip: you can practice with your keyboard! Press <KeyHint decorative={false}>?</KeyHint> on
          a flash card to see the shortcuts.
        </p>
      )}
    </section>
  );
}
