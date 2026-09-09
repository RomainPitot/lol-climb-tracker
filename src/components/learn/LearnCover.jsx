/**
 * Petite image de présentation par tuto, affichée sur la carte dans la liste Learn — une
 * version condensée (sans texte) des diagrammes détaillés de chaque article, juste pour
 * donner un aperçu visuel avant d'ouvrir. Originaux (SVG dessinés à la main), pas des
 * captures du jeu.
 */
function WaveCover() {
  const dots = [0.22, 0.42, 0.64, 0.86];
  return (
    <svg viewBox="0 0 300 80" width="100%" height="100%" preserveAspectRatio="none">
      <line x1={20} y1={40} x2={280} y2={40} stroke="var(--border)" strokeWidth={3} />
      <circle cx={20} cy={40} r={8} fill="#2563eb" opacity={0.6} />
      <circle cx={280} cy={40} r={8} fill="#dc2626" opacity={0.6} />
      {dots.map((p, i) => (
        <circle key={i} cx={20 + 260 * p} cy={40} r={5} fill="var(--gold)" opacity={0.4 + i * 0.2} />
      ))}
    </svg>
  );
}

function RunesCover() {
  return (
    <svg viewBox="0 0 300 80" width="100%" height="100%" preserveAspectRatio="none">
      <circle cx={70} cy={40} r={16} fill="var(--gold)" opacity={0.85} />
      <circle cx={120} cy={40} r={9} fill="none" stroke="var(--gold)" strokeWidth={2} opacity={0.6} />
      <circle cx={155} cy={40} r={9} fill="none" stroke="var(--gold)" strokeWidth={2} opacity={0.6} />
      <circle cx={190} cy={40} r={9} fill="none" stroke="var(--gold)" strokeWidth={2} opacity={0.6} />
      <line x1={205} y1={40} x2={225} y2={40} stroke="var(--border)" strokeWidth={2} strokeDasharray="4 3" />
      <circle cx={245} cy={40} r={9} fill="none" stroke="#5AC8FA" strokeWidth={2} opacity={0.6} />
      <circle cx={275} cy={40} r={9} fill="none" stroke="#5AC8FA" strokeWidth={2} opacity={0.6} />
    </svg>
  );
}

function VisionCover() {
  return (
    <svg viewBox="0 0 300 80" width="100%" height="100%" preserveAspectRatio="none">
      <rect x={0} y={0} width={300} height={80} fill="#0e1f14" />
      <polygon points="0,80 190,0 300,0 300,30 110,80" fill="#173a52" opacity={0.5} />
      <circle cx={30} cy={65} r={20} fill="#2563eb" opacity={0.25} />
      <circle cx={270} cy={15} r={20} fill="#dc2626" opacity={0.25} />
      <circle cx={75} cy={52} r={6} fill="#2563eb" />
      <circle cx={220} cy={42} r={6} fill="#dc2626" />
      <circle cx={165} cy={30} r={7} fill="#A970FF" />
    </svg>
  );
}

function TradesCover() {
  const segs = [
    { x: 0, w: 90, color: "var(--loss)" },
    { x: 90, w: 130, color: "var(--win)" },
    { x: 220, w: 80, color: "var(--loss)" },
  ];
  return (
    <svg viewBox="0 0 300 80" width="100%" height="100%" preserveAspectRatio="none">
      {segs.map((s, i) => (
        <rect key={i} x={s.x + 10} y={32} width={s.w} height={16} fill={s.color} opacity={0.3} stroke={s.color} strokeWidth={1.5} />
      ))}
    </svg>
  );
}

function MacroCover() {
  return (
    <svg viewBox="0 0 300 80" width="100%" height="100%" preserveAspectRatio="none">
      <rect x={0} y={0} width={300} height={80} fill="#0e1f14" />
      <polygon points="0,80 190,0 300,0 300,30 110,80" fill="#173a52" opacity={0.5} />
      <circle cx={30} cy={65} r={20} fill="#2563eb" opacity={0.25} />
      <circle cx={270} cy={15} r={20} fill="#dc2626" opacity={0.25} />
      <circle cx={70} cy={45} r={6} fill="var(--gold)" />
      <line x1={76} y1={42} x2={195} y2={22} stroke="var(--gold)" strokeWidth={2} strokeDasharray="5 4" opacity={0.7} />
      <circle cx={200} cy={20} r={8} fill="none" stroke="var(--gold)" strokeOpacity={0.7} />
      <rect x={252} y={8} width={14} height={14} fill="#dc2626" opacity={0.7} />
    </svg>
  );
}

export const LEARN_COVERS = {
  wave: WaveCover,
  runes: RunesCover,
  vision: VisionCover,
  trades: TradesCover,
  macro: MacroCover,
};
