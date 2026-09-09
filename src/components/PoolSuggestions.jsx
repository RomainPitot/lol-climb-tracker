import { useMemo } from "react";
import { Card, Eyebrow, Pill } from "./ui/primitives.jsx";
import ChampAvatar from "./ChampAvatar.jsx";
import { poolRoleFor, rankPoolForMatchup } from "../lib/poolAdvice.js";

/**
 * Suggestions de pick depuis la pool du joueur (data.championPool, voir TierlistPage) —
 * classées par historique perso de matchup contre l'adversaire de lane déjà révélé quand
 * il y en a un (voir lib/poolAdvice.js) ; sinon juste listées dans l'ordre de la pool, sans
 * jugement inventé. La composition alliée est affichée à titre d'info seulement — jamais
 * un jugement automatique sur "ce qu'il manque à l'équipe" (pas de source fiable pour ça).
 */
export default function PoolSuggestions({ session, byKey, championPool, sorted, me, unavailableIds }) {
  const role = poolRoleFor(me?.assignedPosition);
  const champions = useMemo(() => {
    const list = Object.values(byKey);
    return Object.fromEntries(list.map((c) => [c.id, c.name]));
  }, [byKey]);

  if (!role) return null;
  const poolIds = championPool?.[role] || [];
  if (!poolIds.length) return null;

  // Adversaire de même rôle assigné, une fois son pick révélé — même logique que
  // MatchupAnalysis (byKey keyed par champKey numérique, pas par id texte).
  const enemyLaner = (session.theirTeam || []).find((p) => p.assignedPosition === me.assignedPosition);
  const enemyLanerName = enemyLaner ? byKey[enemyLaner.championId]?.name : null;

  const availablePoolIds = poolIds.filter((id) => {
    const numericKey = Object.values(byKey).find((c) => c.id === id)?.champKey;
    return !unavailableIds?.has(numericKey);
  });
  const nameById = new Map(availablePoolIds.map((id) => [champions[id], id]).filter(([n]) => n));
  const poolNames = [...nameById.keys()];
  const ranked = rankPoolForMatchup(poolNames, enemyLanerName, sorted);

  const allyNames = (session.myTeam || [])
    .filter((p) => p.cellId !== session.localPlayerCellId)
    .map((p) => byKey[p.championId]?.name)
    .filter(Boolean);

  if (!ranked.length) return null;

  return (
    <Card className="p-4 mt-4">
      <Eyebrow style={{ marginBottom: 6 }}>Suggestions depuis ta pool ({role})</Eyebrow>
      <p style={{ fontSize: 11.5, color: "var(--dim)", marginBottom: 10 }}>
        {enemyLanerName
          ? `Classées par ton historique perso vs ${enemyLanerName} — sans historique suffisant, un champion reste juste non classé.`
          : "Adversaire de lane pas encore révélé — liste non classée."}
        {allyNames.length > 0 && ` Composition alliée actuelle : ${allyNames.join(", ")}.`}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {ranked.map(({ champion, stats }) => (
          <div
            key={champion}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: 64 }}
          >
            <ChampAvatar ddragonId={nameById.get(champion)} name={champion} size={38} />
            <span style={{ fontSize: 9.5, color: "var(--dim)", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 60 }}>
              {champion}
            </span>
            {stats ? (
              <Pill tone={stats.wr >= 50 ? "win" : "loss"}>{Math.round(stats.wr)}%</Pill>
            ) : (
              <span style={{ fontSize: 9.5, color: "var(--dim)" }}>—</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
