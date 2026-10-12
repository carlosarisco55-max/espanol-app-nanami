import { test } from "node:test";
import assert from "node:assert/strict";

import {
  pitchFromSpeaker,
  speakAsSpeaker,
  speakLines,
  speechTimeoutMs,
  voiceIndexForSpeaker
} from "../src/lib/tts";

test("Bea y Nacho conservan variantes de pitch aunque solo haya una voz", () => {
  assert.equal(pitchFromSpeaker("Bea"), 1.1);
  assert.equal(pitchFromSpeaker("Nacho"), 1.15);
  assert.equal(voiceIndexForSpeaker("Bea", 1), 0);
  assert.equal(voiceIndexForSpeaker("Nacho", 1), 0);

  assert.equal(voiceIndexForSpeaker("Bea", 2), 0);
  assert.equal(voiceIndexForSpeaker("Nacho", 2), 1);
});

test("el timeout de seguridad crece con el texto y respeta sus límites", () => {
  assert.equal(speechTimeoutMs("Hola", 0.88), 10_000);
  assert.ok(speechTimeoutMs("palabra ".repeat(200), 1) > speechTimeoutMs("palabra ".repeat(100), 1));
  assert.equal(speechTimeoutMs("texto ".repeat(10_000), 1), 180_000);
});

test("speakAsSpeaker y speakLines aplican el pitch sin cambiar el rate", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const mock = installSpeechMock(1);
  let stop = () => undefined;

  try {
    assert.equal(speakAsSpeaker("Bea", "Hola"), true);
    assert.equal(mock.spoken[0].pitch, 1.1);
    assert.equal(mock.spoken[0].rate, 0.88);
    assert.equal(mock.spoken[0].voice, mock.voices[0]);

    mock.spoken.length = 0;
    stop = speakLines(
      [
        { speaker: "Bea", text: "¿Qué tal?", stageDirections: [] },
        { speaker: "Nacho", text: "Muy bien.", stageDirections: [] }
      ],
      undefined,
      () => undefined,
      () => undefined
    );

    assert.equal(mock.spoken[0].pitch, 1.1);
    assert.equal(mock.spoken[0].rate, 0.98);
    assert.equal(mock.spoken[0].voice, mock.voices[0]);

    mock.spoken[0].onend?.({} as SpeechSynthesisEvent);
    context.mock.timers.tick(100);
    assert.equal(mock.spoken[1].pitch, 1.15);
    assert.equal(mock.spoken[1].rate, 0.98);
    assert.equal(mock.spoken[1].voice, mock.voices[0]);
  } finally {
    stop();
    mock.restore();
    context.mock.timers.reset();
  }
});

test("speakAsSpeaker cancela una utterance que nunca termina", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const mock = installSpeechMock(1);

  try {
    assert.equal(speakAsSpeaker("Bea", "Hola"), true);
    assert.equal(mock.cancelCount, 1);

    context.mock.timers.tick(9_999);
    assert.equal(mock.cancelCount, 1);

    context.mock.timers.tick(1);
    assert.equal(mock.cancelCount, 2);
  } finally {
    mock.restore();
    context.mock.timers.reset();
  }
});

test("onend limpia el timeout de seguridad antes de que pueda cancelar", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const mock = installSpeechMock(1);

  try {
    assert.equal(speakAsSpeaker("Nacho", "Esta frase termina con normalidad."), true);
    mock.spoken[0].onend?.({} as SpeechSynthesisEvent);

    context.mock.timers.tick(180_000);
    assert.equal(mock.cancelCount, 1);
  } finally {
    mock.restore();
    context.mock.timers.reset();
  }
});

test("speakLines avanza aunque onend y onerror nunca lleguen", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const mock = installSpeechMock(1);
  const visited: number[] = [];
  let done = false;

  try {
    speakLines(
      [
        { speaker: "Bea", text: "Hola", stageDirections: [] },
        { speaker: "Nacho", text: "Adiós", stageDirections: [] }
      ],
      undefined,
      (index) => visited.push(index),
      () => {
        done = true;
      }
    );

    assert.deepEqual(visited, [0]);
    assert.equal(mock.spoken.length, 1);

    context.mock.timers.tick(10_000);
    assert.deepEqual(visited, [0]);
    assert.equal(mock.cancelCount, 2);

    context.mock.timers.tick(100);
    assert.deepEqual(visited, [0, 1]);
    assert.equal(mock.spoken.length, 2);
    assert.equal(done, false);

    context.mock.timers.tick(10_000);
    assert.equal(done, false);

    context.mock.timers.tick(100);
    assert.equal(done, true);
    assert.equal(mock.cancelCount, 3);
  } finally {
    mock.restore();
    context.mock.timers.reset();
  }
});

function installSpeechMock(voiceCount: number) {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalUtterance = Object.getOwnPropertyDescriptor(globalThis, "SpeechSynthesisUtterance");
  const voices = Array.from(
    { length: voiceCount },
    (_, index) => ({ lang: "es-ES", name: `Voz ${index + 1}` }) as SpeechSynthesisVoice
  );
  const spoken: MockUtterance[] = [];
  let cancelCount = 0;

  class SpeechUtteranceMock extends MockUtterance {}

  const speechSynthesis = {
    cancel: () => {
      cancelCount += 1;
    },
    getVoices: () => voices,
    speak: (utterance: MockUtterance) => spoken.push(utterance)
  };
  const windowMock = {
    SpeechSynthesisUtterance: SpeechUtteranceMock,
    speechSynthesis,
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis)
  };

  Object.defineProperty(globalThis, "window", { configurable: true, value: windowMock });
  Object.defineProperty(globalThis, "SpeechSynthesisUtterance", {
    configurable: true,
    value: SpeechUtteranceMock
  });

  return {
    voices,
    spoken,
    get cancelCount() {
      return cancelCount;
    },
    restore() {
      restoreProperty("window", originalWindow);
      restoreProperty("SpeechSynthesisUtterance", originalUtterance);
    }
  };
}

class MockUtterance {
  lang = "";
  rate = 1;
  pitch = 1;
  voice: SpeechSynthesisVoice | null = null;
  onend: ((event: SpeechSynthesisEvent) => unknown) | null = null;
  onerror: ((event: SpeechSynthesisErrorEvent) => unknown) | null = null;

  constructor(readonly text: string) {}
}

function restoreProperty(key: "window" | "SpeechSynthesisUtterance", descriptor?: PropertyDescriptor): void {
  if (descriptor) {
    Object.defineProperty(globalThis, key, descriptor);
  } else {
    delete (globalThis as unknown as Record<string, unknown>)[key];
  }
}
