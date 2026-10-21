import { useState } from 'react';
import { OPERATION_INFO } from '../../config/practiceOptions';
import type { MistakePattern, MistakeStatistics, PracticeAttempt } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import type { AttemptArchive } from '../../utils/attemptArchive';
import { formatSessionDate } from '../../utils/formatDate';
import { createReviewConfig } from '../../utils/mistakes/mistakePatterns';
import { formatNumber, formatQuestionText } from '../../utils/questions/buildQuestion';
import { mostMissedOperations, sortByMostMissed } from '../../utils/statistics';
import { ButtonLink } from '../ui/Button';
import styles from './MistakeSection.module.css';
import tileStyles from './StatTiles.module.css';

interface MistakeSectionProps {
  patterns: readonly MistakePattern[];
  attempts: readonly PracticeAttempt[];
  /** Totals for older answers whose details were archived. */
  archive?: AttemptArchive;
  stats: MistakeStatistics;
  masteryThreshold: number;
}

const factText = (p: MistakePattern) =>
  `${formatQuestionText(p)} = ${formatNumber(p.correctAnswer)}`;
const times = (n: number) => `${n} ${n === 1 ? 'time' : 'times'}`;

/** Mistake counts, most-missed areas, and the list of mistakes being practiced. */
export function MistakeSection({
  patterns,
  attempts,
  archive,
  stats,
  masteryThreshold,
}: MistakeSectionProps) {
  const [view, setView] = useState<'active' | 'mastered'>('active');
  const { settings } = useSettings();

  if (patterns.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyIcon} aria-hidden="true">
          🌟
        </p>
        <p>
          <strong>No mistakes yet!</strong> When you miss a question, it shows up here so you can
          practice it.
        </p>
      </div>
    );
  }

  const mostMissed = mostMissedOperations(attempts, archive);
  const topFacts = sortByMostMissed(patterns).slice(0, 5);
  const shown = sortByMostMissed(patterns.filter((p) => p.isMastered === (view === 'mastered')));

  return (
    <>
      <ul className={tileStyles.stats} aria-label="Mistake totals">
        <li className={tileStyles.stat}>
          <span className={tileStyles.value}>{stats.activePatterns}</span>
          <span className={tileStyles.label}>Still learning</span>
        </li>
        <li className={tileStyles.stat}>
          <span className={tileStyles.value}>
            <span aria-hidden="true">🏆 </span>
            {stats.masteredPatterns}
          </span>
          <span className={tileStyles.label}>Mastered</span>
        </li>
        <li className={tileStyles.stat}>
          <span className={tileStyles.value}>{stats.similarQuestionsPracticed}</span>
          <span className={tileStyles.label}>Review questions</span>
        </li>
        <li className={`${tileStyles.stat} ${tileStyles.correct}`}>
          <span className={tileStyles.value}>
            <span aria-hidden="true">✓ </span>
            {stats.reviewQuestionsCorrect}
          </span>
          <span className={tileStyles.label}>Review correct</span>
        </li>
      </ul>

      <div className={styles.columns}>
        <div className={styles.panel}>
          <h3>Most missed operation</h3>
          {mostMissed ? (
            <p className={styles.mostMissed}>
              <span className={styles.symbols} aria-hidden="true">
                {mostMissed.operations.map((op) => OPERATION_INFO[op].symbol).join(' ')}
              </span>
              <span>
                {mostMissed.operations.map((op) => OPERATION_INFO[op].label).join(' and ')}
                <span className={styles.muted}>
                  {' '}
                  — missed {times(mostMissed.count)}
                  {mostMissed.operations.length > 1 && ' each'}
                </span>
              </span>
            </p>
          ) : (
            <p className={styles.muted}>Nothing missed yet.</p>
          )}
        </div>

        <div className={styles.panel}>
          <h3>Most missed facts</h3>
          <ol className={styles.topFacts}>
            {topFacts.map((p) => (
              <li key={p.id}>
                <span className={styles.fact}>{factText(p)}</span>
                <span className={styles.muted}>missed {times(p.incorrectCount)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className={styles.viewSwitch} role="group" aria-label="Which mistakes to show">
        <button
          type="button"
          className={styles.viewButton}
          aria-pressed={view === 'active'}
          onClick={() => setView('active')}
        >
          Still learning ({stats.activePatterns})
        </button>
        <button
          type="button"
          className={styles.viewButton}
          aria-pressed={view === 'mastered'}
          onClick={() => setView('mastered')}
        >
          <span aria-hidden="true">🏆 </span>Mastered ({stats.masteredPatterns})
        </button>
      </div>

      {shown.length === 0 ? (
        <p className={styles.muted}>
          {view === 'mastered'
            ? 'No mastered mistakes yet. Keep practicing!'
            : 'You have mastered every mistake. Great work!'}
        </p>
      ) : (
        <ul
          className={styles.details}
          aria-label={view === 'mastered' ? 'Mastered mistakes' : 'Mistakes to practice'}
        >
          {shown.map((p) => {
            const progress = Math.min(p.similarCorrectCount, masteryThreshold);
            return (
              <li key={p.id} className={styles.detail}>
                <span className={styles.fact}>{factText(p)}</span>
                <span>Missed {times(p.incorrectCount)}</span>
                <span>
                  {p.isMastered ? (
                    <>
                      <span aria-hidden="true">🏆 </span>Mastered
                      {p.masteredAt && ` ${formatSessionDate(p.masteredAt)}`}
                    </>
                  ) : (
                    <>
                      <span className={styles.dots} aria-hidden="true">
                        {'●'.repeat(progress)}
                        {'○'.repeat(masteryThreshold - progress)}
                      </span>{' '}
                      {progress} of {masteryThreshold} to master
                    </>
                  )}
                </span>
                <span className={styles.muted}>
                  Last missed {formatSessionDate(p.lastIncorrectAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {stats.activePatterns > 0 && (
        <div className={styles.cta}>
          <ButtonLink
            to="/practice/setup"
            state={{
              config: createReviewConfig(patterns, {
                difficulty: settings.defaultDifficulty,
                sessionLength: settings.defaultSessionLength,
              }),
            }}
          >
            Practice My Mistakes
          </ButtonLink>
        </div>
      )}
    </>
  );
}
