import { getUnit } from "@/lib/curriculum";
import CourseNotebook from "@/components/closure/CourseNotebook";

export default function CourseClosurePage() {
  const unit = getUnit("B1-B2-U16");
  const session = unit?.sessions.find((item) => item.slug === "s5");
  const closingMessage =
    session?.rawMarkdown.match(
      />\s*\*«(Hace cuatro meses[\s\S]+?Unidad 1\.)»\*/
    )?.[1]?.replace(/\n>\s*/g, " ") ??
    "Lo que queda ya no es un curso: es vivir en el idioma.";

  return <CourseNotebook closingMessage={closingMessage} />;
}
