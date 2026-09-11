import { useState } from "react";
import { champColor } from "../constants/roster.js";
import { useDdragonVersion } from "../hooks/useDdragonVersion.js";
import { useChampionIndex } from "../hooks/useChampionIndex.js";

/**
 * Icône Data Dragon du champion, avec repli sur les initiales colorées.
 * `ddragonId` (identifiant Data Dragon direct, ex: "MonkeyKing") prend le pas sur `name`
 * quand l'appelant le connaît déjà (ex: champ select, qui a l'id sous la main) — sinon
 * déduit dynamiquement depuis `name` via l'index Data Dragon complet (voir
 * lib/championIndex.js), qui couvre tous les champions, pas seulement une petite liste.
 */
export default function ChampAvatar({ name, ddragonId, size = 32 }) {
  const [failed, setFailed] = useState(false);
  const ddragonVersion = useDdragonVersion();
  const { byName } = useChampionIndex();
  const ddragon = ddragonId || byName.get(name);
  const color = champColor(name);

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
      src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${ddragon}.png`}
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
