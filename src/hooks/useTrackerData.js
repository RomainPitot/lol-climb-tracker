import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { loadState, saveState, emptyState } from "../lib/storage.js";
import { applyLpChange, recomputeCurrentRank, sortByDate } from "../lib/rank.js";
import { uid } from "../lib/format.js";

/**
 * Source unique de vérité de l'app : charge l'état depuis localStorage,
 * expose les mutations, et persiste après chaque changement.
 *
 * Invariant : `currentRank` est toujours recalculé depuis les games — jamais
 * dérivé à la main — pour que suppression et édition restent cohérentes.
 *
 * Les actions lisent `dataRef.current` (mis à jour de façon synchrone dans `save`)
 * plutôt que le `data` capturé par le rendu. Sans ça, un flux qui enchaîne plusieurs
 * mutations après un `await` (ex: import Riot : réglages, puis games, puis rang) verrait
 * chaque appel repartir d'un instantané périmé et écraser le résultat du précédent —
 * bug observé en usage réel : l'import annonçait un succès mais les games n'étaient
 * jamais réellement conservées après rechargement.
 */
export function useTrackerData() {
  const [data, setData] = useState(null);
  const dataRef = useRef(null);

  useEffect(() => {
    const initial = loadState();
    dataRef.current = initial;
    setData(initial);
  }, []);

  const save = useCallback((next) => {
    dataRef.current = next;
    setData(next);
    saveState(next);
  }, []);

  const actions = useMemo(() => {
    /** Applique un patch puis resynchronise le rang courant sur la liste de games. */
    const commitGames = (games, extra = {}) => {
      const cur = dataRef.current;
      save({ ...cur, ...extra, games, currentRank: recomputeCurrentRank(games, cur.historical) });
    };

    return {
      addGame(partial) {
        const cur = dataRef.current;
        const rankBefore = cur.currentRank;
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
        commitGames([...cur.games, game]);
      },

      updateGame(id, patch) {
        const cur = dataRef.current;
        const games = cur.games.map((g) => {
          if (g.id !== id) return g;
          // Une correction manuelle remplace une éventuelle estimation automatique (import
          // Riot) : la game devient une valeur confirmée par l'utilisateur, plus une estimation.
          const merged = { ...g, ...patch, lpEstimated: false };
          // Le rang de départ de la game est figé : seul le rang d'arrivée se recalcule.
          const before = { tier: g.rankBeforeTier, div: g.rankBeforeDiv, lp: g.lpBefore };
          const after = applyLpChange(before, merged.lpChange);
          return { ...merged, rankAfterTier: after.tier, rankAfterDiv: after.div, lpAfter: after.lp };
        });
        commitGames(games);
      },

      deleteGame(id) {
        commitGames(dataRef.current.games.filter((g) => g.id !== id));
      },

      deleteGames(ids) {
        commitGames(dataRef.current.games.filter((g) => !ids.includes(g.id)));
      },

      /** Ajoute des games importées en ignorant celles dont le matchId est déjà connu. */
      importGames(games) {
        const cur = dataRef.current;
        const known = new Set(cur.games.map((g) => g.matchId).filter(Boolean));
        const fresh = games.filter((g) => !g.matchId || !known.has(g.matchId));
        commitGames([...cur.games, ...fresh]);
        return fresh.length;
      },

      /** Import Riot : combine games + rang resynchronisé + PUUID en un seul `save`. */
      importRiotResult({ puuid, games, rank }) {
        const cur = dataRef.current;
        const known = new Set(cur.games.map((g) => g.matchId).filter(Boolean));
        const fresh = games.filter((g) => !g.matchId || !known.has(g.matchId));
        const newGames = [...cur.games, ...fresh];
        save({
          ...cur,
          ...(puuid ? { settings: { ...cur.settings, riotPuuid: puuid } } : {}),
          games: newGames,
          currentRank: rank || recomputeCurrentRank(newGames, cur.historical),
        });
        return fresh.length;
      },

      addGoal(goal) {
        const cur = dataRef.current;
        save({ ...cur, goals: [...cur.goals, { id: uid(), createdAt: new Date().toISOString(), ...goal }] });
      },

      deleteGoal(id) {
        const cur = dataRef.current;
        save({ ...cur, goals: cur.goals.filter((g) => g.id !== id) });
      },

      setHistorical(historical) {
        const cur = dataRef.current;
        save({
          ...cur,
          historical,
          // Sans game trackée, le rang courant vient de l'historique : il faut le rafraîchir.
          currentRank: cur.games.length ? cur.currentRank : recomputeCurrentRank([], historical),
        });
      },

      setThresholds(thresholds) {
        save({ ...dataRef.current, thresholds });
      },

      setCurrentRank(rank) {
        save({ ...dataRef.current, currentRank: rank });
      },

      setSettings(patch) {
        const cur = dataRef.current;
        save({ ...cur, settings: { ...cur.settings, ...patch } });
      },

      /** Ajoute un champion à la pool "à essayer" d'un rôle (voir TierlistPage). Sans effet
       * s'il y est déjà — évite les doublons plutôt que de les filtrer à l'affichage. */
      addToPool(role, champId) {
        const cur = dataRef.current;
        const list = cur.championPool[role] || [];
        if (list.includes(champId)) return;
        save({ ...cur, championPool: { ...cur.championPool, [role]: [...list, champId] } });
      },

      removeFromPool(role, champId) {
        const cur = dataRef.current;
        const list = cur.championPool[role] || [];
        const weights = { ...(cur.championWeights[role] || {}) };
        delete weights[champId];
        save({
          ...cur,
          championPool: { ...cur.championPool, [role]: list.filter((c) => c !== champId) },
          championWeights: { ...cur.championWeights, [role]: weights },
        });
      },

      /**
       * Système de "pity" de la roulette (voir lib/rarity.js) : à chaque tirage, le gagnant
       * revient à 0 et tous les autres champions du rôle gagnent +1 miss (donc +1% de chance
       * relative la prochaine fois). Appelé au moment du tirage, pas à la fin de l'animation —
       * la probabilité doit être mise à jour même si l'utilisateur change de page en cours de route.
       */
      recordRouletteSpin(role, winnerId) {
        const cur = dataRef.current;
        const poolIds = cur.championPool[role] || [];
        const prev = cur.championWeights[role] || {};
        const next = {};
        for (const id of poolIds) next[id] = id === winnerId ? 0 : (prev[id] || 0) + 1;
        save({ ...cur, championWeights: { ...cur.championWeights, [role]: next } });
      },

      resetAll() {
        save(emptyState());
      },
    };
  }, [save]);

  const sorted = useMemo(() => (data ? sortByDate(data.games) : []), [data]);

  return { data, sorted, actions, loaded: data !== null };
}
