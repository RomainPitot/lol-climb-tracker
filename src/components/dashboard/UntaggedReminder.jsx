import { Microscope } from "lucide-react";
import { Card, Pill } from "../ui/primitives.jsx";
import { representativeGames } from "../../lib/gameModel.js";
import { findUntaggedDeathGames } from "../../lib/untaggedGames.js";

/** Rappel — cliquer une date ouvre directement l'analyse détaillée de cette game (voir
 * Dashboard.jsx, qui fait le pont vers GamesHistory où vit la modale). */
export default function UntaggedReminder({ data, sorted, onSelectGame }) {
  const repSorted = representativeGames(sorted, !!data.settings.includeExcludedGames);
  const games = findUntaggedDeathGames(repSorted);
  if (!games.length) return null;

  return (
    <Card className="p-4 mb-6" style={{ borderColor: "rgba(212,175,55,0.4)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <Microscope size={16} color="var(--gold)" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 12.5, color: "var(--text)" }}>
        {games.length} game{games.length > 1 ? "s" : ""} avec des morts non classées — clique une date pour l'ouvrir directement :
      </span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => onSelectGame?.(g.id)}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
            aria-label={`Ouvrir l'analyse de la game du ${g.date}`}
          >
            <Pill tone="gold">{g.date}</Pill>
          </button>
        ))}
      </div>
    </Card>
  );
}
