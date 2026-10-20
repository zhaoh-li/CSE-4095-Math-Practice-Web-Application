import { ButtonLink } from '../components/ui/Button';
import styles from './HomePage.module.css';

export function HomePage() {
  return (
    <section className={styles.hero} aria-labelledby="home-title">
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
    </section>
  );
}
