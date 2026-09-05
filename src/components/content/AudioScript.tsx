"use client";

import { useEffect, useState } from "react";
import type { AudioScript as AudioScriptData } from "../../../tools/parse-curriculo/types";
import { speakLines, speechAvailable } from "@/lib/tts";
import styles from "./AudioScript.module.css";

export default function AudioScript({ audio }: { audio: AudioScriptData }) {
  const [playing, setPlaying] = useState(false);
  const [activeLine, setActiveLine] = useState(-1);
  const [stop, setStop] = useState<(() => void) | null>(null);
  const available = speechAvailable();

  useEffect(() => () => stop?.(), [stop]);

  function play() {
    stop?.();
    setPlaying(true);
    const cancel = speakLines(
      audio.lines,
      audio.speed,
      setActiveLine,
      () => {
        setPlaying(false);
        setActiveLine(-1);
      }
    );
    setStop(() => cancel);
  }

  function stopPlaying() {
    stop?.();
    setPlaying(false);
    setActiveLine(-1);
  }

  return (
    <section className={styles.card} aria-labelledby={`audio-${audio.id}`}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Audio · {audio.id}</p>
          <h3 id={`audio-${audio.id}`} className={styles.title}>
            {audio.title}
          </h3>
          <p className={styles.meta}>
            {[audio.level, audio.duration, audio.speed].filter(Boolean).join(" · ")}
          </p>
        </div>
        {available && audio.lines.length > 0 ? (
          <button type="button" className={styles.play} onClick={playing ? stopPlaying : play}>
            {playing ? "Detener" : "Escuchar"}
          </button>
        ) : (
          <span className={styles.unavailable}>Audio no disponible</span>
        )}
      </div>

      <p className={styles.notice}>
        Voz sintética del navegador. El timbre puede variar según el dispositivo; no representa un acento regional.
      </p>

      <div className={styles.transcript} aria-label="Transcripción del audio">
        {audio.lines.map((line, index) => (
          <p key={`${line.segment ?? ""}-${index}`} className={index === activeLine ? styles.active : undefined}>
            {line.segment && (index === 0 || audio.lines[index - 1]?.segment !== line.segment) && (
              <span className={styles.segment}>{line.segment}</span>
            )}
            {line.speaker && <strong>{line.speaker}: </strong>}
            {line.text}
            {line.stageDirections.length > 0 && (
              <span className={styles.direction}> ({line.stageDirections.join(", ")})</span>
            )}
          </p>
        ))}
      </div>
    </section>
  );
}
