/**
 * Oculta la clave de un ejercicio autocorregible que se pinta como markdown
 * estático (sin motor). Misma idea que hideDeleReview: la alumna no ve
 * **Solución** / explicación / 💡 antes de intentar.
 */
export function hideStaticSolution(markdown: string): string {
  const lines = markdown.split("\n");
  const kept: string[] = [];
  let hiding = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      /^\*\*Soluci[oó]n[^:]*:\*\*/i.test(trimmed) ||
      /^\*\*Explicaci[oó]n[^:]*:\*\*/i.test(trimmed) ||
      /^\*\*Los \w+ fallos:\*\*/i.test(trimmed) ||
      /^>\s*💡\s*\*\*(?:Por qu[eé]|Estrategia|C[oó]mo)/i.test(line)
    ) {
      hiding = true;
      continue;
    }

    if (hiding) {
      if (/^---\s*$/.test(trimmed) || /^####\s+`/.test(trimmed) || /^##\s+/.test(trimmed)) {
        hiding = false;
        kept.push(line);
      }
      continue;
    }

    kept.push(line);
  }

  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
