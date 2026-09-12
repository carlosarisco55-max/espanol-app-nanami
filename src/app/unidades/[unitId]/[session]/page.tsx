import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { getUnit } from "@/lib/curriculum";
import PersonalizedMarkdown from "@/components/PersonalizedMarkdown";
import OrientationToggle from "@/components/OrientationToggle";
import ExerciseRenderer from "@/components/exercises/ExerciseRenderer";
import SessionProgressProvider from "@/components/SessionProgressProvider";
import BackupReminder from "@/components/BackupReminder";
import AudioScript from "@/components/content/AudioScript";
import DeleExamSession from "@/components/dele/DeleExamSession";
import { splitSessionIntoSegments } from "@/lib/session-segments";

export default async function SessionPage({
  params
}: {
  params: Promise<{ unitId: string; session: string }>;
}) {
  const { unitId, session: sessionSlug } = await params;
  const unit = getUnit(unitId);
  if (!unit) notFound();

  const session = unit.sessions.find((s) => s.slug === sessionSlug);
  if (!session) notFound();

  const sessionIndex = unit.sessions.findIndex((s) => s.slug === sessionSlug);
  const nextSession = unit.sessions[sessionIndex + 1];
  const examId = session.exam ? `B1-B2-U16-${session.slug}-exam` : null;
  const interactiveIds = [
    ...session.exercises
      .filter((exercise) => exercise.content !== null)
      .filter((exercise) => !(session.exam && exercise.id === "B1-B2-U16-E14"))
      .map((exercise) => exercise.id),
    ...(examId ? [examId] : [])
  ];
  const isBridgeSession =
    session.slug === "s5" &&
    ["B1-B2-U04", "B1-B2-U08", "B1-B2-U12"].includes(unit.unitId);

  return (
    <SessionProgressProvider
      unitId={unit.unitId}
      sessionSlug={session.slug}
      interactiveIds={interactiveIds}
      totalSessions={unit.sessions.length}
    >
    <main className={styles.page}>
      <Link href={`/unidades/${unit.unitId}`} className={styles.back}>
        ← {unit.title}
      </Link>

      <nav className={styles.outline}>
        {session.outline.map((step) => (
          <span key={step.label} className={styles.outlineStep}>
            <span aria-hidden="true">{step.icon}</span> {step.label}
          </span>
        ))}
      </nav>

      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>
          Sesión {session.number} de 5 · {unit.title}
        </p>
        <h1 className={styles.heroHeadline}>
          {session.exam ? session.titleShort : session.opening.headline}
        </h1>
        <OrientationToggle en={session.orientation?.en} ja={session.orientation?.ja} />
        {!session.exam && session.opening.cards && session.opening.cards.length > 0 && (
          <div className={styles.heroCards}>
            {session.opening.cards.map((card, i) => (
              <p key={i} className={styles.heroCard}>
                {card}
              </p>
            ))}
          </div>
        )}
      </section>

      {isBridgeSession && unit.specialType && (
        <aside className={styles.bridgeBanner}>
          <span className={styles.bridgeEyebrow}>Working across cultures</span>
          <strong>{unit.specialType}</strong>
        </aside>
      )}

      {session.exam ? (
        <DeleExamSession
          session={session}
          unitId={unit.unitId}
          nextSession={nextSession ? { slug: nextSession.slug, number: nextSession.number } : undefined}
        />
      ) : (
        <article className={styles.content}>
          {splitSessionIntoSegments(session.rawMarkdown, session.exercises, session.audios ?? []).map((segment, i) =>
            segment.kind === "markdown" ? (
                <PersonalizedMarkdown key={i} content={segment.text} unitId={unit.unitId} />
            ) : segment.kind === "audio" ? (
              <AudioScript key={segment.audio.id} audio={segment.audio} />
            ) : (
              <ExerciseRenderer key={segment.block.id} block={segment.block} />
            )
          )}
        </article>
      )}

      {!session.exam && <footer className={styles.footerNav}>
        <Link href={`/unidades/${unit.unitId}`}>Índice de la unidad</Link>
        {nextSession && (
          <Link href={`/unidades/${unit.unitId}/${nextSession.slug}`}>
            Continuar a la sesión {nextSession.number} →
          </Link>
        )}
      </footer>}
      <BackupReminder />
    </main>
    </SessionProgressProvider>
  );
}
