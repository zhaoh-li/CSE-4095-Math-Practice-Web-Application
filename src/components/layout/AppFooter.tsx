import { Link } from 'react-router';
import styles from './AppFooter.module.css';

export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <p>
        Your progress is saved only in this browser. <Link to="/privacy">Privacy</Link>
      </p>
    </footer>
  );
}
