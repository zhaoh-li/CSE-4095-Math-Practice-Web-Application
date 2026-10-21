import { useId, useMemo, useState } from 'react';
import { explainQuestion, speakMath } from '../../utils/explanations/explainQuestion';
import type { QuestionFacts } from '../../utils/questions/buildQuestion';
import { DotPicture } from './DotPicture';
import styles from './Explanation.module.css';

/** A "How to solve it" button that opens a short explanation of the problem. */
export function ExplanationPanel({ facts }: { facts: QuestionFacts }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const explanation = useMemo(() => explainQuestion(facts), [facts]);

  return (
    <div className={styles.explanation}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span aria-hidden="true">💡 </span>
        {isOpen ? 'Hide how to solve it' : 'How to solve it'}
      </button>

      <div id={panelId} className={styles.panel} hidden={!isOpen}>
        <p className={styles.title}>{explanation.title}</p>
        {explanation.kind === 'picture' ? (
          <>
            <DotPicture picture={explanation.picture} label={explanation.caption} />
            <p className={styles.caption}>{explanation.caption}</p>
          </>
        ) : (
          <ol className={styles.lines}>
            {explanation.lines.map((line) => (
              <li key={line} aria-label={speakMath(line)}>
                {line}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
