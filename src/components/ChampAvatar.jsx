import { useState } from "react";
import { DDRAGON_VERSION, CHAMP_DDRAGON, champColor } from "../constants/roster.js";

/**
 * Icône Data Dragon du champion, avec repli sur les initiales colorées.
 * `ddragonId` (identifiant Data Dragon direct, ex: "MonkeyKing") prend le pas sur `name` —
 * utile pour un champion hors du roster suivi par l'app (ex: TierlistPage), où il n'y a pas
 * d'entrée dans CHAMP_DDRAGON pour le retrouver à partir de son nom affiché.
 */
export default function ChampAvatar({ name, ddragonId, size = 32 }) {
  const [failed, setFailed] = useState(false);
  const ddragon = ddragonId || CHAMP_DDRAGON[name];
  const color = ddragonId ? "var(--gold)" : champColor(name);

  if (!ddragon || failed) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          background: `${color}22`,
          border: `1.5px solid ${color}55`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontFamily: "var(--display)",
          fontWeight: 700,
          fontSize: size * 0.36,
          color,
        }}
      >
        {(name || "?").slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${ddragon}.png`}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        border: `1.5px solid ${color}55`,
        background: "var(--bg-elevated)",
        flexShrink: 0,
        objectFit: "cover",
      }}
    />
  );
}
