/**
 * Listes fermées pour la classification manuelle des morts (voir GameAnalysisModal) — ce
 * que la Timeline Riot ne peut jamais dire elle-même (pourquoi, pas juste où/quand), donc
 * réservé au joueur/coach qui a vécu la game. Reste facultatif : une mort non classée
 * garde juste son contexte automatique (position, gold, killer...).
 */
export const DEATH_TYPES = [
  { id: "avoidable", label: "Évitable" },
  { id: "necessary", label: "Nécessaire" },
  { id: "teamplay", label: "Liée au jeu d'équipe" },
  { id: "unclear", label: "Incertaine" },
];

export const DEATH_CAUSES = [
  { id: "overextend_no_vision", label: "Overextend sans vision" },
  { id: "bad_trade", label: "Mauvais trade" },
  { id: "ignored_cooldown", label: "Ignorance d'un cooldown ennemi" },
  { id: "bad_positioning", label: "Mauvais positionnement" },
  { id: "bad_teamfight_positioning", label: "Mauvais positionnement en teamfight" },
  { id: "bad_damage_calc", label: "Mauvais calcul de dégâts" },
  { id: "bad_timing", label: "Mauvais timing" },
  { id: "bad_wave_management", label: "Mauvaise gestion de wave" },
  { id: "bad_recall", label: "Mauvais recall" },
  { id: "greed", label: "Greed" },
  { id: "wrong_objective_contest", label: "Contest objectif incorrect" },
  { id: "missed_objective_call", label: "Baron/Dragon call raté" },
  { id: "bad_roam", label: "Mauvais roam" },
  { id: "bad_rotation", label: "Mauvaise rotation" },
  { id: "mechanical_error", label: "Erreur mécanique" },
  { id: "comm_error", label: "Erreur de communication" },
  { id: "ally_error", label: "Erreur d'un allié" },
  { id: "other", label: "Autre" },
];

/**
 * Notes tactiques manuelles (wave/recall/roam/teamfight) — la Timeline Riot n'expose
 * AUCUN de ces événements directement (contrairement aux morts/objectifs/wards), donc rien
 * à automatiser ici : ce sont des tags 100% posés par le joueur/coach, volontairement
 * réduits à quelques boutons + une liste courte pour rester rapides à saisir juste après
 * la game (voir GameAnalysisModal) plutôt qu'un formulaire long.
 */
export const TACTICAL_NOTE_TYPES = [
  { id: "wave", label: "Wave" },
  { id: "recall", label: "Recall" },
  { id: "roam", label: "Roam" },
  { id: "teamfight", label: "Teamfight" },
];

export const TACTICAL_NOTE_VALUES = {
  wave: ["Freeze", "Slow push", "Fast push", "Neutre", "Crash", "Bounce", "Reset"],
  recall: ["Optimal", "Acceptable", "Mauvais", "Très mauvais"],
  roam: ["Réussi", "Neutre", "Raté", "Très coûteux"],
  teamfight: ["Bon fight", "Mauvais fight", "Nécessaire", "Évitable"],
};
