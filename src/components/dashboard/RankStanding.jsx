import { useState } from "react";
import { Crosshair } from "lucide-react";
import { Btn, Pill, Spinner } from "../ui/primitives.jsx";
import { APEX } from "../../constants/ranks.js";
import { RIOT_REGIONS } from "../../constants/riot.js";
import { fetchApexRank } from "../../lib/apexRank.js";
import { diagnoseRiotError } from "../../lib/riotApi.js";
import { estimatedPercentile, formatPercentile, RANK_DISTRIBUTION_SOURCE } from "../../lib/rankPercentile.js";

/**
 * "Biais motivant" demandé par l'utilisateur (12/09) : se voir situé parmi les autres
 * joueurs, pas seulement à son propre palier. Deux régimes, une seule idée continue :
 * - Sous Master : percentile ESTIMÉ à partir de la distribution publiée (voir
 *   lib/rankPercentile.js) — toujours disponible, calculé localement, jamais un appel API.
 * - Master+ : rang exact réel (voir lib/apexRank.js, league-v4 expose la ladder complète et
 *   triée pour ces 3 tiers) — à la demande seulement (voir le fichier pour pourquoi), mis en
 *   cache dans settings.apexRank jusqu'au prochain clic sur "Actualiser".
 * L'estimation devient un vrai chiffre exactement au moment où le joueur passe Master.
 */
export default function RankStanding({ data, setSettings, currentRank }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const s = data.settings;
  const isApex = APEX.includes(currentRank.tier);

  if (!isApex) {
    const pct = estimatedPercentile(currentRank.tier, currentRank.div);
    if (pct == null) return null;
    return (
      <Pill tone="gold" title={`≈ estimation basée sur la distribution ${RANK_DISTRIBUTION_SOURCE} — pas un calcul individuel exact.`}>
        <Crosshair size={11} style={{ marginRight: 4 }} />≈ top {formatPercentile(pct)}% des joueurs classés
      </Pill>
    );
  }

  const cached = s.apexRank;
  const stale = cached && cached.tier !== currentRank.tier;

  const refresh = async () => {
    if (!s.riotPuuid) {
      setError("Connecte d'abord ton compte Riot dans Paramètres (au moins un import) pour ce chiffre exact.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const region = RIOT_REGIONS.find((r) => r.platform === s.riotPlatform) || RIOT_REGIONS[0];
      const conn = {
        mode: s.riotMode || "proxy",
        apiKey: s.riotApiKey,
        proxyUrl: s.riotProxyUrl,
        proxyToken: s.riotProxyToken,
        platform: region.platform,
      };
      const result = await fetchApexRank(conn, s.riotPuuid);
      setSettings({ apexRank: { ...result, tier: currentRank.tier } });
    } catch (e) {
      setError(e.kind === "not-found" ? e.message : `${e.message} ${diagnoseRiotError(e, s.riotMode)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {cached && (
        <Pill
          tone="gold"
          title={`Calculé le ${new Date(cached.fetchedAt).toLocaleString("fr-FR")}${stale ? " — rang atteint depuis, à réactualiser." : ""}`}
        >
          <Crosshair size={11} style={{ marginRight: 4 }} />
          #{cached.globalRank.toLocaleString("fr-FR")} sur {cached.totalPlayers.toLocaleString("fr-FR")} ({cached.tier}+) — top{" "}
          {formatPercentile(cached.percentile)}%{stale ? " (à jour au dernier calcul)" : ""}
        </Pill>
      )}
      <Btn onClick={refresh} disabled={loading}>
        {loading ? <Spinner size={12} /> : <Crosshair size={12} />} {loading ? "Calcul…" : cached ? "Actualiser" : "Calculer mon rang exact"}
      </Btn>
      {error && <span style={{ fontSize: 11.5, color: "var(--loss)" }}>{error}</span>}
    </div>
  );
}
