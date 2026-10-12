"use client";

import styles from "./production.module.css";

const MARKS = [
  { value: "ok", label: "✅", accessibleLabel: "Conseguido" },
  { value: "warn", label: "⚠️", accessibleLabel: "A medias" },
  { value: "fail", label: "❌", accessibleLabel: "Necesita práctica" }
] as const;

export default function RubricSelfEval({
  criteria,
  values,
  disabled,
  onChange
}: {
  criteria: string[];
  values: Record<string, string>;
  disabled?: boolean;
  onChange: (index: number, value: string) => void;
}) {
  return (
    <ul className={styles.rubric}>
      {criteria.map((criterio, index) => (
        <li key={criterio} className={styles.rubricRow}>
          <span>{criterio}</span>
          <div className={styles.marks}>
            {MARKS.map((mark) => (
              <button
                key={mark.value}
                type="button"
                className={values[String(index)] === mark.value ? styles.markSelected : styles.mark}
                disabled={disabled}
                onClick={() => onChange(index, mark.value)}
                aria-pressed={values[String(index)] === mark.value}
                aria-label={`${mark.accessibleLabel}: ${criterio}`}
              >
                {mark.label}
              </button>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
