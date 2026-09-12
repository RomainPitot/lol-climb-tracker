import { useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { IconBtn } from "./ui/primitives.jsx";
import { CHANGELOG } from "../constants/changelog.js";

/** Nouveautés du site — voir constants/changelog.js pour ajouter une entrée. Simple liste
 * statique (pas de backend pour un vrai flux) : suffisant pour un journal de version, pas
 * pensé pour du contenu qui changerait en dehors d'un déploiement. */
export default function ChangelogPanel({ onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nouveautés"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fade-in"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 150,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          maxHeight: "80vh",
          overflowY: "auto",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: 22,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--display)", fontWeight: 700, fontSize: 17, color: "var(--text)" }}>
            <Sparkles size={16} color="var(--gold)" /> Nouveautés
          </div>
          <IconBtn
            onClick={onClose}
            aria-label="Fermer"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 7 }}
          >
            <X size={15} />
          </IconBtn>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {CHANGELOG.map((entry) => (
            <div key={entry.id}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{entry.title}</span>
                <span className="tnum" style={{ fontSize: 11, color: "var(--dim)" }}>{entry.date}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                {entry.items.map((item, i) => (
                  <li key={i} style={{ fontSize: 12.5, color: "var(--dim)", lineHeight: 1.5 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
