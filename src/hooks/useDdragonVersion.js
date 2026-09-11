import { useEffect, useState } from "react";
import { getDdragonVersion, onDdragonVersionReady } from "../lib/ddragonVersion.js";

/** Version Data Dragon courante, mise à jour une fois le fetch résolu (voir lib/ddragonVersion.js) —
 * rend d'abord avec le repli codé en dur, puis se remet à jour tout seul si une version plus
 * récente est disponible (quasi instantané, l'utilisateur ne voit jamais le repli en pratique). */
export function useDdragonVersion() {
  const [version, setVersion] = useState(getDdragonVersion());
  useEffect(() => onDdragonVersionReady(setVersion), []);
  return version;
}
