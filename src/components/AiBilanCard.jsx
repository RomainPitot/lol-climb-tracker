import { useEffect, useState } from "react";
import { Card, Eyebrow, Pill, ToggleChip } from "./ui/primitives.jsx";
import AiCoachPanel from "./AiCoachPanel.jsx";
import ChampAvatar from "./ChampAvatar.jsx";
import { computeAgg, mostFrequentRole } from "../lib/stats.js";
import { buildCoachRecap, gameLine } from "../lib/coachRecap.js";
import { representativeGames } from "../lib/gameModel.js";
import { evaluateCorrection, primaryActiveCorrection, CORRECTION_STATUS_LABEL } from "../lib/corrections.js";
import { summarizeDeathPatterns } from "../lib/deathPatterns.js";
import { buildWeeklyReportPrompt } from "../lib/weeklyReport.js";
import { matchupsFor, MIN_MATCHUP_GAMES } from "../lib/matchups.js";
import { roleBenchmark } from "../constants/ranks.js";
import { fetchItemNames, fetchRuneTree } from "../lib/ddragon.js";
import { gameDate, round1, round2 } from "../lib/format.js";
import { rankLabel } from "../lib/rank.js";

const GAME_BASELINE_WINDOW = 10;
const ACCOUNT_ANALYSIS_WINDOW = 20;

const SCOPES = [
  { id: "game", label: "Dernière game" },
  { id: "account", label: `${ACCOUNT_ANALYSIS_WINDOW} dernières games` },
  { id: "week", label: "Cette semaine" },
];

const SCOPE_DESCRIPTION = {
  game: "Compare ta dernière game représentative aux 10 précédentes : 2-3 bons points concrets, 2-3 points à améliorer, un verdict en une phrase.",
  account: `Sur tes ${ACCOUNT_ANALYSIS_WINDOW} dernières games vs le reste de ton profil : 3 points forts, 3 points faibles priorisés, une action concrète.`,
  week: "Assemble ce que le Dashboard sait déjà (alertes, priorités, correctifs, chiffres clés de la semaine vs la précédente) en un résumé 30 secondes + un plan limité à 1-2 priorités.",
};

/**
 * Bilan de game / Bilan de compte / Rapport hebdomadaire ratissaient en grande partie les
 * mêmes signaux (coach coréen, mêmes libs derrière) avec juste une portée différente
 * (dernière game / 20 games / semaine) — trois cartes séparées sur l'onglet Bilans plutôt
 * qu'un seul générateur avec un sélecteur de portée. Fusionnées ici : un seul AiCoachPanel,
 * `buildPrompt`/`buttonLabel`/etc. changent selon la portée choisie.
 */
