import { useEffect } from 'react';
import { useNavigate, useRouteError } from 'react-router';
import { Button, ButtonLink } from '../ui/Button';
import styles from './ErrorPage.module.css';

/**
 * Shown instead of a page that crashed. Uses simple words and never shows
 * technical details to the student; developers see the error in the console.
 */
export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  useEffect(() => {
    if (import.meta.env.DEV) console.error('[ErrorPage] A page crashed:', error);
  }, [error]);

  return (
    <section className={styles.error} aria-labelledby="error-title">
      <p className={styles.icon} aria-hidden="true">
        🙈
      </p>
      <h1 id="error-title">Oops! Something went wrong.</h1>
      <p>Don't worry, your saved progress is safe. Let's try that again.</p>
      <div className={styles.actions}>
        <Button onClick={() => navigate(0)}>Try Again</Button>
        <ButtonLink to="/" variant="secondary">
          Go to Home
        </ButtonLink>
      </div>
    </section>
  );
}
