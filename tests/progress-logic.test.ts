import { test } from "node:test";
import assert from "node:assert/strict";

import {
  backupFilename,
  backupRound,
  sessionJustCompleted,
  sessionKey,
  shouldPromptBackup
} from "../src/lib/progress-logic";

test("sessionKey une unidad y slug de forma estable", () => {
  assert.equal(sessionKey("B1-B2-U01", "s1"), "B1-B2-U01:s1");
});

test("backupRound baja al múltiplo de 5", () => {
  assert.equal(backupRound(0), 0);
  assert.equal(backupRound(4), 0);
  assert.equal(backupRound(5), 5);
  assert.equal(backupRound(9), 5);
  assert.equal(backupRound(10), 10);
});

test("el aviso de copia aparece en 5/10/15 y no vuelve hasta la siguiente cuenta redonda", () => {
  assert.equal(shouldPromptBackup(5, 0), true);
  assert.equal(shouldPromptBackup(5, 5), false);
  assert.equal(shouldPromptBackup(7, 5), false);
  assert.equal(shouldPromptBackup(10, 5), true);
  assert.equal(shouldPromptBackup(10, 10), false);
});

test("una sesión cuenta cuando todos los ejercicios interactivos están en estado terminal, y solo una vez", () => {
  const ids = ["E01", "E02"];
  assert.equal(sessionJustCompleted(ids, { E01: "correcto", E02: "fallo_2" }, false), true);
  assert.equal(sessionJustCompleted(ids, { E01: "correcto", E02: "fallo_1" }, false), false);
  assert.equal(sessionJustCompleted(ids, { E01: "correcto", E02: "fallo_2" }, true), false);
  assert.equal(sessionJustCompleted([], {}, false), false);
});

test("el nombre de la copia sigue el patrón acordado", () => {
  assert.equal(backupFilename(new Date(2026, 8, 5)), "espanol-app-backup-B1B2-2026-09-05.json");
});
