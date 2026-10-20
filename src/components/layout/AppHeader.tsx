import { Link } from 'react-router';
import styles from './AppHeader.module.css';
import { MainNav } from './MainNav';

export function AppHeader() {
  return (
    <header className={styles.header}>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <div className={styles.inner}>
        <Link to="/" className={styles.title}>
          <span className={styles.logo} aria-hidden="true">
            +
          </span>
          Math Practice
        </Link>
        <MainNav />
      </div>
    </header>
  );
}
