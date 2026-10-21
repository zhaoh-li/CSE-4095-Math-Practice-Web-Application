import { useState } from 'react';
import { appData, DATA_CATEGORY_NAMES, type DataCategory } from '../../services/appData';
import styles from './DataNotice.module.css';

function listInWords(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * Checks saved data once when the app opens and explains any problem in
 * simple words: damaged data that was fixed, or a browser that won't save.
 */
export function DataNotice() {
  // Runs once, before anything else reads the repaired data
  const [repaired] = useState<DataCategory[]>(() => appData.repairStorage());
  const [isDismissed, setIsDismissed] = useState(false);
  const isPersistent = appData.isPersistent;

  if (isDismissed || (repaired.length === 0 && isPersistent)) return null;

  return (
    <div className={styles.notice} role="status">
      <p className={styles.text}>
        <span aria-hidden="true">ℹ️ </span>
        {repaired.length > 0 ? (
          <>
            Some saved information was damaged, so we fixed it:{' '}
            {listInWords(repaired.map((c) => DATA_CATEGORY_NAMES[c]))}. Everything else is safe.
          </>
        ) : (
          <>
            This browser isn't letting the app save, so progress will be lost when you close the
            page.
          </>
        )}
      </p>
      <button type="button" className={styles.dismiss} onClick={() => setIsDismissed(true)}>
        OK<span className="visually-hidden">, hide this message</span>
      </button>
    </div>
  );
}
