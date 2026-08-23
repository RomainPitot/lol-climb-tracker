import { useState, useEffect, useCallback, useMemo } from "react";
import { loadState, saveState, emptyState } from "../lib/storage.js";
import { applyLpChange, recomputeCurrentRank, sortByDate } from "../lib/rank.js";
import { uid } from "../lib/format.js";

/**
 * Source unique de vérité de l'app : charge l'état depuis localStorage,
 * expose les mutations, et persiste après chaque changement.
 *
 * Invariant : `currentRank` est toujours recalculé depuis les games — jamais
 * dérivé à la main — pour que suppression et édition restent cohérentes.
 */
export function useTrackerData() {
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(loadState());
  }, []);

  const save = useCallback((next) => {
    setData(next);
    saveState(next);
  }, []);

  const actions = useMemo(() => {
    if (!data) return null;

    /** Applique un patch puis resynchronise le rang courant sur la liste de games. */
    const commitGames = (games, extra = {}) =>
      save({ ...data, ...extra, games, currentRank: recomputeCurrentRank(games, data.historical) });

    return {
      addGame(partial) {
        const rankBefore = data.currentRank;
        const rankAfter = applyLpChange(rankBefore, partial.lpChange);
        const game = {
          id: uid(),
          rankBeforeTier: rankBefore.tier,
          rankBeforeDiv: rankBefore.div,
          lpBefore: rankBefore.lp,
          rankAfterTier: rankAfter.tier,
          rankAfterDiv: rankAfter.div,
          lpAfter: rankAfter.lp,
          ...partial,
        };
        commitGames([...data.games, game]);
      },

      updateGame(id, patch) {
        const games = data.games.map((g) => {
          if (g.id !== id) return g;
          const merged = { ...g, ...patch };
          // Le rang de départ de la game est figé : seul le rang d'arrivée se recalcule.
          const before = { tier: g.rankBeforeTier, div: g.rankBeforeDiv, lp: g.lpBefore };
          const after = applyLpChange(before, merged.lpChange);
          return { ...merged, rankAfterTier: after.tier, rankAfterDiv: after.div, lpAfter: after.lp };
        });
        commitGames(games);
      },

      deleteGame(id) {
        commitGames(data.games.filter((g) => g.id !== id));
      },

      deleteGames(ids) {
        commitGames(data.games.filter((g) => !ids.includes(g.id)));
      },

      /** Ajoute des games importées en ignorant celles dont le matchId est déjà connu. */
      importGames(games) {
        const known = new Set(data.games.map((g) => g.matchId).filter(Boolean));
        const fresh = games.filter((g) => !g.matchId || !known.has(g.matchId));
        commitGames([...data.games, ...fresh]);
        return fresh.length;
      },

      addGoal(goal) {
        save({ ...data, goals: [...data.goals, { id: uid(), createdAt: new Date().toISOString(), ...goal }] });
      },

      deleteGoal(id) {
        save({ ...data, goals: data.goals.filter((g) => g.id !== id) });
      },

      setHistorical(historical) {
        save({
          ...data,
          historical,
          // Sans game trackée, le rang courant vient de l'historique : il faut le rafraîchir.
          currentRank: data.games.length ? data.currentRank : recomputeCurrentRank([], historical),
        });
      },

      setThresholds(thresholds) {
        save({ ...data, thresholds });
      },

      setCurrentRank(rank) {
        save({ ...data, currentRank: rank });
      },

      setSettings(patch) {
        save({ ...data, settings: { ...data.settings, ...patch } });
      },

      resetAll() {
        save(emptyState());
      },
    };
  }, [data, save]);

  const sorted = useMemo(() => (data ? sortByDate(data.games) : []), [data]);

  return { data, sorted, actions, loaded: data !== null };
}
