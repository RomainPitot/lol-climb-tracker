import { useEffect, useRef, useState } from "react";
import { fetchStatus, fetchChampSelectSession } from "../lib/gameDetector.js";

const STATUS_POLL_MS = 2500;
const CHAMPSELECT_POLL_MS = 1000;

/**
 * Statut + session de champ select du script local, tant qu'il reste joignable sur le
 * réseau (voir lib/gameDetector.js). Deux cadences volontairement différentes : le statut
 * seul (savoir si on est en champ select) n'a pas besoin d'être rafraîchi souvent, la
 * session elle-même (timer, picks des autres) doit l'être pour ne pas rater son tour.
 */
export function useChampSelect(host, token) {
  const [connected, setConnected] = useState(false);
  const [phase, setPhase] = useState(null);
  const [session, setSession] = useState(null);
  const [sessionError, setSessionError] = useState("");
  const inChampSelect = phase === "ChampSelect";

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const body = await fetchStatus(host);
        if (cancelled) return;
        setConnected(true);
        setPhase(body.phase || null);
      } catch {
        if (!cancelled) {
          setConnected(false);
          setPhase(null);
        }
      }
    };
    poll();
    const id = setInterval(poll, STATUS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [host]);

  // Évite de garder l'ancienne session affichée si on ressort du champ select entre deux
  // vérifications (victoire du dodge, retour au lobby...).
  const wasInChampSelect = useRef(false);
  useEffect(() => {
    if (!inChampSelect && wasInChampSelect.current) {
      setSession(null);
      setSessionError("");
    }
    wasInChampSelect.current = inChampSelect;
  }, [inChampSelect]);

  useEffect(() => {
    if (!inChampSelect || !connected) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const s = await fetchChampSelectSession(host, token);
        if (cancelled) return;
        setSession(s);
        setSessionError("");
      } catch (e) {
        if (!cancelled) setSessionError(e.message || "Erreur");
      }
    };
    poll();
    const id = setInterval(poll, CHAMPSELECT_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [inChampSelect, connected, host, token]);

  return { connected, phase, inChampSelect, session, sessionError };
}
