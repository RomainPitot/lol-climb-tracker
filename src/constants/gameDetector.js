/**
 * Libellés français pour la phase de jeu renvoyée par GameDetectorLol (/status,
 * gameflow-phase du client LoL) — remplace la notification Discord : la phase (et le
 * chargement terminé ou pas, voir gameLoaded) s'affiche en direct dans l'app à la place.
 * Partagé entre ChampSelectPage et le statut de Paramètres pour rester cohérent.
 */
export const GAME_PHASE_LABEL = {
  None: "En attente d'une partie",
  Lobby: "Dans le lobby",
  Matchmaking: "Recherche de partie…",
  ReadyCheck: "Partie trouvée — accepte !",
  ChampSelect: "Sélection des champions",
  InProgress: "Chargement de la partie…",
  WaitingForStats: "Fin de partie — calcul des stats…",
  PreEndOfGame: "Fin de partie",
  EndOfGame: "Résultats de la partie",
};

/** Libellé le plus lisible pour la phase+chargement actuels — "En jeu" prime sur le
 * libellé générique "Chargement..." de InProgress une fois gameLoaded confirmé. `phase`
 * vaut `null` (pas juste absent du client, voir notifier.py) tant que le client LoL lui-même
 * n'est pas détecté du tout — traité comme "None" plutôt qu'un "Statut inconnu" trompeur. */
export function gamePhaseLabel(phase, gameLoaded) {
  if (phase === "InProgress" && gameLoaded) return "En jeu — GL HF !";
  if (!phase) return GAME_PHASE_LABEL.None;
  return GAME_PHASE_LABEL[phase] || phase;
}
