import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { getUnit } from "@/lib/curriculum";
import PersonalizedMarkdown from "@/components/PersonalizedMarkdown";
import OrientationToggle from "@/components/OrientationToggle";

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

  return (
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
        <h1 className={styles.heroHeadline}>{session.opening.headline}</h1>
        <OrientationToggle en={session.orientation?.en} ja={session.orientation?.ja} />
        {session.opening.cards && session.opening.cards.length > 0 && (
          <div className={styles.heroCards}>
            {session.opening.cards.map((card, i) => (
              <p key={i} className={styles.heroCard}>
                {card}
              </p>
            ))}
          </div>
        )}
      </section>

      <article className={styles.content}>
        <PersonalizedMarkdown content={session.rawMarkdown} />
      </article>

      <footer className={styles.footerNav}>
        <Link href={`/unidades/${unit.unitId}`}>Índice de la unidad</Link>
        {nextSession && (
          <span style={{ color: "var(--ink-faint)", fontSize: "0.85rem" }}>
            Sesión {nextSession.number}: próximamente
          </span>
        )}
      </footer>
    </main>
  );
}
