/**
 * Diagramme original (carte stylisée, pas une capture du jeu) illustrant vision offensive
 * (côté adverse) vs défensive (côté allié) vs control ward (près d'un objectif).
 */
export default function VisionDiagram() {
  const W = 640;
  const H = 260;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 560 }}>
      <rect x={0} y={0} width={W} height={H} rx={12} fill="#0e1f14" />
      <polygon points={`0,${H} ${W * 0.62},0 ${W},0 ${W},${H * 0.38} ${W * 0.38},${H}`} fill="#173a52" opacity={0.5} />
      <circle cx={W * 0.1} cy={H * 0.9} r={W * 0.07} fill="#2563eb" opacity={0.3} />
      <circle cx={W * 0.9} cy={H * 0.1} r={W * 0.07} fill="#dc2626" opacity={0.3} />
      <circle cx={W * 0.66} cy={H * 0.3} r={9} fill="none" stroke="var(--gold)" strokeOpacity={0.5} />
      <text x={W * 0.66} y={H * 0.3 - 16} fontSize="9.5" fill="var(--gold)" textAnchor="middle">Objectif</text>

      {/* Ward défensive — proche base alliée */}
      <circle cx={W * 0.24} cy={H * 0.7} r={7} fill="#2563eb" />
      <text x={W * 0.24} y={H * 0.7 + 18} fontSize="9.5" fill="var(--text)" textAnchor="middle">Défensive</text>

      {/* Ward offensive — bush côté adverse */}
      <circle cx={W * 0.78} cy={H * 0.55} r={7} fill="#dc2626" />
      <text x={W * 0.78} y={H * 0.55 + 18} fontSize="9.5" fill="var(--text)" textAnchor="middle">Offensive</text>

      {/* Control ward — près de l'objectif */}
      <circle cx={W * 0.66} cy={H * 0.42} r={8} fill="#A970FF" />
      <text x={W * 0.66} y={H * 0.42 + 20} fontSize="9.5" fill="var(--text)" textAnchor="middle">Control ward</text>

      <text x={16} y={H - 12} fontSize="10" fill="var(--dim)">
        Défensive = protège ton territoire · Offensive = éclaire l'adversaire · Control = détruit les wards ennemies à proximité
      </text>
    </svg>
  );
}
