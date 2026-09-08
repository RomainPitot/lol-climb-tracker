import { useEffect, useRef } from "react";
import { DEFAULT_HOST, fetchStatus } from "../lib/gameDetector.js";

const POLL_MS = 2500;

/**
 * Surveille la phase de jeu (GameDetectorLol) indépendamment de la page affichée — comme
 * useAutoRiotImport, tant que cet onglet reste ouvert — pour signaler les trois moments où
 * il y a une vraie urgence à le savoir tout de suite, même si l'utilisateur n'est pas déjà
 * sur la page Sélection de champion : partie trouvée (ready check, expire en quelques
 * secondes), début du chargement, et fin du chargement (vraiment "en jeu").
 *
 * `onAlert(message)` reçoit un texte à afficher/notifier ; pour le ready check uniquement,
 * on bascule aussi automatiquement sur la page Sélection de champion (`navigate`) — les
 * deux autres n'ont rien à y faire tant que l'action n'est pas requise.
 */
export function useGameDetectorAlerts(settings, navigate, onAlert) {
  const ref = useRef({ prevPhase: undefined, prevLoaded: false });

  useEffect(() => {
    const host = settings?.gameDetectorHost || DEFAULT_HOST;
    const paired = !!settings?.gameDetectorToken;
    if (!paired) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const body = await fetchStatus(host);
        if (cancelled) return;
        const phase = body.phase || null;
        const loaded = !!body.gameLoaded;
        const prev = ref.current;

        if (phase === "ReadyCheck" && prev.prevPhase !== "ReadyCheck") {
          onAlert("Partie trouvée ! Accepte ou refuse.");
          navigate("champselect");
        } else if (phase === "InProgress" && prev.prevPhase !== "InProgress") {
          onAlert("Chargement de la partie…");
        } else if (phase === "InProgress" && loaded && !prev.prevLoaded) {
          onAlert("En jeu — GL HF !");
        }

        ref.current = { prevPhase: phase, prevLoaded: loaded };
      } catch {
        // Script injoignable — pas une alerte en soi, le statut de Paramètres/Sélection
        // de champion le montre déjà quand on regarde l'app.
      }
    };
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [settings?.gameDetectorHost, settings?.gameDetectorToken, navigate, onAlert]);
}
