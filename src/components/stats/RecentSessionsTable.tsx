import { DIFFICULTY_INFO, OPERATION_INFO } from '../../config/practiceOptions';
import type { RecentSessionSummary } from '../../types';
import { formatSessionDate } from '../../utils/formatDate';
import styles from './RecentSessionsTable.module.css';

interface RecentSessionsTableProps {
  sessions: RecentSessionSummary[];
}

/**
 * Recent sessions, newest first. A table on wide screens (scrolling sideways
 * only if it must); on phones each session becomes its own card.
 */
export function RecentSessionsTable({ sessions }: RecentSessionsTableProps) {
  return (
    <div className={styles.scroller} role="region" aria-label="Recent sessions table" tabIndex={0}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Practiced</th>
            <th scope="col">Level</th>
            <th scope="col">Questions</th>
            <th scope="col">
              <span aria-hidden="true">✓ </span>Correct
            </th>
            <th scope="col">
              <span aria-hidden="true">✗ </span>Incorrect
            </th>
            <th scope="col">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.sessionId}>
              <th scope="row">
                <time dateTime={session.completedAt}>{formatSessionDate(session.completedAt)}</time>
              </th>
              <td data-label="Practiced">
                <span className={styles.symbols} aria-hidden="true">
                  {session.operations.map((op) => OPERATION_INFO[op].symbol).join(' ')}
                </span>
                <span className="visually-hidden">
                  {session.operations.map((op) => OPERATION_INFO[op].label).join(', ')}
                </span>
              </td>
              <td data-label="Level">
                {session.mode === 'mistake-review'
                  ? 'Mistake review'
                  : DIFFICULTY_INFO[session.difficulty].label}
              </td>
              <td data-label="Questions">{session.totals.attempted}</td>
              <td data-label="✓ Correct">{session.totals.correct}</td>
              <td data-label="✗ Incorrect">{session.totals.incorrect}</td>
              <td data-label="Accuracy" className={styles.accuracy}>
                {session.totals.accuracy}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
