"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { readProfile } from "@/lib/profile";
import styles from "@/app/unidades/[unitId]/[session]/page.module.css";

// Los componentes de render viven AQUÍ (dentro del Client Component), no en la página
// servidor que lo usa: React no permite pasar funciones de un Server Component a un
// Client Component como prop (no son serializables a través del límite).
const markdownComponents: Components = {
  // Los bloques de metadatos (```yaml) son para el motor de ejercicios, no para leer.
  pre(props) {
    const child = props.children as { props?: { className?: string } } | undefined;
    const className = child?.props?.className ?? "";
    if (className.includes("language-yaml")) return null;
    return <pre {...props} />;
  },
  table(props) {
    return (
      <div className={styles.tableWrap}>
        <table {...props} />
      </div>
    );
  }
};

// Sustituye los huecos personalizables (🎯 {{nombre}}, {{profesion}}, {{intereses}}) por
// el perfil guardado en el onboarding. Regla de CLAUDE.md: solo afecta a saludos y huecos
// explícitos, nunca a la lógica de corrección de ejercicios (esa vive en los validadores).
function applyProfile(markdown: string): string {
  const profile = readProfile();
  return markdown
    .replace(/\{\{nombre\}\}/g, profile?.nombre?.trim() || "tú")
    .replace(/\{\{profesion\}\}/g, profile?.profesion?.trim() || "tu trabajo")
    .replace(/\{\{intereses\}\}/g, profile?.gustos?.trim() || "lo que te gusta");
}

function plainText(markdown: string): string {
  return markdown.replace(/\*\*/g, "").replace(/`/g, "").trim();
}

export default function PersonalizedMarkdown({
  content,
  unitId
}: {
  content: string;
  unitId?: string;
}) {
  const [resolved, setResolved] = useState(content);

  useEffect(() => {
    setResolved(applyProfile(content));
  }, [content]);

  const unitNumber = unitId?.match(/^B1-B2-U(0[1-9]|1[0-5])$/)?.[1];
  const screenBrief = unitNumber
    ? resolved.match(/^>\s*\*\*Pantalla:\*\*\s*(.+)$/m)
    : null;

  if (unitNumber && screenBrief?.index !== undefined) {
    const before = resolved.slice(0, screenBrief.index);
    const after = resolved.slice(screenBrief.index + screenBrief[0].length);
    const description = plainText(screenBrief[1]);

    return (
      <>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {before}
        </ReactMarkdown>
        <figure className={styles.warmupFigure}>
          <div className={styles.warmupImageFrame}>
            <Image
              className={styles.warmupImage}
              src={`/images/warmups/u${unitNumber}.jpg`}
              alt={description}
              width={1024}
              height={576}
              sizes="(max-width: 680px) calc(100vw - 3rem), 640px"
              priority
            />
          </div>
          <figcaption className={styles.warmupCaption}>
            <strong>Escena de observación.</strong> {description}
          </figcaption>
        </figure>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {after}
        </ReactMarkdown>
      </>
    );
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {resolved}
    </ReactMarkdown>
  );
}
