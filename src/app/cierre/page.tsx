import { getUnit } from "@/lib/curriculum";
import CourseNotebook from "@/components/closure/CourseNotebook";

export default function CourseClosurePage() {
  const unit = getUnit("B1-B2-U16");
  const sessionFive = unit?.sessions.find((item) => item.slug === "s5");
  const sessionOne = unit?.sessions.find((item) => item.slug === "s1");
  const fullQuote =
    sessionFive?.rawMarkdown.match(
      />\s*\*«(Hace cuatro meses[\s\S]+?Unidad 1\.)»\*/
    )?.[1]?.replace(/\n>\s*/g, " ") ??
    "Lo que queda ya no es un curso: es vivir en el idioma.";
  const shortQuote =
    sessionOne?.rawMarkdown.match(
      /\*«(Hace cuatro meses[\s\S]+?)»\*/
    )?.[1]?.replace(/\n>\s*/g, " ") ??
    "Hace cuatro meses no sabías qué era el subjuntivo. Hoy lo usas en siete contextos distintos.";

  return <CourseNotebook fullQuote={fullQuote} shortQuote={shortQuote} />;
}
