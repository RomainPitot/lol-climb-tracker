import { useState } from "react";
import { Swords, Settings as SettingsIcon } from "lucide-react";
import { Card, Btn, SectionTitle } from "../ui/primitives.jsx";
import AddGameModal from "../AddGameModal.jsx";

/**
 * Compte à 0 game : le Dashboard normal affiche quand même Hero (0W/0L), Progression,
 * Succès "0/9", Statistiques à 0% — un mur de zéros décourageant plutôt qu'une invitation
 * à commencer. Le seul vrai bouton d'action existait déjà ("Ajouter une game"), mais en bas
 * de page dans Historique, après tout ce mur. Ici : rien d'autre que l'action, visible sans
 * scroller — le reste du Dashboard n'a de sens qu'à partir de la première game (voir
 * Dashboard.jsx, retour anticipé sur `sorted.length === 0`).
 */
export default function EmptyDashboardState({ addGame, onGoToSettings }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="reveal">
      <SectionTitle sub="Ajoute ta première game pour débloquer le coach, ta progression et tes statistiques.">
        Dashboard
      </SectionTitle>

      <Card className="p-6" style={{ textAlign: "center", maxWidth: 480, margin: "40px auto 0" }}>
        <Swords size={28} color="var(--gold)" style={{ marginBottom: 12 }} />
        <div style={{ fontSize: "var(--fs-lg)", fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
          Aucune game trackée pour l'instant
        </div>
        <p className="prose" style={{ fontSize: "var(--fs-sm)", color: "var(--dim)", marginBottom: 20 }}>
          Le coach automatique, la progression et les statistiques se calculent à partir de tes vraies games —
          rien à montrer avant la première.
        </p>
        <Btn variant="primary" onClick={() => setAdding(true)} style={{ margin: "0 auto" }}>
          <Swords size={14} /> Ajouter ta première game
        </Btn>
        {onGoToSettings && (
          <div style={{ marginTop: 14 }}>
            <Btn variant="ghost" onClick={onGoToSettings} style={{ margin: "0 auto", fontSize: "var(--fs-xs)" }}>
              <SettingsIcon size={12} /> Ou configurer l'import automatique (Riot API)
            </Btn>
          </div>
        )}
      </Card>

      {adding && (
        <AddGameModal games={[]} onCancel={() => setAdding(false)} onSave={(g) => { addGame(g); setAdding(false); }} />
      )}
    </div>
  );
}
