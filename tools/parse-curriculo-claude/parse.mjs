// Parser independiente de content/curriculo-b1-b2.md (implementación de Claude Code,
// para comparar con la de TRAE en tools/parse-curriculo/). Sin dependencias externas.
//
// Uso: node tools/parse-curriculo-claude/parse.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const CURRICULUM_PATH = resolve(ROOT, "content", "curriculo-b1-b2.md");
const OUT_DIR = resolve(__dirname, "output");

const UNIT_HEADER_RE = /^#\s+(?:\d+\.\s+UNIDAD\s+\d+|\d+\.\d+\s+UNIDAD\s+\d+)\s+—\s+.+$/gm;
const SESSION_HEADER_RE = /^##\s+[\d.]+\s+SESIÓN\s+([1-5])\s+—\s+(.+)$/gm;
const EXERCISE_HEADER_RE = /^####\s+`(B1-B2-U(\d{2})-E(\d{2}))`/gm;
const YAML_FENCE_RE = /```yaml\n([\s\S]*?)\n```/;

function readCurriculum() {
  const raw = readFileSync(CURRICULUM_PATH, "utf8").replace(/\r\n/g, "\n");
  return raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
}

function splitByHeader(text, headerRe) {
  const matches = [...text.matchAll(headerRe)];
  const blocks = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    blocks.push({ header: matches[i], body: text.slice(start, end) });
  }
  return blocks;
}

function parseYamlFlat(yamlText) {
  const out = {};
  for (const rawLine of yamlText.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      const inner = value.slice(1, -1).trim();
      out[key] = inner ? inner.split(",").map((s) => stripQuotes(s.trim())) : [];
    } else if (/^-?\d+$/.test(value)) {
      out[key] = Number(value);
    } else if (value === "true" || value === "false") {
      out[key] = value === "true";
    } else if (value === "null" || value === "") {
      out[key] = null;
    } else {
      out[key] = stripQuotes(value);
    }
  }
  return out;
}

