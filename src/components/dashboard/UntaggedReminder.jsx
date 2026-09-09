import { Microscope } from "lucide-react";
import { Card, Pill } from "../ui/primitives.jsx";
import { representativeGames } from "../../lib/gameModel.js";
import { findUntaggedDeathGames } from "../../lib/untaggedGames.js";

/** Rappel — jamais un lien profond vers la modale d'analyse (elle vit dans GamesHistory,
 * pas ici) : juste une liste des dates concernées, pour aller les classer soi-même
 * dans l'historique via la loupe. Purement informationnel. */
export default function UntaggedReminder({ data, sorted }) {
  const repSorted = representativeGames(sorted, !!data.settings.includeExcludedGames);
  const games = findUntaggedDeathGames(repSorted);
  if (!games.length) return null;

  return (
    <Card className="p-4 mb-6" style={{ borderColor: "rgba(212,175,55,0.4)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <Microscope size={16} color="var(--gold)" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 12.5, color: "var(--text)" }}>
        {games.length} game{games.length > 1 ? "s" : ""} avec des morts non classées — à taguer via la loupe dans l'historique tant que c'est frais :
      </span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {games.map((g) => (
          <Pill key={g.id} tone="gold">{g.date}</Pill>
        ))}
      </div>
    </Card>
  );
}
