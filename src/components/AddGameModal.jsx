import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { Btn, IconBtn } from "./ui/primitives.jsx";
import GameFormFields from "./GameFormFields.jsx";
import { emptyGame } from "../lib/gameModel.js";

/**
 * Saisie manuelle d'une nouvelle game — le mode par défaut de l'app pour qui n'a pas
 * encore configuré l'import Riot API (clé perso + proxy, voir Paramètres). Réutilise
 * GameFormFields, partagé avec EditGameModal ; seule différence : part de emptyGame()
 * plutôt que d'une game existante, et appelle addGame plutôt que updateGame.
 */
export default function AddGameModal({ games = [], onSave, onCancel }) {
  const [g, setG] = useState(emptyGame);
  const [showOptional, setShowOptional] = useState(false);
  const set = (k, v) => setG((p) => ({ ...p, [k]: v }));

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
            Ajouter une game
          </div>
          <IconBtn
            onClick={onCancel}
            aria-label="Fermer"
            style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 8 }}
          >
            <X size={16} />
          </IconBtn>
        </div>

        <GameFormFields g={g} set={set} showOptional={showOptional} setShowOptional={setShowOptional} allGames={games} />

        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="primary" onClick={() => onSave(g)} disabled={!g.champion.trim()}>
            <Check size={14} /> Ajouter la game
          </Btn>
          <Btn onClick={onCancel}>Annuler</Btn>
        </div>
        {!g.champion.trim() && (
          <p style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 8 }}>Renseigne le champion pour pouvoir enregistrer.</p>
        )}
      </div>
    </div>
  );
}
