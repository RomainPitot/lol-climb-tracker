import { AreaChart, Area, XAxis, YAxis, ReferenceArea, ReferenceLine, Tooltip, ResponsiveContainer } from "recharts";
import { EmptyChart } from "../ui/primitives.jsx";
import { rankLabel } from "../../lib/rank.js";

const TOOLTIP_STYLE = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--text)",
};

/**
 * Extrait de Dashboard.jsx (voir le lazy() qui charge ce fichier) — recharts + ses
 * dépendances d3 (victory-vendor) forment de très loin le plus gros chunk du site
 * (~380 Ko / 105 Ko gzip), chargé jusqu'ici de façon synchrone dès l'ouverture du
 * Dashboard (la page par défaut) alors que rien d'autre sur la page n'en a besoin.
 * Isolé ici pour que ce poids se télécharge en parallèle, sans retarder le rendu du
 * reste de la page — le poids total téléchargé au final ne change pas (recharts reste
 * la bonne lib pour ce graphe), seul le moment où il bloque quelque chose change.
 */
export default function LpProgressChart({ lpSeries, lpBands }) {
  if (!(lpSeries.length > 1 && lpBands)) {
    return <EmptyChart label="Ajoute au moins 2 games pour voir la courbe." />;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={lpSeries} margin={{ left: 4, right: 8 }}>
        <defs>
          {/* Courbe : mêmes couleurs que les bandes de fond, en opaque. */}
          <linearGradient id="lpStroke" x1="0" y1="0" x2="0" y2="1">
            {lpBands.gradientStops.map((s, i) => (
              <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={1} />
            ))}
          </linearGradient>
          {/* Remplissage sous la courbe : mêmes arrêts, translucides. */}
          <linearGradient id="lpFill" x1="0" y1="0" x2="0" y2="1">
            {lpBands.gradientStops.map((s, i) => (
              <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={0.22} />
            ))}
          </linearGradient>
        </defs>

        {lpBands.areas.map((a) => (
          <ReferenceArea
            key={a.tier}
            y1={Math.max(a.y1, lpBands.domainMin)}
            y2={Math.min(a.y2, lpBands.domainMax)}
            fill={a.color}
            fillOpacity={0.07}
            stroke="none"
            ifOverflow="hidden"
          />
        ))}
        {lpBands.lines.map((l) => (
          <ReferenceLine
            key={l.score}
            y={l.score}
            stroke={l.color}
            strokeOpacity={0.45}
            strokeDasharray="3 3"
            ifOverflow="hidden"
            label={{ value: l.label, position: "insideLeft", fill: l.color, fontSize: 10.5, fontWeight: 600 }}
          />
        ))}

        <XAxis dataKey="i" stroke="var(--dim)" fontSize={11} tickLine={false} />
        <YAxis hide domain={[lpBands.domainMin, lpBands.domainMax]} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={(v) => `Game #${v}`}
          formatter={(_, __, item) => [
            `${rankLabel(item.payload.tier, item.payload.div)} — ${item.payload.lpAfter} LP`,
            "Rang",
          ]}
        />
        <Area type="monotone" dataKey="lp" stroke="url(#lpStroke)" fill="url(#lpFill)" strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
