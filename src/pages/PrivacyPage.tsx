import { ButtonLink } from '../components/ui/Button';
import styles from './PrivacyPage.module.css';

/** Plain-language privacy information, written for parents and teachers. */
export function PrivacyPage() {
  return (
    <article className={styles.privacy} aria-labelledby="privacy-title">
      <h1 id="privacy-title">Privacy</h1>
      <p className={styles.lead}>
        Math Practice is made for kids, so it is built to collect as little as possible.
      </p>

      <section aria-labelledby="no-personal-info">
        <h2 id="no-personal-info">No personal information</h2>
        <p>
          There are no accounts, no names, no email addresses, and no sign-in. The app never asks
          who your child is.
        </p>
      </section>

      <section aria-labelledby="stays-in-browser">
        <h2 id="stays-in-browser">Progress stays on this device</h2>
        <p>
          Answers, statistics, mistakes, and settings are saved only in this web browser, on this
          device. Nothing is sent to a server, and the app works the same without an internet
          connection once it has loaded.
        </p>
      </section>

      <section aria-labelledby="no-tracking">
        <h2 id="no-tracking">No tracking and no ads</h2>
        <p>
          The app has no advertising, no analytics, and no tracking tools. Even the fonts are
          included with the app instead of being loaded from another company.
        </p>
      </section>

      <section aria-labelledby="clearing">
        <h2 id="clearing">Clearing browser data removes progress</h2>
        <p>
          Because progress is stored in the browser, it will be deleted if you clear this browser's
          data (cookies and site data), use a private or incognito window, or switch to a different
          browser or device. You can also delete everything yourself on the Settings page with{' '}
          <strong>Clear All Application Data</strong>.
        </p>
      </section>

      <ButtonLink to="/" variant="secondary">
        Back to Home
      </ButtonLink>
    </article>
  );
}
