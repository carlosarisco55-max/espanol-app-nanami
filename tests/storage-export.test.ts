import { test } from "node:test";
import assert from "node:assert/strict";

import { parseProgressExport } from "../src/lib/storage";

test("importa copias v1 anteriores a SRS con estado vacío", () => {
  const parsed = parseProgressExport({
    version: 1,
    exportedAt: "2026-09-05T00:00:00.000Z",
    profile: null,
    progress: [],
    meta: { completedSessions: [], lastAcknowledgedRound: 0 }
  });
  assert.deepEqual(parsed.srs, { jCards: {}, unitCards: {} });
});

test("conserva las tarjetas SRS de una copia v2", () => {
  const parsed = parseProgressExport({
    version: 2,
    exportedAt: "2026-09-05T00:00:00.000Z",
    profile: null,
    progress: [],
    meta: { completedSessions: [], lastAcknowledgedRound: 0 },
    srs: {
      jCards: {
        J4: {
          key: "J4",
          jCode: "J4",
          repetition: 0,
          dueAt: 123,
          lastEventAt: 100,
          lastExerciseId: "E03"
        }
      }
    }
  });
  assert.equal(parsed.srs.jCards.J4?.lastExerciseId, "E03");
  assert.deepEqual(parsed.srs.unitCards, {});
});
