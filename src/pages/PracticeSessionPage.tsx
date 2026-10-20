import { useLocation } from 'react-router';
import { ButtonLink } from '../components/ui/Button';
import { DIFFICULTY_INFO, SESSION_LENGTH_OPTIONS } from '../config/practiceOptions';
import { describeOperations, isPracticeConfig } from '../utils/practiceConfig';

/**
 * Placeholder until Phase 7. Confirms the setup page passed its choices along.
 */
export function PracticeSessionPage() {
  const location = useLocation();
  const config = (location.state as { config?: unknown } | null)?.config;

  if (!isPracticeConfig(config)) {
    return (
      <section>
        <h1>Practice Session</h1>
        <p>Let's choose what to practice first.</p>
        <ButtonLink to="/practice/setup">Go to Practice Setup</ButtonLink>
      </section>
    );
  }

  const lengthLabel = SESSION_LENGTH_OPTIONS.find((o) => o.value === config.sessionLength)?.label;

  return (
    <section>
      <h1>Practice Session</h1>
      <p>Flash cards are coming soon! You chose:</p>
      <ul>
        <li>
          <strong>Operations:</strong> {describeOperations(config)}
        </li>
        <li>
          <strong>Level:</strong> {DIFFICULTY_INFO[config.difficulty].label}
        </li>
        <li>
          <strong>Length:</strong> {lengthLabel}
        </li>
      </ul>
      <ButtonLink to="/practice/setup" variant="secondary">
        Change Settings
      </ButtonLink>
    </section>
  );
}
