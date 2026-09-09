/**
 * Diagramme original (carte stylisée) illustrant un roam depuis la lane vers un objectif,
 * puis un siège de tour — trois idées en une carte plutôt que trois diagrammes séparés.
 */
export default function MacroDiagram() {
  const W = 640;
  const H = 260;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 560 }}>
      <rect x={0} y={0} width={W} height={H} rx={12} fill="#0e1f14" />
      <polygon points={`0,${H} ${W * 0.62},0 ${W},0 ${W},${H * 0.38} ${W * 0.38},${H}`} fill="#173a52" opacity={0.5} />
      <circle cx={W * 0.1} cy={H * 0.9} r={W * 0.07} fill="#2563eb" opacity={0.3} />
      <circle cx={W * 0.9} cy={H * 0.1} r={W * 0.07} fill="#dc2626" opacity={0.3} />

      {/* Lane (position de départ du roam) */}
      <circle cx={W * 0.2} cy={H * 0.5} r={7} fill="var(--gold)" />
      <text x={W * 0.2} y={H * 0.5 + 18} fontSize="9.5" fill="var(--text)" textAnchor="middle">Ta lane</text>

      {/* Chemin de roam en pointillés vers l'objectif */}
      <line x1={W * 0.22} y1={H * 0.48} x2={W * 0.63} y2={H * 0.32} stroke="var(--gold)" strokeWidth={2} strokeDasharray="5 4" opacity={0.7} />

      {/* Objectif neutre */}
      <circle cx={W * 0.66} cy={H * 0.3} r={9} fill="none" stroke="var(--gold)" strokeOpacity={0.7} />
      <text x={W * 0.66} y={H * 0.3 - 16} fontSize="9.5" fill="var(--gold)" textAnchor="middle">Objectif</text>

      {/* Tour adverse en siège */}
      <rect x={W * 0.83 - 8} y={H * 0.16 - 8} width={16} height={16} fill="#dc2626" opacity={0.7} />
      <text x={W * 0.83} y={H * 0.16 + 22} fontSize="9.5" fill="var(--text)" textAnchor="middle">Tour en siège</text>

      <text x={16} y={H - 12} fontSize="10" fill="var(--dim)">
        Roam seulement si la wave est crash/fast push — sinon elle traîne pendant ton absence.
      </text>
    </svg>
  );
}
