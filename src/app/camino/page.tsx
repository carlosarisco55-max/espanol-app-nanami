import { getUnitIndex } from "@/lib/curriculum";
import CaminoView from "./CaminoView";

export default function CaminoPage() {
  const index = getUnitIndex();
  return <CaminoView index={index} />;
}
