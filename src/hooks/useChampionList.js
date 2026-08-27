import { useEffect, useState } from "react";
import { fetchChampionList } from "../lib/ddragon.js";

/** Liste complète des champions LoL, chargée une fois depuis Data Dragon. */
export function useChampionList() {
  const [champions, setChampions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchChampionList()
      .then((list) => {
        if (!cancelled) setChampions(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "échec du chargement");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { champions, loading, error };
}
