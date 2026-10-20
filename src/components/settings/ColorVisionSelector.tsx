import { useId } from 'react';
import { COLOR_VISION_INFO } from '../../config/colorVision';
import { COLOR_VISION_MODES, type ColorVisionMode } from '../../types';
import optionStyles from '../practice-setup/OptionCards.module.css';
import styles from './ColorVisionSelector.module.css';

interface ColorVisionSelectorProps {
  selected: ColorVisionMode;
  onChange: (mode: ColorVisionMode) => void;
}

/** Radio cards for the color theme, each with a small preview of its colors. */
export function ColorVisionSelector({ selected, onChange }: ColorVisionSelectorProps) {
  const groupId = useId();

  return (
    <fieldset className={optionStyles.fieldset}>
      <legend className={optionStyles.legend}>Color vision</legend>
      <p className={styles.help}>
        Changes the colors of the whole app. Right and wrong answers always also show ✓ and ✗.
      </p>
      <div className={`${optionStyles.grid} ${optionStyles.cols2}`}>
        {COLOR_VISION_MODES.map((mode) => {
          const info = COLOR_VISION_INFO[mode];
          const { preview } = info;
          const isSelected = selected === mode;
          const titleId = `${groupId}-${mode}-title`;
          const descriptionId = `${groupId}-${mode}-description`;
          return (
            <label
              key={mode}
              className={`${optionStyles.card} ${isSelected ? optionStyles.selected : ''}`}
            >
              <input
                type="radio"
                className="visually-hidden"
                name={`${groupId}-color-vision`}
                value={mode}
                checked={isSelected}
                onChange={() => onChange(mode)}
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
              />
              <span id={titleId} className={optionStyles.title}>
                {info.label}
              </span>
              <span id={descriptionId} className={optionStyles.description}>
                {info.description}
              </span>
              <span
                className={styles.preview}
                style={{ backgroundColor: preview.background }}
                aria-hidden="true"
              >
                <span
                  className={styles.chip}
                  style={{
                    backgroundColor: preview.button,
                    color: preview.buttonText,
                    borderColor: preview.buttonBorder,
                  }}
                >
                  Start
                </span>
                <span
                  className={styles.chip}
                  style={{ backgroundColor: preview.correct, borderColor: preview.correctBorder }}
                >
                  ✓
                </span>
                <span
                  className={`${styles.chip} ${mode === 'off' ? '' : styles.wrong}`}
                  style={{ backgroundColor: preview.wrong, borderColor: preview.wrongBorder }}
                >
                  ✗
                </span>
              </span>
              <span className={optionStyles.check} aria-hidden="true">
                ✓
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
