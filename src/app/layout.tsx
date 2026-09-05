import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif, Literata } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display-face",
  display: "swap"
});

const literata = Literata({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-reading-face",
  display: "swap"
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-ui-face",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Nanami — español en movimiento",
  description: "Un camino de español para hablantes de japonés, B1 hacia B2."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${instrumentSerif.variable} ${literata.variable} ${instrumentSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
