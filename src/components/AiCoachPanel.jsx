import { useState } from "react";
import { Sparkles, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Card, Btn, Eyebrow } from "./ui/primitives.jsx";

/**
 * Persona partagée par les trois fonctionnalités Coach IA (bilan de compte, bilan de
 * game, conseils de champ select) : un coach coréen exigeant, direct, qui priorise les
 * fondamentaux plutôt que le blabla générique — c'est le ton demandé, pas juste une
 * couche de style, ça change concrètement ce que l'IA met en avant dans ses réponses.
 * Fait partie du texte copié (il n'y a pas de champ "system" séparé quand on colle dans
 * une appli de chat classique) : elle doit donc rester lisible telle quelle.
 */
export const KOREAN_COACH_SYSTEM = `Tu es un coach League of Legends professionnel, formé en Corée du Sud — réputé pour
son exigence, sa franchise et son sens du détail. Tu ne flattes jamais inutilement : si
un chiffre est mauvais, tu le dis, mais toujours accompagné d'une raison concrète et
d'une action précise pour corriger. Tu priorises systématiquement les fondamentaux (CS,
morts évitables, vision, macro, matchup, gestion de wave) avant les considérations de
mécanique ou de méta. Réponds en français, de façon concise, structurée (courtes
sections avec des tirets), sans blabla ni motivation creuse — chaque phrase doit être
actionnable. Cite les chiffres précis qu'on te donne (comparaisons, matchups, patterns de
morts) plutôt que de rester vague : c'est ton sens du détail qui fait la différence avec
un bilan générique. Base-toi uniquement sur les chiffres et faits fournis, n'invente rien.`;

/**
 * Bloc réutilisé par les trois fonctionnalités Coach IA (bilan de compte, bilan de
 * game, conseils de champ select) : un bouton qui construit le prompt au moment du clic
 * (donc toujours à jour) et l'affiche prêt à copier — CLIMB.EUW est un site statique, il
 * ne peut pas appeler une IA lui-même sans faire transiter une clé API et sa facturation
 * par l'utilisateur ; ce mode copier-coller reste gratuit et utilise l'abonnement Claude/
 * ChatGPT que tu as déjà, exactement comme le recap Coach IA existant.
 *
 * `buildPrompt` est un callback (pas une string) : le prompt dépend souvent d'un état qui
 * change entre deux clics (game la plus récente, composition en cours...), on ne veut le
 * calculer qu'au moment du clic.
 */
export default function AiCoachPanel({
  buildPrompt,
  system = KOREAN_COACH_SYSTEM,
  buttonLabel = "Générer le prompt",
  resultTitle = "Prompt généré",
  disabled,
  disabledReason,
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const generate = () => {
    setError("");
    setCopied(false);
    // Un nouveau prompt s'affiche toujours déplié, même si le précédent avait été replié.
    setCollapsed(false);
    try {
      setText(`${system}\n\n${buildPrompt()}`);
    } catch (e) {
      setText("");
      setError(e.message || "Impossible de préparer ce prompt.");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard refusé (contexte non sécurisé / permission) : le texte reste sélectionnable
    }
  };

  return (
    <div>
      <Btn variant="primary" onClick={generate} disabled={disabled}>
        <Sparkles size={14} /> {buttonLabel}
      </Btn>

      {disabled && disabledReason && (
        <p style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 8 }}>{disabledReason}</p>
      )}
      {error && <p style={{ fontSize: 12, color: "var(--loss)", marginTop: 10 }}>{error}</p>}

      {text && (
        <Card className="p-4 mt-3 fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setCollapsed((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                marginBottom: collapsed ? 0 : 10,
              }}
              aria-expanded={!collapsed}
            >
              <Eyebrow color="var(--gold)">{resultTitle}</Eyebrow>
              {collapsed ? <ChevronDown size={14} color="var(--dim)" /> : <ChevronUp size={14} color="var(--dim)" />}
            </button>
            {!collapsed && (
              <Btn onClick={copy}>
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copié" : "Copier"}
              </Btn>
            )}
          </div>

          {!collapsed && (
            <>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "var(--body)",
                  fontSize: 12.5,
                  color: "var(--text)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {text}
              </pre>
              <p style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 10 }}>
                Colle ce texte dans Claude, ChatGPT, ou l'IA de ton choix — gratuit, avec l'abonnement que tu as déjà.
              </p>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
