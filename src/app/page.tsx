"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { readProfile, saveProfile, type NivelMcer, type Profile } from "@/lib/profile";

const NIVELES: NivelMcer[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState<NivelMcer>("B1");
  const [profesion, setProfesion] = useState("");
  const [gustos, setGustos] = useState("");

  useEffect(() => {
    const existing = readProfile();
    if (existing) {
      router.replace("/camino");
      return;
    }
    setChecking(false);
  }, [router]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const profile: Profile = {
      nombre: nombre.trim(),
      nivel,
      profesion: profesion.trim(),
      gustos: gustos.trim()
    };
    saveProfile(profile);
    router.push("/camino");
  }

  if (checking) {
    return <div className={styles.loading} />;
  }

  return (
    <main className={styles.screen}>
      <section className={`${styles.masthead} grain`}>
        <span className={styles.mark} aria-hidden="true">
          始
        </span>
        <div className={styles.mastheadTop}>
          <p className={styles.wordmark}>Nanami</p>
          <h1 className={styles.headline}>Empieza tu español hoy.</h1>
        </div>
        <p className={styles.mastheadFoot}>
          16 unidades, de B1 a B2. Sin clases, sin prisa — a tu ritmo.
        </p>
      </section>

      <section className={styles.formSide}>
        <div className={styles.formCard}>
          <p className={styles.eyebrow}>Antes de empezar</p>
          <h2 className={styles.title}>Cuéntame quién eres</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>¿Cómo te llamas?</span>
            <input
              className={styles.input}
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nanami"
              required
            />
          </label>

          <div className={styles.field}>
            <span className={styles.label}>Tu nivel actual de español</span>
            <div className={styles.levelGrid}>
              {NIVELES.map((n) => (
                <button
                  type="button"
                  key={n}
                  className={`${styles.levelOption} ${n === nivel ? styles.levelOptionActive : ""}`}
                  onClick={() => setNivel(n)}
                  aria-pressed={n === nivel}
                >
                  {n}
                </button>
              ))}
            </div>
            <span className={styles.hint}>Si no lo sabes, elige B1 — es el punto de partida del curso.</span>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>¿A qué te dedicas? (opcional)</span>
            <input
              className={styles.input}
              type="text"
              value={profesion}
              onChange={(e) => setProfesion(e.target.value)}
              placeholder="Diseñadora, enfermera, estudiante…"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>¿Qué te gusta? (opcional)</span>
            <textarea
              className={styles.textarea}
              value={gustos}
              onChange={(e) => setGustos(e.target.value)}
              placeholder="Cocinar, tejer, la naturaleza, dormir…"
              rows={2}
            />
            <span className={styles.hint}>
              Nunca cambia la dificultad ni las respuestas — solo da sabor a algún ejemplo puntual.
            </span>
          </label>

          <p className={styles.privacy}>
            Tu progreso se guarda solo en este navegador. Cada cinco sesiones te pediremos una copia, por si
            cambias de aparato.
          </p>

          <button type="submit" className={styles.submit}>
            Empezar el camino
          </button>
        </form>
        </div>
      </section>
    </main>
  );
}
