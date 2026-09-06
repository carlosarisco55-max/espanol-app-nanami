import Link from "next/link";
import SpacedQueue from "@/components/srs/SpacedQueue";
import styles from "./page.module.css";

export default function RepasoPage() {
  return (
    <main className={styles.page}>
      <Link href="/camino" className={styles.back}>
        ← Volver al camino
      </Link>
      <p className={styles.eyebrow}>Repaso espaciado</p>
      <h1 className={styles.title}>Lo que toca hoy</h1>
      <p className={styles.intro}>
        Aquí reaparecen los contrastes que te costaron, justo cuando conviene volver a mirarlos.
      </p>
      <SpacedQueue />
    </main>
  );
}
