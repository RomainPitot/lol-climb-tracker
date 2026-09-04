import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { Btn, IconBtn } from "./ui/primitives.jsx";
import GameFormFields from "./GameFormFields.jsx";

export default function EditGameModal({ game, onSave, onCancel }) {
  const [g, setG] = useState(game);
  const [showOptional, setShowOptional] = useState(true);
  const set = (k, v) => setG((p) => ({ ...p, [k]: v }));

  // Échap ferme la modale sans enregistrer.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      className="fade-in"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 20px",
        overflowY: "auto",
        zIndex: 50,
      }}
    >
      <div style={{ width: "100%", maxWidth: 820 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
            Modifier la game
          </div>
          <IconBtn
            onClick={onCancel}
            aria-label="Fermer"
            style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 8 }}
          >
            <X size={16} />
          </IconBtn>
        </div>

        <GameFormFields g={g} set={set} showOptional={showOptional} setShowOptional={setShowOptional} />

        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="primary" onClick={() => onSave(g)}>
            <Check size={14} /> Enregistrer les modifications
          </Btn>
          <Btn onClick={onCancel}>Annuler</Btn>
        </div>
      </div>
    </div>
  );
}
