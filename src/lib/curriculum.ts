import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CurriculumIndexEntry, CurriculumUnit } from "../../tools/parse-curriculo/types";

const DATA_DIR = resolve(process.cwd(), "public", "data");

export function getUnitIndex(): CurriculumIndexEntry[] {
  const raw = readFileSync(resolve(DATA_DIR, "index.json"), "utf8");
  return JSON.parse(raw) as CurriculumIndexEntry[];
}

export function getUnit(unitId: string): CurriculumUnit | null {
  try {
    const raw = readFileSync(resolve(DATA_DIR, "units", `${unitId}.json`), "utf8");
    return JSON.parse(raw) as CurriculumUnit;
  } catch {
    return null;
  }
}

export function getSession(unitId: string, sessionNumber: number) {
  const unit = getUnit(unitId);
  if (!unit) return null;
  return unit.sessions.find((s) => s.number === sessionNumber) ?? null;
}
