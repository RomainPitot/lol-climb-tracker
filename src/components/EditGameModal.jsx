import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { Btn } from "./ui/primitives.jsx";
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
          <button
            onClick={onCancel}
            aria-label="Fermer"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 8,
              color: "var(--dim)",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
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
