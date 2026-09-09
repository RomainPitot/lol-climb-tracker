/**
 * Diagramme original illustrant une fenêtre de trade/all-in : le cooldown d'un sort clé
 * adverse (rouge = indisponible, vert = fenêtre sûre pour trader/all-in).
 */
const TIMELINE = [
  { from: 0, to: 0.35, tone: "unsafe", label: "Sort clé dispo — risqué" },
  { from: 0.35, to: 0.72, tone: "safe", label: "Sort clé en cooldown — fenêtre de trade" },
  { from: 0.72, to: 1, tone: "unsafe", label: "Cooldown qui revient" },
];

export default function TradesDiagram() {
  const W = 640;
  const H = 130;
  const barY = 55;
  const barH = 26;
  const barX0 = 20;
  const barX1 = W - 20;
  const span = barX1 - barX0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 560 }}>
      <text x={barX0} y={20} fontSize="11" fill="var(--dim)">Cooldown du sort clé adverse</text>
      {TIMELINE.map((seg, i) => {
        const x = barX0 + span * seg.from;
        const w = span * (seg.to - seg.from);
        const color = seg.tone === "safe" ? "var(--win)" : "var(--loss)";
        return (
          <g key={i}>
            <rect x={x} y={barY} width={w} height={barH} fill={color} opacity={0.28} stroke={color} strokeWidth={1.5} />
            <text x={x + w / 2} y={barY + barH + 16} fontSize="9" fill="var(--dim)" textAnchor="middle">
              {seg.label}
            </text>
          </g>
        );
      })}
      <text x={barX0} y={H - 8} fontSize="10" fill="var(--dim)">
        Trader/all-in juste après que l'adversaire a utilisé son sort clé — pas au hasard.
      </text>
    </svg>
  );
}
