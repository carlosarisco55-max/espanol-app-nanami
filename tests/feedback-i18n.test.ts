import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { parseCurriculum, readCurriculumFile } from "../tools/parse-curriculo/parser";
import {
  attachFeedbackI18n,
  loadFeedbackEnTranslations,
  parseFeedbackI18n,
  unknownFeedbackIds
} from "../tools/parse-curriculo/feedback-i18n";
import type { ExerciseBlock } from "../tools/parse-curriculo/exercise-types";
import {
  englishFeedbackText,
  FEEDBACK_EN_PREF_KEY,
  readFeedbackEnPref,
  shouldShowEnglishControl,
  writeFeedbackEnPref
} from "../src/lib/feedback-en";

const FIXTURE = readFileSync(resolve(process.cwd(), "tests", "fixtures", "feedback-en.md"), "utf8");

test("el fixture parsea 2 ejercicios reales y deja el ID inexistente en el mapa", () => {
  const translations = parseFeedbackI18n(FIXTURE);
  assert.equal(translations.size, 3);
  assert.equal(translations.get("B1-B2-U01-E01")?.pistaEn, "Look at the kinship pairs.");
  assert.equal(translations.get("B1-B2-U01-E01")?.explicacionEn, "*Sobrino* is your sibling's child.");
  assert.match(translations.get("B1-B2-U01-E02")?.explicacionEn ?? "", /always feminine/);
  assert.equal(translations.get("B1-B2-U99-E01")?.explicacionEn, "This ID does not exist in the curriculum.");
});

test("un ID del archivo que no está en el currículo se avisa y no rompe el attach", () => {
  const translations = parseFeedbackI18n(FIXTURE);
  const known = ["B1-B2-U01-E01", "B1-B2-U01-E02"];
  assert.deepEqual(unknownFeedbackIds(translations, known), ["B1-B2-U99-E01"]);

  const attached = attachFeedbackI18n(
    [
      stubExercise("B1-B2-U01-E01"),
      stubExercise("B1-B2-U01-E02"),
      stubExercise("B1-B2-U01-E12")
    ],
    translations
  );
  assert.equal(attached[0].pistaEn, "Look at the kinship pairs.");
  assert.equal(attached[1].explicacionEn?.includes("Adjectives"), true);
  assert.equal(attached[2].explicacionEn, undefined);
});

test("si no existe content/feedback-en.md, las traducciones quedan vacías y no hay error", () => {
  const cwd = mkdtempSync(join(tmpdir(), "nanami-feedback-"));
  mkdirSync(join(cwd, "content"));
  const translations = loadFeedbackEnTranslations(cwd);
  assert.equal(translations.size, 0);
});

test("si el archivo existe, se lee desde content/feedback-en.md", () => {
  const cwd = mkdtempSync(join(tmpdir(), "nanami-feedback-"));
  mkdirSync(join(cwd, "content"));
  writeFileSync(join(cwd, "content", "feedback-en.md"), FIXTURE, "utf8");
  const translations = loadFeedbackEnTranslations(cwd);
  assert.equal(translations.size, 3);
});

test("sin inglés no hay control; con inglés sí, y nunca en modo examen", () => {
  const fields = { explicacionEn: "Because *persona* is feminine." };
  assert.equal(shouldShowEnglishControl("fallo_2", {}), false);
  assert.equal(shouldShowEnglishControl("fallo_2", fields), true);
  assert.equal(shouldShowEnglishControl("fallo_1", fields), false);
  assert.equal(shouldShowEnglishControl("fallo_2", fields, { examMode: true }), false);
  assert.equal(shouldShowEnglishControl("fallo_2", fields, { engineFeedback: false }), false);
  assert.equal(englishFeedbackText("fallo_2", fields), "Because *persona* is feminine.");
  assert.equal(shouldShowEnglishControl("fallo_1", { pistaEn: "Look at the pairs." }), true);
});

test("el parseo real adjunta explicacionEn cuando el archivo existe y no inventa el resto", () => {
  const [unit] = parseCurriculum(readCurriculumFile(), { unitFilter: "B1-B2-U01" });
  const byId = new Map(unit.sessions.flatMap((session) => session.exercises).map((ex) => [ex.id, ex]));
  const withEn = byId.get("B1-B2-U01-E02");
  const withoutEn = byId.get("B1-B2-U01-E12");
  assert.ok(withEn?.explicacionEn);
  assert.match(withEn.explicacionEn ?? "", /egoísta|egoista/i);
  assert.equal(withEn?.pistaJa, undefined);
  assert.equal(withoutEn?.explicacionEn, undefined);
});

test("la preferencia de inglés se persiste y por defecto está oculta", () => {
  const store = memoryStorage();
  assert.equal(readFeedbackEnPref(store), false);
  writeFeedbackEnPref(true, store);
  assert.equal(store.getItem(FEEDBACK_EN_PREF_KEY), "1");
  assert.equal(readFeedbackEnPref(store), true);
  writeFeedbackEnPref(false, store);
  assert.equal(readFeedbackEnPref(store), false);
});

function stubExercise(id: string): ExerciseBlock {
  return {
    id,
    tipo: "emparejar",
    raw: "",
    content: {
      kind: "emparejar",
      enunciado: "x",
      izquierda: [],
      derecha: [],
      solucion: {}
    },
    jCodes: [],
    autocorregible: true
  };
}

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem(key: string) {
      return data.has(key) ? data.get(key)! : null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
    removeItem(key: string) {
      data.delete(key);
    }
  };
}
