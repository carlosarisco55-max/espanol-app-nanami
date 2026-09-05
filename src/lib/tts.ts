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

export function rateFromDescription(speed?: string): number {
  const normalized = speed?.toLowerCase() ?? "";
  if (/rápid|rapíd|solapamiento/.test(normalized)) return 1.08;
  if (/lent|despacio/.test(normalized)) return 0.88;
  return 0.98;
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
    if (line.speaker && voices.length > 0) {
      utterance.voice = voices[speakerIndex(line.speaker) % voices.length];
    }
    utterance.onend = () => {
      index += 1;
      window.setTimeout(speakNext, line.stageDirections.includes("pausa") ? 550 : 100);
    };
    utterance.onerror = () => {
      index += 1;
      speakNext();
    };
    synth.speak(utterance);
  };

  synth.cancel();
  speakNext();

  return () => {
    cancelled = true;
    synth.cancel();
  };
}
