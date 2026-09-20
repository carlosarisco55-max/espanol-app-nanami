import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ maxWidth: "36rem", margin: "0 auto", padding: "4rem 1.5rem" }}>
      <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "0.75rem" }}>
        Página no encontrada
      </p>
      <h1 style={{ fontSize: "2rem", lineHeight: 1.15 }}>Esta página no existe.</h1>
      <p>Puede que el enlace esté mal o que la sesión aún no esté en el camino.</p>
      <p>
        <Link href="/camino">Volver al camino</Link>
      </p>
    </main>
  );
}
