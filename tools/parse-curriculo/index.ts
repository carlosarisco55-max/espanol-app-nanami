import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildIndex, parseCurriculum, readCurriculumFile } from "./parser";
import type { ParseOptions } from "./types";

function parseArgs(argv: string[]): ParseOptions {
  const options: ParseOptions = {};
  const unitIndex = argv.indexOf("--unit");

  if (unitIndex !== -1 && argv[unitIndex + 1]) {
    options.unitFilter = argv[unitIndex + 1];
  }

  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const content = readCurriculumFile();
  const units = parseCurriculum(content, options);

  if (units.length === 0) {
    const target = options.unitFilter ?? "(todas)";
    throw new Error(`No se ha parseado ninguna unidad para el filtro: ${target}`);
  }

  const outDir = resolve(process.cwd(), "public", "data");
  const unitsDir = resolve(outDir, "units");
  mkdirSync(unitsDir, { recursive: true });

  for (const unit of units) {
    writeFileSync(resolve(unitsDir, `${unit.unitId}.json`), JSON.stringify(unit, null, 2), "utf8");
  }

  // El índice se reconstruye SOLO con la unidad recién parseada cuando se usa --unit,
  // para no pisar entradas de otras unidades ya generadas en corridas anteriores.
  const index = buildIndex(units);
  const indexPath = resolve(outDir, "index.json");
  let existingIndex: ReturnType<typeof buildIndex> = [];

  try {
    const raw = require("node:fs").readFileSync(indexPath, "utf8");
    existingIndex = JSON.parse(raw);
  } catch {
    existingIndex = [];
  }

  const merged = [...existingIndex.filter((entry) => !index.some((n) => n.unitId === entry.unitId)), ...index].sort(
    (a, b) => a.unitId.localeCompare(b.unitId)
  );

  writeFileSync(indexPath, JSON.stringify(merged, null, 2), "utf8");

  console.log(`Parseadas ${units.length} unidad(es): ${units.map((u) => u.unitId).join(", ")}`);
  console.log(`Sesiones totales: ${units.reduce((sum, u) => sum + u.sessions.length, 0)}`);
  console.log(`Ejercicios totales: ${units.reduce((sum, u) => sum + u.stats.exerciseCount, 0)}`);
  console.log(`Salida en: ${outDir}`);
}

main();
