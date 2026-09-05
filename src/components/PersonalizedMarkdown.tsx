"use client";

import { useEffect, useState } from "react";
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

export default function PersonalizedMarkdown({ content }: { content: string }) {
  const [resolved, setResolved] = useState(content);

  useEffect(() => {
    setResolved(applyProfile(content));
  }, [content]);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {resolved}
    </ReactMarkdown>
  );
}
