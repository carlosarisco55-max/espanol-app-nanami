import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { getUnit } from "@/lib/curriculum";

export default async function UnitPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  const unit = getUnit(unitId);

  if (!unit) notFound();

  return (
    <main className={styles.page}>
      <Link href="/camino" className={styles.back}>
        ← Volver al camino
      </Link>

      <header className={styles.header}>
        <div className={styles.levels}>
          {unit.levelIn && <span className={styles.levelPill}>{unit.levelIn}</span>}
          {unit.levelOut && unit.levelOut !== unit.levelIn && (
            <span className={styles.levelPill}>→ {unit.levelOut}</span>
          )}
        </div>
        <h1 className={styles.title}>{unit.title}</h1>
        {unit.subtitle && <p className={styles.subtitle}>{unit.subtitle}</p>}
        {unit.quote && <p className={styles.quote}>{unit.quote}</p>}
      </header>

      {unit.canDos.length > 0 && (
        <>
          <h2 className={styles.sectionTitle} style={{ textAlign: "center" }}>
            Al terminar esta unidad, vas a poder…
          </h2>
          <ul className={styles.canDoList}>
            {unit.canDos.map((item) => (
              <li key={item.index} className={styles.canDoItem}>
                <span className={styles.canDoMark}>✓</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className={styles.sectionTitle} style={{ textAlign: "center" }}>
        Las 5 sesiones
      </h2>
      <nav className={styles.sessionNav}>
        {unit.sessions.map((session) => (
          <Link key={session.slug} href={`/unidades/${unit.unitId}/${session.slug}`} className={styles.sessionLink}>
            <>
              <span className={styles.sessionNumber}>S{session.number}</span>
              <span className={styles.sessionTitle}>{session.title}</span>
            </>
          </Link>
        ))}
      </nav>
    </main>
  );
}
