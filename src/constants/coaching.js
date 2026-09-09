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

/**
 * Disponibilité de Flash (ou autre summoner défensif clé) au moment d'une mort — pas dans
 * l'API Riot sous aucune forme (deaths[].flashAvailable de la Timeline reste toujours null,
 * voir lib/riotTimeline.js), donc un tag manuel optionnel : un signal à vérifier soi-même,
 * jamais une conclusion automatique — le joueur/coach garde la classification finale.
 */
export const FLASH_AVAILABILITY = [
  { id: "yes", label: "Dispo" },
  { id: "no", label: "Pas dispo" },
  { id: "unknown", label: "Je ne sais plus" },
];

/**
 * Tag manuel "build réel vs plan de matchup" (voir lib/matchupNotes.js) — pas de
 * comparaison automatique possible (le plan recommandé est du texte libre, pas une liste
 * d'ids d'item), donc un jugement du joueur/coach après avoir mis les deux côte à côte.
 */
export const BUILD_VS_PLAN_TAGS = [
  { id: "optimal", label: "Optimal" },
  { id: "acceptable", label: "Acceptable" },
  { id: "bad_build", label: "Mauvais build" },
  { id: "bad_timing", label: "Mauvais timing" },
];

/**
 * Draft (voir GameAnalysisModal, section "Draft") — 100% manuel, la Timeline/le match Riot
 * ne disent rien de la logique de composition. Win conditions : plusieurs possibles par
 * comp (multi-select), le reste : un seul tag qui reflète le jugement du joueur après coup.
 * Règle explicite du GDD à respecter dans toute l'app : ne jamais transformer
 * automatiquement une défaite en "draft diff" — ce tag reste toujours posé à la main.
 */
export const DRAFT_WIN_CONDITIONS = ["Scaling", "Engage", "Disengage", "Peel", "Poke", "Siège", "Split push"];

export const DRAFT_OUTCOME_TAGS = [
  { id: "correct", label: "Draft correcte" },
  { id: "problematic", label: "Draft problématique" },
  { id: "bad_execution", label: "Bonne draft, mauvaise exécution" },
  { id: "wincon_missed", label: "Condition de victoire non respectée" },
];

/** Fonction stratégique réelle du joueur dans la comp — peut différer du rôle officiel
 * (ex: un support engage vs un support peel/enchanteur). */
export const COMP_FUNCTIONS = [
  { id: "carry", label: "Carry" },
  { id: "frontline", label: "Frontline / Tank" },
  { id: "engage", label: "Engage" },
  { id: "peel", label: "Peel" },
  { id: "setup", label: "Setup / Enchanteur" },
  { id: "other", label: "Autre" },
];
