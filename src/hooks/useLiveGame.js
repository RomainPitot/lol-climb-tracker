import { useEffect, useState } from "react";
import { fetchLiveGame } from "../lib/gameDetector.js";

const LIVE_GAME_POLL_MS = 2000;

/**
 * État de la partie en cours, tant que `active` est vrai (voir ChampSelectPage — phase
 * "InProgress" + gameLoaded). Cadence plus lente que le champ select (2s vs 1s) : rien
 * n'y est urgent au point de rater une fenêtre d'action comme un pick/ban.
 */
export function useLiveGame(host, token, active) {
  const [liveGame, setLiveGame] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!active) {
      setLiveGame(null);
      setError("");
      return;
    }
    let cancelled = false;
    const poll = async () => {
      try {
        const data = await fetchLiveGame(host, token);
        if (!cancelled) {
          setLiveGame(data);
          setError("");
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Erreur");
      }
    };
    poll();
    const id = setInterval(poll, LIVE_GAME_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [active, host, token]);

  return { liveGame, error };
}
