/**
 * Diagramme original illustrant la structure d'une page de runes : arbre primaire (rune
 * clé + 3 mineures) et arbre secondaire (2 runes parmi deux slots), plus les stat shards.
 */
export default function RunesDiagram() {
  const W = 640;
  const H = 220;

  const primary = [
    { x: 90, y: 40, r: 16, label: "Rune clé", primary: true },
    { x: 190, y: 40, r: 10, label: "Mineure" },
    { x: 250, y: 40, r: 10, label: "Mineure" },
    { x: 310, y: 40, r: 10, label: "Mineure" },
  ];
  const secondary = [
    { x: 460, y: 40, r: 10, label: "Secondaire" },
    { x: 520, y: 40, r: 10, label: "Secondaire" },
  ];
  const shards = [
    { x: 150, y: 150, label: "Attaque/adaptatif" },
    { x: 280, y: 150, label: "Vitesse/résist." },
    { x: 410, y: 150, label: "Vie/résist." },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 560 }}>
      <text x={20} y={15} fontSize="11" fill="var(--gold)" fontWeight="700">Arbre primaire</text>
      {primary.map((r, i) => (
        <g key={i}>
          <circle cx={r.x} cy={r.y} r={r.r} fill={r.primary ? "var(--gold)" : "none"} stroke="var(--gold)" strokeWidth={2} opacity={r.primary ? 0.85 : 0.6} />
          <text x={r.x} y={r.y + r.r + 14} fontSize="9.5" fill="var(--dim)" textAnchor="middle">{r.label}</text>
        </g>
      ))}

      <line x1={370} y1={40} x2={430} y2={40} stroke="var(--border)" strokeWidth={2} strokeDasharray="4 3" />

      <text x={440} y={15} fontSize="11" fill="#5AC8FA" fontWeight="700">Arbre secondaire</text>
      {secondary.map((r, i) => (
        <g key={i}>
          <circle cx={r.x} cy={r.y} r={r.r} fill="none" stroke="#5AC8FA" strokeWidth={2} opacity={0.7} />
          <text x={r.x} y={r.y + r.r + 14} fontSize="9.5" fill="var(--dim)" textAnchor="middle">{r.label}</text>
        </g>
      ))}

      <text x={20} y={110} fontSize="11" fill="var(--dim)" fontWeight="700">Stat shards</text>
      {shards.map((s, i) => (
        <g key={i}>
          <rect x={s.x - 34} y={128} width={68} height={22} rx={6} fill="var(--bg-elevated)" stroke="var(--border)" />
          <text x={s.x} y={143} fontSize="9" fill="var(--text)" textAnchor="middle">{s.label}</text>
        </g>
      ))}

      <text x={20} y={195} fontSize="10" fill="var(--dim)">
        La rune clé (arbre primaire) définit l'identité de la build — le reste l'accompagne.
      </text>
    </svg>
  );
}
