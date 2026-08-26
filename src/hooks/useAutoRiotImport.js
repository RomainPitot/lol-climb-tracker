import { useEffect, useRef } from "react";
import { fetchRiotGames } from "../lib/riotApi.js";
import { RIOT_REGIONS } from "../constants/riot.js";

const POLL_INTERVAL_MS = 5 * 60 * 1000;
// Lots volontairement petits en vérification auto : ici la fraîcheur prime sur le
// rattrapage — un gros compte serait redondant avec l'import manuel (voir Paramètres).
const AUTO_CHECK_COUNT = 5;

/**
 * Vérifie périodiquement (tant que l'onglet reste ouvert — ce n'est pas un service en
 * arrière-plan) si de nouvelles games SoloQ sont disponibles, et les importe silencieusement.
 * Activé via le réglage `riotAutoImport`.
 *
 * Le vrai bénéfice n'est pas la fraîcheur pour elle-même : en vérifiant souvent, chaque lot
 * importé ne contient presque jamais plus d'une game neuve, ce qui rend le LP estimé (voir
 * estimateLpChanges dans riotApi.js) exact plutôt qu'approximatif — un import manuel groupé
 * après plusieurs games ne peut structurellement pas offrir cette précision.
 */
export function useAutoRiotImport(data, actions) {
  // Toujours à jour, contrairement à des valeurs capturées par le rendu au moment où
  // l'effet s'est monté : sans ça, le tick planifié à t+5min agirait sur un état périmé.
  const ref = useRef({ data, actions, running: false, didInitialCheck: false });
  ref.current.data = data;
  ref.current.actions = actions;

  useEffect(() => {
    const tick = async () => {
      const { data: cur, actions: act, running } = ref.current;
      if (running || !cur || !act) return;

      const s = cur.settings;
      if (!s.riotAutoImport) return;
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
        const result = await fetchRiotGames(conn, existingMatchIds, cur.currentRank);
        const importedCount = act.importRiotResult({ puuid: result.puuid, games: result.games, rank: result.rank });
        act.setSettings({
          riotLastAutoCheck: new Date().toISOString(),
          riotLastAutoError: "",
          riotLastAutoCount: importedCount,
        });
      } catch (e) {
        // Échec silencieux (pas d'alerte intrusive) : la prochaine vérification réessaiera
        // dans 5 minutes. Le détail reste consultable dans Paramètres si besoin.
        act.setSettings({ riotLastAutoCheck: new Date().toISOString(), riotLastAutoError: e.message || "échec" });
      } finally {
        ref.current.running = false;
      }
    };

    // Un check immédiat dès que `data` est chargé (utile si le réglage était déjà activé la
    // dernière fois) — pas au tout premier rendu, où `data` vaut encore `null` le temps que
    // useTrackerData lise le localStorage — puis un toutes les POLL_INTERVAL_MS tant que
    // l'onglet reste ouvert. Le tableau de dépendances [Boolean(data)] fait justement
    // re-tourner cet effet (donc relancer ce check immédiat) au moment précis où `data`
    // passe de `null` à sa vraie valeur.
    if (data && !ref.current.didInitialCheck) {
      ref.current.didInitialCheck = true;
      tick();
    }
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(data)]);
}
