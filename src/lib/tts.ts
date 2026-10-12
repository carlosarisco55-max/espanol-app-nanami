import type { AudioLine } from "../../tools/parse-curriculo/types";

export function speechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function spanishVoices(): SpeechSynthesisVoice[] {
  if (!speechAvailable()) return [];
  const voices = window.speechSynthesis.getVoices();
  const esEs = voices.filter((voice) => voice.lang.toLowerCase() === "es-es");
  return esEs.length > 0 ? esEs : voices.filter((voice) => voice.lang.toLowerCase().startsWith("es"));
}

function speakerIndex(speaker: string): number {
  return [...speaker].reduce((total, char) => total + char.charCodeAt(0), 0);
}

const SPEAKER_PITCHES = [0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15] as const;
const SPEECH_TIMEOUT_MIN_MS = 10_000;
const SPEECH_TIMEOUT_MAX_MS = 180_000;
const ESTIMATED_MS_PER_CHARACTER = 65;
const SPEECH_TIMEOUT_MULTIPLIER = 2;
const SPEECH_TIMEOUT_GRACE_MS = 3_000;

let activeSpeechTimeout: { id: number; owner: symbol } | undefined;

export function pitchFromSpeaker(speaker: string): number {
  if (!speaker) return 1;
  return SPEAKER_PITCHES[speakerIndex(speaker) % SPEAKER_PITCHES.length];
}

export function voiceIndexForSpeaker(speaker: string, voiceCount: number): number | null {
  if (voiceCount <= 0) return null;
  return speaker ? speakerIndex(speaker) % voiceCount : 0;
}

export function speechTimeoutMs(text: string, rate = 1): number {
  const safeRate = Math.max(rate, 0.1);
  const estimatedDuration = (text.trim().length * ESTIMATED_MS_PER_CHARACTER) / safeRate;
  const timeout = Math.ceil(estimatedDuration * SPEECH_TIMEOUT_MULTIPLIER + SPEECH_TIMEOUT_GRACE_MS);
  return Math.min(SPEECH_TIMEOUT_MAX_MS, Math.max(SPEECH_TIMEOUT_MIN_MS, timeout));
}

function clearSpeechTimeout(owner?: symbol): void {
  if (activeSpeechTimeout === undefined) return;
  if (owner !== undefined && activeSpeechTimeout.owner !== owner) return;
  window.clearTimeout(activeSpeechTimeout.id);
  activeSpeechTimeout = undefined;
}

function armSpeechTimeout(text: string, rate: number, owner: symbol, onTimeout: () => void): void {
  clearSpeechTimeout();
  const timeoutId = window.setTimeout(() => {
    if (activeSpeechTimeout?.owner !== owner) return;
    activeSpeechTimeout = undefined;
    onTimeout();
  }, speechTimeoutMs(text, rate));
  activeSpeechTimeout = { id: timeoutId, owner };
}

function applySpeakerVariant(
  utterance: SpeechSynthesisUtterance,
  speaker: string,
  voices: SpeechSynthesisVoice[]
): void {
  utterance.pitch = pitchFromSpeaker(speaker);
  const voiceIndex = voiceIndexForSpeaker(speaker, voices.length);
  if (voiceIndex !== null) utterance.voice = voices[voiceIndex];
}

export function rateFromDescription(speed?: string): number {
  const normalized = speed?.toLowerCase() ?? "";
  if (/rápid|rapíd|solapamiento/.test(normalized)) return 1.08;
  if (/lent|despacio/.test(normalized)) return 0.88;
  return 0.98;
}

export function speakText(text: string): boolean {
  return speakAsSpeaker("", text);
}

export function speakAsSpeaker(speaker: string, text: string): boolean {
  if (!speechAvailable() || !text.trim()) return false;
  const voices = spanishVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-ES";
  utterance.rate = 0.88;
  applySpeakerVariant(utterance, speaker, voices);
  const synth = window.speechSynthesis;
  const timeoutOwner = Symbol("speakAsSpeaker");
  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    clearSpeechTimeout(timeoutOwner);
  };
  utterance.onend = settle;
  utterance.onerror = settle;
  clearSpeechTimeout();
  synth.cancel();
  synth.speak(utterance);
  if (!settled) {
    armSpeechTimeout(text, utterance.rate, timeoutOwner, () => {
      if (settled) return;
      settled = true;
      synth.cancel();
    });
  }
  return true;
}

export function speakLines(
  lines: AudioLine[],
  speed: string | undefined,
  onLine: (index: number) => void,
  onDone: () => void
): () => void {
  if (!speechAvailable() || lines.length === 0) {
    onDone();
    return () => undefined;
  }

  const synth = window.speechSynthesis;
  const voices = spanishVoices();
  let cancelled = false;
  let index = 0;

  const speakNext = () => {
    if (cancelled || index >= lines.length) {
      onDone();
      return;
    }
    const line = lines[index];
    onLine(index);
    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.lang = "es-ES";
    utterance.rate = rateFromDescription(speed);
    applySpeakerVariant(utterance, line.speaker ?? "", voices);
    const timeoutOwner = Symbol(`speakLine:${index}`);
    let settled = false;
    const advance = (delay: number) => {
      if (settled) return;
      settled = true;
      clearSpeechTimeout(timeoutOwner);
      index += 1;
      if (delay > 0) {
        window.setTimeout(speakNext, delay);
      } else {
        speakNext();
      }
    };
    const endDelay = line.stageDirections.includes("pausa") ? 550 : 100;
    utterance.onend = () => advance(endDelay);
    utterance.onerror = () => advance(0);
    synth.speak(utterance);
    if (!settled) {
      armSpeechTimeout(line.text, utterance.rate, timeoutOwner, () => {
        if (settled) return;
        synth.cancel();
        advance(endDelay);
      });
    }
  };

  clearSpeechTimeout();
  synth.cancel();
  speakNext();

  return () => {
    cancelled = true;
    clearSpeechTimeout();
    synth.cancel();
  };
}
