import { useEffect } from "react";
import { X } from "lucide-react";
import { IconBtn } from "./ui/primitives.jsx";

/** QR code en grand — plus facile à scanner à distance qu'à la petite taille affichée en
 * ligne. Partagé entre GameDetectorSection (Paramètres) et ChampSelectPage (bouton "Lancer"
 * + QR auto). */
export default function QrModal({ dataUrl, onClose, title = "Scanne avec ton téléphone" }) {
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
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fade-in"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{title}</span>
          <IconBtn
            onClick={onClose}
            aria-label="Fermer"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 8 }}
          >
            <X size={16} />
          </IconBtn>
        </div>
        <img
          src={dataUrl}
          alt="QR code de connexion téléphone, en grand"
          width={340}
          height={340}
          style={{ borderRadius: 8, background: "#fff", padding: 12 }}
        />
      </div>
    </div>
  );
}
