import { useState } from "react";
import { PlusCircle, Check } from "lucide-react";
import { SectionTitle, Btn } from "../components/ui/primitives.jsx";
import GameFormFields from "../components/GameFormFields.jsx";
import { emptyGame } from "../lib/gameModel.js";

export default function AddGame({ addGame }) {
  const [g, setG] = useState(emptyGame());
  const [showOptional, setShowOptional] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setG((p) => ({ ...p, [k]: v }));

  const submit = () => {
    if (!g.champion || g.duration <= 0) return;
    addGame(g);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
    setG(emptyGame());
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <SectionTitle sub="Renseigne juste le gain/perte de LP — le rang se met à jour tout seul.">
        Ajouter une game
      </SectionTitle>

      <GameFormFields g={g} set={set} showOptional={showOptional} setShowOptional={setShowOptional} />

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Btn variant="primary" onClick={submit}>
          <PlusCircle size={14} /> Enregistrer la game
        </Btn>
        {saved && (
          <span style={{ color: "var(--win)", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
            <Check size={14} /> Game enregistrée
          </span>
        )}
      </div>
    </div>
  );
}
