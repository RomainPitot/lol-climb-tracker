import { useEffect, useRef } from "react";
import { fetchRiotGames } from "../lib/riotApi.js";
import { RIOT_REGIONS } from "../constants/riot.js";

// Le scheduler tourne à ce rythme fixe et décide, à chaque passage, si le délai voulu
// est écoulé — plutôt qu'un setInterval à durée fixe, qui ne pourrait pas s'adapter si
// l'utilisateur change l'intervalle en cours de route.
const SCHEDULER_TICK_MS = 30 * 1000;
// Exportée pour que l'UI (RiotImportSection) affiche la même valeur par défaut que celle
// réellement utilisée ici en l'absence de réglage explicite — une seule source de vérité.
// Un seul intervalle, tout le temps (l'ancienne distinction "session active"/"hors
// session" ajoutait un contrôle à gérer pour un gain marginal — un dev key Riot supporte
// largement une vérification toutes les 5 min en continu).
export const DEFAULT_ACTIVE_INTERVAL_MIN = 5;
// Lots volontairement petits en vérification auto : ici la fraîcheur prime sur le
// rattrapage — un gros compte serait redondant avec l'import manuel (voir Paramètres).
const AUTO_CHECK_COUNT = 5;

/**
 * Vérifie périodiquement (tant que l'onglet reste ouvert — ce n'est pas un service en
 * arrière-plan) si de nouvelles games SoloQ sont disponibles, et les importe silencieusement.
 * Activé via le réglage `riotAutoImport`, au rythme de `riotActiveIntervalMin` (réglable).
 *
 * Le vrai bénéfice n'est pas la fraîcheur pour elle-même : en vérifiant souvent, chaque lot
 * importé ne contient presque jamais plus d'une game neuve, ce qui rend le LP estimé (voir
 * estimateLpChanges dans riotApi.js) exact plutôt qu'approximatif — un import manuel groupé
 * après plusieurs games ne peut structurellement pas offrir cette précision.
 */
export function useAutoRiotImport(data, actions) {
  // Toujours à jour, contrairement à des valeurs capturées par le rendu au moment où
  // l'effet s'est monté : sans ça, un tick planifié agirait sur un état périmé.
  const ref = useRef({ data, actions, running: false });
  ref.current.data = data;
  ref.current.actions = actions;

  useEffect(() => {
    const check = async () => {
      const { data: cur, actions: act, running } = ref.current;
      if (running || !cur || !act) return;

      const s = cur.settings;
      if (!s.riotAutoImport) return;

      const intervalMin = Number(s.riotActiveIntervalMin) || DEFAULT_ACTIVE_INTERVAL_MIN;
      const lastCheck = s.riotLastAutoCheck ? new Date(s.riotLastAutoCheck).getTime() : 0;
      if (Date.now() - lastCheck < intervalMin * 60 * 1000) return;

      if (!s.riotGameName || !s.riotTagLine) return;
      if (s.riotMode === "direct" ? !s.riotApiKey : !s.riotProxyUrl) return;

      const region = RIOT_REGIONS.find((r) => r.platform === s.riotPlatform) || RIOT_REGIONS[0];
      const conn = {
        mode: s.riotMode || "proxy",
        apiKey: s.riotApiKey,
        proxyUrl: s.riotProxyUrl,
        proxyToken: s.riotProxyToken,
        gameName: s.riotGameName,
        tagLine: s.riotTagLine,
        platform: region.platform,
        continent: region.continent,
        count: AUTO_CHECK_COUNT,
      };
      const existingMatchIds = new Set(cur.games.map((g) => g.matchId).filter(Boolean));

      ref.current.running = true;
      try {
        const result = await fetchRiotGames(conn, existingMatchIds, cur.currentRank, cur.rankHistory);
        const importedCount = act.importRiotResult({
          puuid: result.puuid,
          games: result.games,
          rank: result.rank,
          rankHistory: result.rankHistory,
        });
        act.setSettings({
          riotLastAutoCheck: new Date().toISOString(),
          riotLastAutoError: "",
          riotLastAutoCount: importedCount,
        });
      } catch (e) {
        // Échec silencieux (pas d'alerte intrusive) : le prochain passage réessaiera. Le
        // détail reste consultable dans Paramètres si besoin.
        act.setSettings({ riotLastAutoCheck: new Date().toISOString(), riotLastAutoError: e.message || "échec" });
      } finally {
        ref.current.running = false;
      }
    };

    check();
    const id = setInterval(check, SCHEDULER_TICK_MS);
    return () => clearInterval(id);
  }, []);
}
