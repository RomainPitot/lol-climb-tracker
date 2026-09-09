/**
 * Diagramme original (pas une capture du jeu) illustrant les 4 états de wave — une lane
 * simplifiée avec les deux tourelles et la position relative de la wave dans chaque cas.
 */
const STATES = [
  { label: "Freeze", pos: 0.28, note: "Wave stagne près de toi" },
  { label: "Slow push", pos: 0.45, note: "Wave grossit, avance lentement" },
  { label: "Fast push", pos: 0.68, note: "Wave avance vite" },
  { label: "Crash", pos: 0.88, note: "Wave tape la tour adverse" },
];

export default function WaveDiagram() {
  const W = 640;
  const rowH = 54;
  const H = STATES.length * rowH + 30;
  const laneX0 = 60;
  const laneX1 = W - 60;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 560 }}>
      {STATES.map((s, i) => {
        const y = 20 + i * rowH;
        const wx = laneX0 + (laneX1 - laneX0) * s.pos;
        return (
          <g key={s.label}>
            <line x1={laneX0} y1={y} x2={laneX1} y2={y} stroke="var(--border)" strokeWidth={3} />
            <circle cx={laneX0} cy={y} r={9} fill="#2563eb" opacity={0.6} />
            <circle cx={laneX1} cy={y} r={9} fill="#dc2626" opacity={0.6} />
            <circle cx={wx} cy={y} r={6} fill="var(--gold)" />
            <text x={laneX0} y={y - 14} fontSize="11" fill="var(--dim)">{s.label}</text>
            <text x={wx} y={y + 20} fontSize="10" fill="var(--dim)" textAnchor="middle">{s.note}</text>
          </g>
        );
      })}
    </svg>
  );
}
