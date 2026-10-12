import { test } from "node:test";
import assert from "node:assert/strict";

import {
  pitchFromSpeaker,
  speakAsSpeaker,
  speakLines,
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

test("speakAsSpeaker y speakLines aplican el pitch sin cambiar el rate", () => {
  const mock = installSpeechMock(1);

  try {
    assert.equal(speakAsSpeaker("Bea", "Hola"), true);
    assert.equal(mock.spoken[0].pitch, 1.1);
    assert.equal(mock.spoken[0].rate, 0.88);
    assert.equal(mock.spoken[0].voice, mock.voices[0]);

    mock.spoken.length = 0;
    speakLines(
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
    assert.equal(mock.spoken[1].pitch, 1.15);
    assert.equal(mock.spoken[1].rate, 0.98);
    assert.equal(mock.spoken[1].voice, mock.voices[0]);
  } finally {
    mock.restore();
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

  class SpeechUtteranceMock extends MockUtterance {}

  const speechSynthesis = {
    cancel: () => undefined,
    getVoices: () => voices,
    speak: (utterance: MockUtterance) => spoken.push(utterance)
  };
  const windowMock = {
    SpeechSynthesisUtterance: SpeechUtteranceMock,
    speechSynthesis,
    setTimeout: (callback: () => void) => {
      callback();
      return 1;
    }
  };

  Object.defineProperty(globalThis, "window", { configurable: true, value: windowMock });
  Object.defineProperty(globalThis, "SpeechSynthesisUtterance", {
    configurable: true,
    value: SpeechUtteranceMock
  });

  return {
    voices,
    spoken,
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
