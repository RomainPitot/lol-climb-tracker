import { useMemo, useState } from "react";
import { Card, Eyebrow, Select } from "./ui/primitives.jsx";
import AiCoachPanel from "./AiCoachPanel.jsx";
import { matchupsFor } from "../lib/matchups.js";
import { matchupNotesFor } from "../lib/matchupNotes.js";
import { buildMatchupAdvicePrompt } from "../lib/matchupAdvice.js";

/**
 * "Comment gagner ce matchup" — combine l'historique perso chiffré (lib/matchups.js) et le
 * plan de lane déjà enregistré (lib/matchupNotes.js) en un prompt court, plutôt que de faire
 * deviner un conseil générique à l'IA. Liste des adversaires : ceux déjà rencontrés en game
 * et/ou déjà préparés via un plan, pour ne jamais proposer un adversaire inconnu des deux.
 */
export default function MatchupAdviceCard({ champion, sorted, data }) {
  const opponents = useMemo(() => {
    const fromGames = matchupsFor(sorted, champion).map((m) => m.opponent);
    const fromNotes = matchupNotesFor(data.matchupNotes, champion).map((n) => n.opponent);
    return [...new Set([...fromGames, ...fromNotes])].sort();
  }, [sorted, champion, data.matchupNotes]);

  const [selected, setSelected] = useState("");
  if (!opponents.length) return null;
  // Retombe sur le premier adversaire dès que la sélection n'est plus valide (changement de
  // champion actif, ou liste vidée) plutôt que de garder un select vide/périmé.
  const opponent = opponents.includes(selected) ? selected : opponents[0];

  return (
    <Card className="p-4 my-5">
      <Eyebrow style={{ marginBottom: 10 }}>Comment gagner ce matchup</Eyebrow>
      <div style={{ marginBottom: 12, maxWidth: 260 }}>
        <Select value={opponent} onChange={(e) => setSelected(e.target.value)}>
          {opponents.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </Select>
      </div>
      <AiCoachPanel
        buildPrompt={() => buildMatchupAdvicePrompt(champion, opponent, sorted, data.matchupNotes)}
        buttonLabel={`Comment battre ${opponent}`}
        resultTitle="Conseil de matchup"
      />
    </Card>
  );
}
