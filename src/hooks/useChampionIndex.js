import { useEffect, useState } from "react";
import { getChampionIndex, onChampionIndexReady } from "../lib/championIndex.js";

/** Correspondance nom ↔ identifiant Data Dragon pour tous les champions — vide au
 * premier rendu, se met à jour tout seul une fois le fetch résolu (voir lib/championIndex.js). */
export function useChampionIndex() {
  const [index, setIndex] = useState(getChampionIndex());
  useEffect(() => onChampionIndexReady(setIndex), []);
  return index;
}
