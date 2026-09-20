/** Stage directions written for the app, not for the learner. */
const AUTHOR_NOTE_BLOCK =
  /^(?:>\s*)+⚠️?\s*\*{0,2}Nota(?: J\d+)? para la app[\s\S]*?(?:\n(?!>)|\s*$)/gim;

const AUTHOR_PAREN =
  /\s*\(([^)\n]*(?:se muestra|para que pueda opinar|la app debe)[^)\n]*)\)/gi;

const AUTHOR_LAYOUT_ASIDE = /\s*la app debe presentarla así[^.]*\./gi;

const SOURCE_TAG = /\s*\((?:U\d+(?:\s*,\s*J\d+)*)\)\s*$/i;

export function stripAuthorDirections(markdown: string): string {
  return markdown
    .replace(AUTHOR_NOTE_BLOCK, "\n")
    .replace(AUTHOR_PAREN, "")
    .replace(AUTHOR_LAYOUT_ASIDE, "")
    .replace(/<span\b[^>]*>([\s\S]*?)<\/span>/gi, "*$1*")
    .replace(/<\/?[a-z][a-z0-9]*\b[^>]*>/gi, "");
}

export function stripItemSourceTag(text: string): string {
  return text.replace(SOURCE_TAG, "").trim();
}
