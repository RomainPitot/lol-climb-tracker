import { useEffect, useState } from "react";
import { Card, Eyebrow, Pill } from "./ui/primitives.jsx";
import AiCoachPanel from "./AiCoachPanel.jsx";
import ChampAvatar from "./ChampAvatar.jsx";
import { computeAgg } from "../lib/stats.js";
import { gameLine } from "../lib/coachRecap.js";
import { representativeGames } from "../lib/gameModel.js";
import { fetchItemNames, fetchRuneTree } from "../lib/ddragon.js";
import { round1, round2 } from "../lib/format.js";

const BASELINE_WINDOW = 10;

/**
 * Bilan de fin de game ("bordereau") : compare la dernière game REPRÉSENTATIVE trackée
 * (une game marquée remake/int/smurf adverse n'a rien à dire sur le niveau réel — voir
 * Paramètres > Statistiques) à la moyenne des BASELINE_WINDOW représentatives précédentes,
 * et prépare un prompt à coller dans une IA pour un verdict structuré. Toujours la
 * dernière trackée (pas juste la dernière du tout), pour rester dans l'esprit "juste
 * après avoir joué" même si les games arrivent par lots via l'import auto.
 */
export default function GameRecapCard({ data, sorted }) {
  const skippedLast = sorted.length && sorted[sorted.length - 1].excluded;
  const repSorted = representativeGames(sorted, !!data.settings.includeExcludedGames);
  const last = repSorted.length ? repSorted[repSorted.length - 1] : null;
  const baseline = last ? repSorted.slice(Math.max(0, repSorted.length - 1 - BASELINE_WINDOW), repSorted.length - 1) : [];
  const baseAgg = computeAgg(baseline);

  // Build/runes sur demande seulement (voir checkbox plus bas) : ça alourdit le prompt,
  // pas utile à chaque bilan. Noms chargés en tâche de fond dès que la game a un build —
  // buildPrompt reste synchrone (AiCoachPanel ne gère pas l'async), donc on a besoin que
  // ce soit déjà prêt avant le clic plutôt que de le charger à ce moment-là. Hooks avant
  // tout early return (règle de React) : `last` peut être null, ils restent no-op alors.
  const [includeBuild, setIncludeBuild] = useState(false);
  const [buildNames, setBuildNames] = useState(null);
  useEffect(() => {
    if (!last?.build) return;
    let cancelled = false;
    (async () => {
      try {
        const [items, tree] = await Promise.all([fetchItemNames(), fetchRuneTree()]);
        if (cancelled) return;
        const runeNames = new Map();
        for (const style of tree) {
          runeNames.set(style.id, style.name);
          for (const slot of style.slots) for (const rune of slot.runes) runeNames.set(rune.id, rune.name);
        }
        setBuildNames({ items, runeNames });
      } catch {
        // best-effort : la checkbox reste juste désactivée si ça échoue
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [last?.build, last?.id]);

  if (!last) return null;

  const buildBlock = () => {
    if (!includeBuild || !last.build || !buildNames) return "";
    const itemNames = last.build.items.map((id) => buildNames.items.get(id)?.name || `#${id}`).join(", ");
    const runeNames = last.build.perkIds.map((id) => buildNames.runeNames.get(id) || `#${id}`).join(", ");
    return `\n=== BUILD & RUNES ===\nItems : ${itemNames || "aucun"}\nRunes : ${runeNames || "aucune"}\n`;
  };

  const buildPrompt = () => {
    const csmin = last.duration ? last.cs / last.duration : 0;
    // Vision comparée en /min, pas en brut : une game de 40 min a mécaniquement un score
    // de vision plus haut qu'une de 20 min, comparer les valeurs brutes fausserait le repère.
    const visionMin = last.duration ? last.visionScore / last.duration : 0;
    return `=== DERNIÈRE GAME JOUÉE ===
${gameLine(last)}
${buildBlock()}
=== MOYENNE DES ${baseline.length} GAMES PRÉCÉDENTES (référence) ===
KDA ${round2(baseAgg.kda)} — CS/min ${round1(baseAgg.csmin)} — Deaths/game ${round1(baseAgg.deaths)} — Dégâts/game ${Math.round(baseAgg.damageGame)} — Score de vision/min ${round1(baseAgg.visionMin)} — Winrate ${round1(baseAgg.wr)}%

=== CETTE GAME EN DÉTAIL ===
CS/min : ${round1(csmin)} (référence ${round1(baseAgg.csmin)})
Deaths : ${last.deaths} (référence ${round1(baseAgg.deaths)})
Score de vision/min : ${round1(visionMin)} (référence ${round1(baseAgg.visionMin)})

=== DEMANDE ===
Fais le bilan de CETTE game précisément (pas de généralités sur mon profil). Si le détail
minute par minute est présent ci-dessus (diffs de lane, morts avec contexte, objectifs,
vision), base-toi dessus en priorité — c'est plus précis que les stats finales seules : cite
des moments concrets (ex: "mort à 14:20 sans ward river" plutôt que "trop de morts").
2-3 bons points concrets, 2-3 points à améliorer concrets, et un verdict en une phrase.
Format :
### Bons points
### Points à améliorer
### Verdict`;
  };

  return (
    <Card className="p-5 mb-5">
      <Eyebrow style={{ marginBottom: 10 }}>Bilan de ta dernière game</Eyebrow>

      {skippedLast && (
        <p style={{ fontSize: 11.5, color: "var(--dim)", marginBottom: 10 }}>
          Ta toute dernière game est marquée non représentative — bilan basé sur la dernière game valable à la place.
        </p>
      )}

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

      {last.build && (
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, fontSize: 12, color: "var(--text)", cursor: buildNames ? "pointer" : "not-allowed" }}>
          <input
            type="checkbox"
            checked={includeBuild}
            disabled={!buildNames}
            onChange={(e) => setIncludeBuild(e.target.checked)}
          />
          Inclure le build & les runes dans le prompt {!buildNames && "(chargement…)"}
        </label>
      )}

      <AiCoachPanel
        buildPrompt={buildPrompt}
        buttonLabel="Générer le bilan de cette game"
        resultTitle="Prompt du bilan de game"
      />
    </Card>
  );
}
