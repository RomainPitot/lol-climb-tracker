import { Card, Eyebrow, Pill } from "./ui/primitives.jsx";
import AiCoachPanel from "./AiCoachPanel.jsx";
import ChampAvatar from "./ChampAvatar.jsx";
import { computeAgg } from "../lib/stats.js";
import { gameLine } from "../lib/coachRecap.js";
import { round1, round2 } from "../lib/format.js";

const BASELINE_WINDOW = 10;

/**
 * Bilan de fin de game ("bordereau") : compare la toute dernière game trackée à la
 * moyenne des BASELINE_WINDOW précédentes (elle exclue), et prépare un prompt à coller
 * dans une IA pour un verdict structuré — bons points, points à améliorer, une seule
 * chose à corriger au prochain pick. Toujours la DERNIÈRE game trackée, pour rester dans
 * l'esprit "juste après avoir joué" même si les games arrivent par lots via l'import auto.
 */
export default function GameRecapCard({ sorted }) {
  if (!sorted.length) return null;
  const last = sorted[sorted.length - 1];
  const baseline = sorted.slice(Math.max(0, sorted.length - 1 - BASELINE_WINDOW), sorted.length - 1);
  const baseAgg = computeAgg(baseline);

  const buildPrompt = () => {
    const csmin = last.duration ? last.cs / last.duration : 0;
    return `=== DERNIÈRE GAME JOUÉE ===
${gameLine(last)}

=== MOYENNE DES ${baseline.length} GAMES PRÉCÉDENTES (référence) ===
KDA ${round2(baseAgg.kda)} — CS/min ${round1(baseAgg.csmin)} — Deaths/game ${round1(baseAgg.deaths)} — Dégâts/game ${Math.round(baseAgg.damageGame)} — Vision/game ${round1(baseAgg.visionGame)} — Winrate ${round1(baseAgg.wr)}%

=== CETTE GAME EN DÉTAIL ===
CS/min : ${round1(csmin)} (référence ${round1(baseAgg.csmin)})
Deaths : ${last.deaths} (référence ${round1(baseAgg.deaths)})
Vision : ${last.visionScore} (référence ${round1(baseAgg.visionGame)})

=== DEMANDE ===
Fais le bilan de CETTE game précisément (pas de généralités sur mon profil) : 2-3 bons
points concrets, 2-3 points à améliorer concrets, et un verdict en une phrase. Format :
### Bons points
### Points à améliorer
### Verdict`;
  };

  return (
    <Card className="p-5 mt-5">
      <Eyebrow style={{ marginBottom: 10 }}>Bilan de ta dernière game</Eyebrow>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <ChampAvatar name={last.champion} size={34} />
        <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text)" }}>{last.champion}</span>
        <Pill tone={last.win ? "win" : "loss"}>{last.win ? "Victoire" : "Défaite"}</Pill>
        <span style={{ fontSize: 12.5, color: "var(--dim)" }}>
          {last.kills}/{last.deaths}/{last.assists}
        </span>
        <span
          className="tnum"
          style={{ fontSize: 12.5, fontWeight: 600, color: last.lpChange >= 0 ? "var(--win)" : "var(--loss)" }}
        >
          {last.lpChange >= 0 ? "+" : ""}
          {last.lpChange} LP
        </span>
        <span style={{ fontSize: 11.5, color: "var(--dim)", marginLeft: "auto" }}>{last.date}</span>
      </div>

      <AiCoachPanel
        buildPrompt={buildPrompt}
        buttonLabel="Générer le bilan de cette game"
        resultTitle="Prompt du bilan de game"
      />
    </Card>
  );
}
