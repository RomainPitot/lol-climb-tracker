import { useEffect, useRef, useState } from "react";

/**
 * Enveloppe un contenu qui scrolle horizontalement (overflowX: auto) avec un léger fondu
 * sur les bords tant qu'il reste du contenu à découvrir dans cette direction — sans ça, la
 * seule preuve qu'un tableau scrolle est une fine barre de défilement, facile à rater
 * (trouvé en testant le Dashboard en 375px : PopulationReference.jsx scrolle bien, mais
 * rien ne le suggère avant d'essayer). `bg` doit correspondre au fond réel du conteneur
 * (var(--card) par défaut — le fond de Card "raised", le cas le plus courant) pour que le
 * fondu se fonde dedans plutôt que de trancher dessus.
 */
export default function ScrollFadeX({ children, bg = "var(--card)", style, className }) {
  const ref = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setAtStart(el.scrollLeft <= 1);
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    };
    update();
    el.addEventListener("scroll", update);
    // Le contenu (ex: un tableau dont les colonnes dépendent des données affichées) peut
    // changer de largeur sans redimensionnement de fenêtre — ResizeObserver plutôt qu'un
    // simple listener "resize", pour rester correct même dans ce cas.
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <div ref={ref} className={className} style={{ overflowX: "auto", ...style }}>
        {children}
      </div>
      {!atStart && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 24,
            background: `linear-gradient(to right, ${bg}, transparent)`,
            pointerEvents: "none",
          }}
        />
      )}
      {!atEnd && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: 24,
            background: `linear-gradient(to left, ${bg}, transparent)`,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
