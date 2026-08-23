import { DEFAULT_HISTORICAL, DEFAULT_THRESHOLDS } from "../constants/game.js";
import { recomputeCurrentRank } from "./rank.js";

export const STORAGE_KEY = "lol-climb-tracker-v2";

/** Ancienne clé utilisée par le prototype — migrée automatiquement au premier chargement. */
const LEGACY_KEYS = ["lol-tracker-v2"];

export function emptyState() {
  return {
    games: [],
    goals: [],
    historical: DEFAULT_HISTORICAL,
    thresholds: DEFAULT_THRESHOLDS,
    settings: { seasonStart: new Date().toISOString().slice(0, 10) },
    currentRank: recomputeCurrentRank([], DEFAULT_HISTORICAL),
  };
}

/** Complète un état chargé depuis le disque avec les champs ajoutés après coup. */
function normalize(state) {
  const d = { ...state };
  if (!Array.isArray(d.games)) d.games = [];
  if (!Array.isArray(d.goals)) d.goals = [];
  if (!d.historical) d.historical = DEFAULT_HISTORICAL;
  if (!d.thresholds) d.thresholds = DEFAULT_THRESHOLDS;
  if (!d.settings) d.settings = { seasonStart: new Date().toISOString().slice(0, 10) };
  if (!d.currentRank) d.currentRank = recomputeCurrentRank(d.games, d.historical);
  return d;
}

export function loadState() {
  for (const key of [STORAGE_KEY, ...LEGACY_KEYS]) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) return normalize(JSON.parse(raw));
    } catch {
      // clé illisible ou localStorage indisponible : on tente la suivante
    }
  }
  return emptyState();
}

export function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    // quota dépassé ou navigation privée : l'app continue de fonctionner en mémoire
    return false;
  }
}
