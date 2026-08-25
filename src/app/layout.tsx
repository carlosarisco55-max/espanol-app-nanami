import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nanami — español en movimiento",
  description: "Un camino de español para hablantes de japonés, B1 hacia B2."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