function stripQuotes(s) {
  return s.replace(/^["']|["']$/g, "");
}

function extractSection(text, startMarker, endMarkers) {
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) return null;
  const contentStart = startIdx + startMarker.length;
  let endIdx = text.length;
  for (const marker of endMarkers) {
    const idx = text.indexOf(marker, contentStart);
    if (idx !== -1 && idx < endIdx) endIdx = idx;
  }
  return text.slice(contentStart, endIdx).trim();
}

function inlinePlain(s) {
  return s
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/~~/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCanDos(section) {
  if (!section) return [];
  const items = [];
  const re = /^(\d+)\.\s+\*\*\((.+?)\)\*\*\s+(.+)$/gm;
  let m;
  while ((m = re.exec(section))) {
    items.push({ index: Number(m[1]), destreza: m[2].trim(), texto: inlinePlain(m[3]) });
  }
  return items;
}

function parseCategoriaBAperturas(section) {
  // tabla | Sesión | Apertura |
  if (!section) return {};
  const out = {};
  const rowRe = /^\|\s*(S[1-5]|Puente)\s*\|\s*(.+?)\s*\|$/gm;
  let m;
  while ((m = rowRe.exec(section))) {
    out[m[1]] = inlinePlain(m[2]);
  }
  return out;
}

function parseOrientacion(section) {
  // tabla | Sesión | English | 日本語 | — "—" se normaliza a null, no es texto real
  if (!section) return {};
  const out = {};
  const rowRe = /^\|\s*S([1-5])\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/gm;
  let m;
  while ((m = rowRe.exec(section))) {
    const en = m[2].trim();
    const ja = m[3].trim();
    out[`S${m[1]}`] = {
      en: en && en !== "—" ? inlinePlain(en) : null,
      ja: ja && ja !== "—" ? inlinePlain(ja) : null
    };
  }
  return out;
}

function parseContinuidad(section) {
  if (!section) return { datoCuriosoEspana: null, elencoRecurrente: null };
  const dato = section.match(/-\s*Dato curioso España:\s*(.+)/)?.[1]?.trim() ?? null;
  const elenco = section.match(/-\s*Elenco recurrente:\s*(.+)/)?.[1]?.trim() ?? null;
  return {
    datoCuriosoEspana: dato && !dato.startsWith("no aplica") ? inlinePlain(dato) : null,
    elencoRecurrente: elenco && !elenco.startsWith("ninguno") ? inlinePlain(elenco) : null
  };
}

function parseExercisesInBlock(block) {
  const blocks = splitByHeader(block, EXERCISE_HEADER_RE);
  return blocks.map(({ header, body }) => {
    const id = header[1];
    const yamlMatch = body.match(YAML_FENCE_RE);
    const meta = yamlMatch ? parseYamlFlat(yamlMatch[1]) : {};
    const hasSolucion =
      /\*\*Soluci[oó]n/i.test(body) ||
      /soluci[oó]n:/i.test(yamlMatch?.[1] ?? "") ||
      /\)\s*\*\*[^*\n]+\*\*/.test(body); // respuesta correcta marcada en negrita inline, ej. "c) **hay**"
    const hasExplicacion = /\*\*(Por qu[eé]|Explicaci[oó]n)/i.test(body);
    return {
      id,
      tipo: meta.tipo ?? null,
      nivel_mcer: meta.nivel_mcer ?? null,
      destreza: meta.destreza ?? null,
      foco: meta.foco ?? null,
      autocorregible: meta.autocorregible ?? null,
      items: meta.items ?? null,
      tieneSolucion: hasSolucion,
      tieneExplicacion: hasExplicacion
    };
  });
}

function parseSessions(unitBlock, aperturas, orientaciones, canDos) {
  const sessionBlocks = splitByHeader(unitBlock, SESSION_HEADER_RE);
  return sessionBlocks.map(({ header, body }) => {
    const number = Number(header[1]);
    const titulo = header[2].trim();
    const exercises = parseExercisesInBlock(body);
    const key = `S${number}`;

    let opening;
    if (aperturas[key]) {
      opening = { fuente: "categoria_b", texto: aperturas[key] };
    } else if (number === 5) {
      opening = {
        fuente: "categoria_a",
        texto: "Lo que te llevas hoy",
        tarjetas: canDos.slice(0, 3).map((c) => c.texto)
      };
    } else if (number === 3) {
      opening = {
        fuente: "categoria_a",
        texto: "¿Por qué se usa esta forma y no la otra? La regla sale del propio material que ya has visto."
      };
    } else {
      opening = { fuente: "categoria_a", texto: "Seguimos avanzando desde el material de la unidad." };
    }

    return {
      numero: number,
      slug: `s${number}`,
      titulo,
      opening,
      orientacion: orientaciones[key] ?? null,
      ejercicios: exercises,
      numEjercicios: exercises.length
    };
  });
}

function parseUnitBlock(block) {
  const yamlMatch = block.match(YAML_FENCE_RE);
  if (!yamlMatch) throw new Error("Unidad sin ficha YAML: " + block.slice(0, 60));
  const ficha = parseYamlFlat(yamlMatch[1]);

  const canDosSection = extractSection(block, "### Objetivos «puede hacer» (MCER)", [
    "### Contenidos (referencia PCIC)",
    "\n---"
  ]);
  const canDos = parseCanDos(canDosSection);

  const aperturasSection = extractSection(block, "### Aperturas de sesión (Categoría B)", [
    "### Orientación multiidioma (Categoría B)",
    "### Continuidad narrativa (Categoría B)",
    "\n---"
  ]);
  const aperturas = parseCategoriaBAperturas(aperturasSection);

  const orientacionSection = extractSection(block, "### Orientación multiidioma (Categoría B)", [
    "### Continuidad narrativa (Categoría B)",
    "\n---"
  ]);
  const orientaciones = parseOrientacion(orientacionSection);

  const continuidadSection = extractSection(block, "### Continuidad narrativa (Categoría B)", ["\n---"]);
  const continuidad = parseContinuidad(continuidadSection);

  const sessions = parseSessions(block, aperturas, orientaciones, canDos);
  const totalEjercicios = sessions.reduce((sum, s) => sum + s.numEjercicios, 0);

  return {
    unidadId: ficha.unidad_id,
    titulo: ficha.titulo,
    subtitulo: ficha.subtitulo ?? null,
    cita: ficha.cita ?? null,
    bloque: ficha.bloque ?? null,
    nivelEntrada: ficha.nivel_mcer_entrada ?? null,
    nivelSalida: ficha.nivel_mcer_salida ?? null,
    lexicoNucleo: ficha.lexico_nucleo ?? null,
    focosContraste: ficha.focos_contraste ?? [],
    canDos,
    categoriaB: {
      aperturas,
      continuidad
    },
    sesiones: sessions,
    stats: {
      numSesiones: sessions.length,
      numEjercicios: totalEjercicios
    }
  };
}

export function parseCurriculum(text) {
  const unitBlocks = splitByHeader(text, UNIT_HEADER_RE);
  return unitBlocks.map(({ body }) => parseUnitBlock(body));
}

function main() {
  const text = readCurriculum();
  const units = parseCurriculum(text);

  mkdirSync(resolve(OUT_DIR, "units"), { recursive: true });

  for (const unit of units) {
    writeFileSync(
      resolve(OUT_DIR, "units", `${unit.unidadId}.json`),
      JSON.stringify(unit, null, 2),
      "utf8"
    );
  }

  const index = units.map((u) => ({
    unidadId: u.unidadId,
    titulo: u.titulo,
    nivelEntrada: u.nivelEntrada,
    nivelSalida: u.nivelSalida,
    numSesiones: u.stats.numSesiones,
    numEjercicios: u.stats.numEjercicios
  }));
  writeFileSync(resolve(OUT_DIR, "index.json"), JSON.stringify(index, null, 2), "utf8");

  const exercisesIndex = units.flatMap((u) =>
    u.sesiones.flatMap((s) =>
      s.ejercicios.map((e) => ({ unidadId: u.unidadId, sesion: s.numero, ...e }))
    )
  );
  writeFileSync(
    resolve(OUT_DIR, "exercises-index.json"),
    JSON.stringify(exercisesIndex, null, 2),
    "utf8"
  );

  console.log(`Parseadas ${units.length} unidades.`);
  console.log(`Total ejercicios: ${exercisesIndex.length}`);
  console.log(`Salida en: ${OUT_DIR}`);
}

main();
