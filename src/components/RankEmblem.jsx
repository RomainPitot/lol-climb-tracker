import { useState } from "react";
import { Trophy } from "lucide-react";
import { TIER_COLORS, TIER_ICON, rankEmblemUrl } from "../constants/ranks.js";

/**
 * Vrai emblème de rang LoL (Community Dragon), avec repli sur l'icône générique + couleur
 * si l'image échoue (CDN externe, hors de notre contrôle) — même principe que ChampAvatar
 * pour les icônes de champion.
 *
 * Rendu en `background-image` plutôt qu'un simple `<img>` : l'écusson ne remplit qu'une
 * petite portion (environ un tiers, centrée) de l'image source fournie par Community
 * Dragon — le reste est du remplissage transparent. Un simple `object-fit: contain`
 * l'aurait donc affiché minuscule dans les tailles utilisées ici ; `background-size`/
 * `background-position` zooment et recadrent sur la zone où se trouve réellement l'écusson
 * (mesuré empiriquement sur plusieurs paliers, centre légèrement au-dessus du milieu).
 */
export default function RankEmblem({ tier, size = 32, dim = false }) {
  const [failed, setFailed] = useState(false);
  const url = rankEmblemUrl(tier);
  const Icon = TIER_ICON[tier] || Trophy;
  const c = TIER_COLORS[tier] || "var(--dim)";

  if (!url || failed) {
    return <Icon size={size * 0.55} color={c} style={{ opacity: dim ? 0.45 : 1, flexShrink: 0 }} />;
  }

  return (
    <>
      {/* Invisible : seul moyen fiable de détecter un échec de chargement (background-image
          n'a pas d'événement onError) pour basculer sur l'icône de repli ci-dessus. */}
      <img src={url} alt="" aria-hidden="true" onError={() => setFailed(true)} style={{ display: "none" }} />
      <div
        role="img"
        aria-label={tier}
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          backgroundImage: `url(${url})`,
          backgroundSize: "300% 300%",
          backgroundPosition: "50% 48%",
          backgroundRepeat: "no-repeat",
          opacity: dim ? 0.45 : 1,
          filter: dim ? "saturate(0.6)" : "none",
        }}
      />
    </>
  );
}
