import { useMemo, useState } from "react";
import { Card, Eyebrow, ToggleChip, Select } from "../ui/primitives.jsx";
import { representativeGames } from "../../lib/gameModel.js";
import { collectHeatmapPoints, toScreen } from "../../lib/heatmap.js";

const SIZE = 320;
const TYPE_OPTIONS = [
  { id: "deaths", label: "Morts", color: "var(--loss)" },
  { id: "wards", label: "Wards posées", color: "#5AC8FA" },
  { id: "objectives", label: "Objectifs pris", color: "var(--gold)" },
];

/**
 * Repère la carte Summoner's Rift, dessinée à la main (pas d'image externe — cohérent avec
 * le reste de l'app, qui ne dépend d'aucune texture Riot pour son rendu) : juste assez pour
 * situer visuellement les points, jamais présentée comme une reproduction fidèle. Les
 * positions viennent de la Timeline (voir lib/heatmap.js) — rien n'est affiché pour une
 * game sans timeline stockée (anciennes games, ou échec de récupération).
 */
export default function MapHeatmap({ data, sorted }) {
  const [activeTypes, setActiveTypes] = useState(() => new Set(["deaths"]));
  const [champion, setChampion] = useState("");

  const repSorted = useMemo(
    () => representativeGames(sorted, !!data.settings.includeExcludedGames),
    [sorted, data.settings.includeExcludedGames]
  );

  const champions = useMemo(
    () => [...new Set(repSorted.map((g) => g.champion).filter(Boolean))].sort(),
    [repSorted]
  );

  const points = useMemo(
    () => collectHeatmapPoints(repSorted, { champion: champion || undefined, types: [...activeTypes] }),
    [repSorted, champion, activeTypes]
  );

  const hasAnyTimeline = useMemo(() => repSorted.some((g) => g.timelineSummary), [repSorted]);

  const toggleType = (id) =>
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Card className="p-5 mb-5">
      <Eyebrow style={{ marginBottom: 6 }}>Heatmap morts / wards / objectifs</Eyebrow>
      <p style={{ fontSize: 12.5, color: "var(--dim)", marginBottom: 14 }}>
        Repère un comportement spatial répété (ex : mourir toujours au même endroit de la rivière) — carte
        stylisée, pas une texture Riot, juste pour situer les points.
      </p>

      {!hasAnyTimeline ? (
        <div style={{ fontSize: 12, color: "var(--dim)", padding: 12 }}>
          Aucune game avec timeline stockée pour l'instant — la heatmap se remplira au fil des games importées.
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
            {TYPE_OPTIONS.map((t) => (
              <ToggleChip key={t.id} active={activeTypes.has(t.id)} onClick={() => toggleType(t.id)}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.color, display: "inline-block" }} />
                  {t.label}
                </span>
              </ToggleChip>
            ))}
            <Select value={champion} onChange={(e) => setChampion(e.target.value)} style={{ width: "auto", marginLeft: "auto" }}>
              <option value="">Tous les champions</option>
              {champions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ borderRadius: 10, background: "#0e1f14" }}>
              {/* Rivière (diagonale bas-gauche → haut-droite, approximative). */}
              <polygon
                points={`0,${SIZE} ${SIZE * 0.62},0 ${SIZE},0 ${SIZE},${SIZE * 0.38} ${SIZE * 0.38},${SIZE} `}
                fill="#173a52"
                opacity={0.55}
              />
              {/* Bases. */}
              <circle cx={SIZE * 0.1} cy={SIZE * 0.9} r={SIZE * 0.09} fill="#2563eb" opacity={0.3} />
              <circle cx={SIZE * 0.9} cy={SIZE * 0.1} r={SIZE * 0.09} fill="#dc2626" opacity={0.3} />
              {/* Fosses Dragon / Baron. */}
              <circle cx={(9800 / 14820) * SIZE} cy={SIZE - (4400 / 14820) * SIZE} r={7} fill="none" stroke="var(--gold)" strokeOpacity={0.4} />
              <circle cx={(4900 / 14820) * SIZE} cy={SIZE - (10900 / 14820) * SIZE} r={7} fill="none" stroke="var(--gold)" strokeOpacity={0.4} />

              {points.map((p, i) => {
                const s = toScreen(p, SIZE);
                const color = TYPE_OPTIONS.find((t) => t.id === (p.type === "death" ? "deaths" : p.type === "ward" ? "wards" : "objectives"))?.color;
                return <circle key={i} cx={s.x} cy={s.y} r={3.5} fill={color} opacity={0.55} />;
              })}
            </svg>
          </div>
          <div style={{ fontSize: 10.5, color: "var(--dim)", marginTop: 8, textAlign: "center" }}>
            {points.length} point(s) affiché(s) — base bleue en bas à gauche, base rouge en haut à droite.
          </div>
        </>
      )}
    </Card>
  );
}
