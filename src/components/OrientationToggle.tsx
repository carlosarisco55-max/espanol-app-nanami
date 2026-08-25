"use client";

import { useState } from "react";
import styles from "@/app/unidades/[unitId]/[session]/page.module.css";

// No traduce el contenido de la sesión — solo una frase de orientación bajo demanda,
// nunca abierta por defecto, para que la usuaria sepa qué va a aprender antes de
// enfrentarse al español. Preparado para admitir japonés en cuanto haya `ja` revisado.
export default function OrientationToggle({ en, ja }: { en?: string; ja?: string }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "ja">("en");

  if (!en && !ja) return null;

  const text = lang === "ja" && ja ? ja : en;

  return (
    <div className={styles.orientation}>
      <button type="button" className={styles.orientationToggle} onClick={() => setOpen((v) => !v)}>
        🌐 {open ? "Ocultar" : "In English"}
      </button>
      {open && (
        <p className={styles.orientationText}>
          {text}
          {ja && en && (
            <>
              {" "}
              <button
                type="button"
                onClick={() => setLang(lang === "en" ? "ja" : "en")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-ink)",
                  cursor: "pointer",
                  fontWeight: 600,
                  padding: 0
                }}
              >
                {lang === "en" ? "→ 日本語" : "→ English"}
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
}