export default function AiBilanCard({ data, sorted, currentRank }) {
  const [scope, setScope] = useState("game");
  const repSorted = representativeGames(sorted, !!data.settings.includeExcludedGames);

  // --- Portée "Dernière game" -------------------------------------------------------
  const skippedLast = sorted.length && sorted[sorted.length - 1].excluded;
  const last = repSorted.length ? repSorted[repSorted.length - 1] : null;
  const gameBaseline = last
    ? repSorted.slice(Math.max(0, repSorted.length - 1 - GAME_BASELINE_WINDOW), repSorted.length - 1)
    : [];
  const gameBaseAgg = computeAgg(gameBaseline);

  // Build/runes sur demande seulement (alourdit le prompt) — chargé en tâche de fond dès
  // que la dernière game a un build, buildPrompt reste synchrone (AiCoachPanel ne gère pas
  // l'async) donc il faut que ce soit déjà prêt avant le clic.
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

  const buildBuildBlock = () => {
    if (!includeBuild || !last.build || !buildNames) return "";
    const itemNames = last.build.items.map((id) => buildNames.items.get(id)?.name || `#${id}`).join(", ");
    const runeNames = last.build.perkIds.map((id) => buildNames.runeNames.get(id) || `#${id}`).join(", ");
    return `\n=== BUILD & RUNES ===\nItems : ${itemNames || "aucun"}\nRunes : ${runeNames || "aucune"}\n`;
  };

  const buildGamePrompt = () => {
    if (!last) throw new Error("Aucune game trackée.");
    const csmin = last.duration ? last.cs / last.duration : 0;
    const visionMin = last.duration ? last.visionScore / last.duration : 0;
    return `=== DERNIÈRE GAME JOUÉE ===
${gameLine(last)}
${buildBuildBlock()}
=== MOYENNE DES ${gameBaseline.length} GAMES PRÉCÉDENTES (référence) ===
KDA ${round2(gameBaseAgg.kda)} — CS/min ${round1(gameBaseAgg.csmin)} — Deaths/game ${round1(gameBaseAgg.deaths)} — Dégâts/game ${Math.round(gameBaseAgg.damageGame)} — Score de vision/min ${round1(gameBaseAgg.visionMin)} — Winrate ${round1(gameBaseAgg.wr)}%

=== CETTE GAME EN DÉTAIL ===
CS/min : ${round1(csmin)} (référence ${round1(gameBaseAgg.csmin)})
Deaths : ${last.deaths} (référence ${round1(gameBaseAgg.deaths)})
Score de vision/min : ${round1(visionMin)} (référence ${round1(gameBaseAgg.visionMin)})

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

  // --- Portée "N dernières games" (bilan de compte) ---------------------------------
  const buildAccountPrompt = () => {
    const recentIds = new Set(repSorted.slice(-ACCOUNT_ANALYSIS_WINDOW).map((g) => g.id));
    const base = buildCoachRecap({ data, sorted: repSorted, selectedIds: recentIds }).split("=== QUESTION AU COACH IA ===")[0];

    // L'ancien "Point de focus" est désormais un correctif sans cible chiffrée comme un
    // autre (voir lib/corrections.js) — il apparaît naturellement ici, plus besoin d'un
    // bloc séparé qui aurait fini par le mentionner deux fois.
    const activeCorrections = (data.corrections || [])
      .map((c) => evaluateCorrection(c, sorted, data.settings))
      .filter((c) => c.status !== "todo");
    const correctionsBlock = activeCorrections.length
      ? `\n=== CORRECTIFS / FOCUS SUIVIS ===\n${activeCorrections
          .map(
            (c) =>
              `- ${c.title} (${c.def?.label}${c.targetValue != null ? `, cible ${c.def?.invert ? "≤" : "≥"} ${c.targetValue}` : ""}) : ${CORRECTION_STATUS_LABEL[c.derivedStatus]}${c.currentValue != null ? ` — actuel ${c.currentValue.toFixed(c.def.decimals)} sur ${c.gamesCount} game(s)` : ""}${c.derivedStatus === "regression" ? " — ATTENTION, retombé après avoir été corrigé" : ""}`
          )
          .join("\n")}\n`
      : "";

    const deathPattern = summarizeDeathPatterns(repSorted.slice(-ACCOUNT_ANALYSIS_WINDOW));
    const deathPatternBlock = deathPattern
      ? `\n=== PATTERN DE MORTS DÉTECTÉ (${deathPattern.total} morts, ${ACCOUNT_ANALYSIS_WINDOW} dernières games) ===\n${[
          deathPattern.phase && `${deathPattern.phase.sharePct}% des morts arrivent en ${deathPattern.phase.label}.`,
          deathPattern.zone && `${deathPattern.zone.sharePct}% des morts arrivent ${deathPattern.zone.label} (approximation de position).`,
          deathPattern.context && `${deathPattern.context.sharePct}% des morts arrivent ${deathPattern.context.label}.`,
        ]
          .filter(Boolean)
          .join("\n")}\n`
      : "";

    // Mêmes trois fenêtres que le Dashboard (Toi maintenant vs toi avant) — donne à l'IA
    // les chiffres exacts plutôt que de lui faire deviner une tendance depuis le texte.
    const recentWindow = repSorted.slice(-ACCOUNT_ANALYSIS_WINDOW);
    const role = mostFrequentRole(recentWindow) || "Mid";
    const bench = roleBenchmark(currentRank.tier, role);
    const a5 = computeAgg(repSorted.slice(-5));
    const a20 = computeAgg(recentWindow);
    const aSeason = computeAgg(repSorted);
    const fmt = (n, d = 1) => (Number.isFinite(n) ? n.toFixed(d) : "?");
    const comparisonBlock = recentWindow.length
      ? `\n=== COMPARAISON À TOI-MÊME (rôle dominant : ${role}, repère ${rankLabel(currentRank.tier, currentRank.div)}) ===\n` +
        `CS/min — 5 dernières ${fmt(a5.csmin)}, 20 dernières ${fmt(a20.csmin)}, saison ${fmt(aSeason.csmin)}, repère ${fmt(bench.csmin)}.\n` +
        `Score de vision/min — 5 dernières ${fmt(a5.visionMin, 2)}, 20 dernières ${fmt(a20.visionMin, 2)}, saison ${fmt(aSeason.visionMin, 2)}, repère ${fmt(bench.visionmin, 2)}.\n` +
        `KDA — 5 dernières ${fmt(a5.kda, 2)}, 20 dernières ${fmt(a20.kda, 2)}, saison ${fmt(aSeason.kda, 2)}, repère ${fmt(bench.kda, 2)}.\n` +
        `Deaths/game — 5 dernières ${fmt(a5.deaths)}, 20 dernières ${fmt(a20.deaths)}, saison ${fmt(aSeason.deaths)}, repère ${fmt(bench.deaths)}.\n`
      : "";

    // Matchups déjà rencontrés sur le champion le plus joué récemment — seulement ceux avec
    // un échantillon suffisant (voir lib/matchups.js), jamais un winrate cité sur 1-2 games.
    const topChampion = recentWindow.length
      ? Object.entries(recentWindow.reduce((acc, g) => ((acc[g.champion] = (acc[g.champion] || 0) + 1), acc), {})).sort((a, b) => b[1] - a[1])[0]?.[0]
      : null;
    const reliableMatchups = topChampion ? matchupsFor(repSorted, topChampion).filter((m) => !m.lowSample) : [];
    const matchupsBlock = reliableMatchups.length
      ? `\n=== MATCHUPS RÉCURRENTS SUR ${topChampion?.toUpperCase()} (min. ${MIN_MATCHUP_GAMES} games) ===\n${reliableMatchups
          .map((m) => `- vs ${m.opponent} : ${m.games} game(s), ${Math.round(m.wr)}% WR, KDA ${m.kda.toFixed(2)}.`)
          .join("\n")}\n`
      : "";

    // Correctif "en cours" mis en avant s'il y en a un — même logique que le Dashboard
    // (voir CoachBriefing.jsx) : ce point passe avant un nouveau diagnostic générique.
    const active = primaryActiveCorrection(data, repSorted);
    const demande = active
      ? `Commente en priorité ma progression sur ce point précis (${active.def.label}) — est-ce que ça s'améliore vraiment, qu'est-ce qui coince encore, faut-il continuer dessus ou en changer. Complète avec 2 points forts et 1 autre point faible si pertinent, mais ce point passe avant.`
      : `Fais un bilan complet de mon compte, pas juste de la sélection ci-dessus : 3 points forts, les 3 points faibles qui me coûtent le plus de LP en ce moment (par ordre de priorité), et une seule action concrète à appliquer dès ma prochaine game.`;
    const correctionsNote = activeCorrections.some((c) => c.derivedStatus === "regression")
      ? " Signale en premier toute régression listée ci-dessus — c'est plus urgent qu'un nouveau point faible."
      : "";

    return `${base}${correctionsBlock}${deathPatternBlock}${comparisonBlock}${matchupsBlock}\n=== DEMANDE ===\n${demande}${correctionsNote} Rang actuel : ${rankLabel(currentRank.tier, currentRank.div)} — objectif : progresser le plus vite possible.`;
  };

  // --- Portée "Cette semaine" (rapport hebdomadaire) --------------------------------
  // Gate simple sur le bouton — la vraie condition (au moins une game représentative des 7
  // derniers jours) est recalculée par buildWeeklyReportPrompt lui-même à chaque clic ;
  // ceci ne sert qu'à désactiver le bouton avant.
  const hasWeekGames = sorted.some((g) => !g.excluded && Date.now() - gameDate(g).getTime() <= 7 * 86400000);
  const buildWeekPrompt = () => {
    const prompt = buildWeeklyReportPrompt(data, sorted, currentRank);
    if (!prompt) throw new Error("Aucune game cette semaine — rien à rapporter.");
    return prompt;
  };

  const SCOPE_CONFIG = {
    game: {
      buildPrompt: buildGamePrompt,
      buttonLabel: "Générer le bilan de cette game",
      resultTitle: "Prompt du bilan de game",
      disabled: !last,
      disabledReason: "Ajoute au moins une game trackée pour générer un bilan.",
    },
    account: {
      buildPrompt: buildAccountPrompt,
      buttonLabel: "Générer mon bilan de compte",
      resultTitle: "Prompt du bilan de compte",
      disabled: sorted.length < 3,
      disabledReason: "Ajoute au moins 3 games trackées pour un bilan qui a du sens.",
    },
    week: {
      buildPrompt: buildWeekPrompt,
      buttonLabel: "Générer le rapport de la semaine",
      resultTitle: "Rapport hebdomadaire",
      disabled: !hasWeekGames,
      disabledReason: "Aucune game trackée cette semaine — rien à rapporter.",
    },
  };
  const config = SCOPE_CONFIG[scope];

  return (
    <Card className="p-5 mb-5">
      <Eyebrow style={{ marginBottom: 6 }}>Bilan IA</Eyebrow>
      <p style={{ fontSize: 12.5, color: "var(--dim)", marginBottom: 14 }}>
        Génère un prompt façon coach coréen — direct, sans complaisance — à coller dans Claude, ChatGPT ou l'IA de
        ton choix. Trois portées possibles, un seul générateur.
      </p>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {SCOPES.map((s) => (
          <ToggleChip key={s.id} active={scope === s.id} onClick={() => setScope(s.id)}>
            {s.label}
          </ToggleChip>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "var(--dim)", marginBottom: 14 }}>{SCOPE_DESCRIPTION[scope]}</p>

      {scope === "game" && last && (
        <>
          {skippedLast && (
            <p style={{ fontSize: 11.5, color: "var(--dim)", marginBottom: 10 }}>
              Ta toute dernière game est marquée non représentative — bilan basé sur la dernière game valable à la
              place.
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <ChampAvatar name={last.champion} size={34} />
            <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text)" }}>{last.champion}</span>
            <Pill tone={last.win ? "win" : "loss"}>{last.win ? "Victoire" : "Défaite"}</Pill>
            <span style={{ fontSize: 12.5, color: "var(--dim)" }}>
              {last.kills}/{last.deaths}/{last.assists}
            </span>
            <span className="tnum" style={{ fontSize: 12.5, fontWeight: 600, color: last.lpChange >= 0 ? "var(--win)" : "var(--loss)" }}>
              {last.lpChange >= 0 ? "+" : ""}
              {last.lpChange} LP
            </span>
            <span style={{ fontSize: 11.5, color: "var(--dim)", marginLeft: "auto" }}>{last.date}</span>
          </div>

          {last.build && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
                fontSize: 12,
                color: "var(--text)",
                cursor: buildNames ? "pointer" : "not-allowed",
              }}
            >
              <input
                type="checkbox"
                checked={includeBuild}
                disabled={!buildNames}
                onChange={(e) => setIncludeBuild(e.target.checked)}
              />
              Inclure le build & les runes dans le prompt {!buildNames && "(chargement…)"}
            </label>
          )}
        </>
      )}

      {/* `key={scope}` : un nouveau prompt généré démarre toujours d'un état propre, plutôt
          que d'afficher le prompt/l'état copié de la portée précédente en changeant de
          portée sans avoir cliqué le bouton. */}
      <AiCoachPanel
        key={scope}
        buildPrompt={config.buildPrompt}
        buttonLabel={config.buttonLabel}
        resultTitle={config.resultTitle}
        disabled={config.disabled}
        disabledReason={config.disabledReason}
      />
    </Card>
  );
}
