import { useId } from 'react';
import styles from './ToggleSwitch.module.css';

interface ToggleSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** An on/off switch. Shows the words "On"/"Off", so it never relies on color alone. */
export function ToggleSwitch({ label, description, checked, onChange }: ToggleSwitchProps) {
  const descriptionId = useId();
  return (
    <label className={styles.row}>
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {description && (
          <span id={descriptionId} className={styles.description}>
            {description}
          </span>
        )}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="visually-hidden"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-describedby={description ? descriptionId : undefined}
      />
      <span className={`${styles.switch} ${checked ? styles.on : ''}`} aria-hidden="true">
        <span className={styles.state}>{checked ? 'On' : 'Off'}</span>
        <span className={styles.thumb} />
      </span>
    </label>
  );
}
