export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("es")
    .replace(/[“”«»"']/g, "")
    .replace(/[.,;:!?¿¡]+$/g, "")
    .replace(/\s+/g, " ");
}

export function matchesAcceptedAnswer(actual: string, expected: string, alternatives: string[] = []): boolean {
  const normalized = normalizeAnswer(actual);
  return [expected, ...alternatives].some((candidate) => {
    const forms = [
      candidate,
      candidate.replace(/\s*\([^()]*\)[.,;:!?¿¡]*\s*$/, ""),
      ...candidate.split(/\s+\/\s+/)
    ];
    return forms.some((form) => normalizeAnswer(form) === normalized);
  });
}
