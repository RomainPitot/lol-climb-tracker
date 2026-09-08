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
 * Dragon (1280×720) — le reste est du remplissage transparent. Un simple
 * `object-fit: contain` l'aurait donc affiché minuscule dans les tailles utilisées ici.
 *
 * `background-size` prend un pourcentage PAR AXE (largeur/hauteur), chacun relatif à la
 * dimension du conteneur sur cet axe — mettre la même valeur sur les deux axes (ex: 300%
 * 300%) déforme donc l'image dès que le conteneur n'a pas le même ratio qu'elle (ici un
 * conteneur carré contre une source 16:9), ce qui l'étirait verticalement. Les deux
 * pourcentages ci-dessous sont calculés pour zoomer d'un même facteur sur les deux axes
 * (donc sans déformation), en recadrant sur la zone où se trouve réellement l'écusson
 * (mesurée empiriquement sur plusieurs paliers, centre légèrement au-dessus du milieu).
 */
const SOURCE_W = 1280;
const SOURCE_H = 720;
// Fenêtre de recadrage carrée (en pixels de l'image source) assez grande pour contenir
// l'écusson le plus large observé (Challenger, ~320px) avec de la marge.
const CROP_WINDOW = 400;
const BG_SIZE = `${(SOURCE_W / CROP_WINDOW) * 100}% ${(SOURCE_H / CROP_WINDOW) * 100}%`;
// Centre de l'écusson dans l'image source (fraction 0-1) — position background-position
// qui en résulte, dérivée de la formule position% = (centre × zoom − 0.5) / (zoom − 1).
const BG_POSITION = "50% 46%";
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
          backgroundSize: BG_SIZE,
          backgroundPosition: BG_POSITION,
          backgroundRepeat: "no-repeat",
          opacity: dim ? 0.45 : 1,
          filter: dim ? "saturate(0.6)" : "none",
        }}
      />
    </>
  );
}
