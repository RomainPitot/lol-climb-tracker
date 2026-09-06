import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Card, Btn, Eyebrow, Spinner } from "./ui/primitives.jsx";
import { askCoach, diagnoseAiError } from "../lib/aiCoach.js";

/**
 * Bloc réutilisé par les trois fonctionnalités Coach IA (bilan de compte, bilan de
 * game, conseils de champ select) : un bouton qui construit le prompt au moment du clic
 * (donc toujours à jour), l'envoie au Worker, et affiche la réponse — avec les états de
 * chargement/erreur gérés une seule fois plutôt que dupliqués trois fois.
 *
 * `buildPrompt` est un callback (pas une string) : le prompt dépend souvent d'un état qui
 * change entre deux clics (game la plus récente, composition en cours...), on ne veut le
 * calculer qu'au moment de l'appel.
 */
export default function AiCoachPanel({
  conn,
  buildPrompt,
  buttonLabel = "Demander au coach",
  resultTitle = "Analyse du coach",
  maxTokens,
  disabled,
  disabledReason,
}) {
  const [state, setState] = useState({ loading: false, text: "", error: "" });
  const notConfigured = !conn?.proxyUrl || !conn?.proxyToken;

  const run = async () => {
    setState({ loading: true, text: "", error: "" });
    let prompt;
    try {
      prompt = buildPrompt();
    } catch (e) {
      setState({ loading: false, text: "", error: e.message || "Impossible de préparer la demande." });
      return;
    }
    try {
      const text = await askCoach(conn, { prompt, maxTokens });
      setState({ loading: false, text, error: "" });
    } catch (e) {
      setState({ loading: false, text: "", error: `${e.message} ${diagnoseAiError(e)}` });
    }
  };

  return (
    <div>
      <Btn variant="primary" onClick={run} disabled={disabled || notConfigured || state.loading}>
        {state.loading ? <Spinner /> : <Sparkles size={14} />} {state.loading ? "Analyse en cours…" : buttonLabel}
      </Btn>

      {notConfigured && (
        <p style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 8 }}>
          Configure d'abord le proxy dans <strong>Ajouter une game</strong> (mode "Via mon proxy") pour utiliser le
          Coach IA — c'est le même Worker, il faut juste y ajouter le secret <code>ANTHROPIC_API_KEY</code> (voir{" "}
          <code>docs/RIOT_PROXY.md</code>).
        </p>
      )}
      {!notConfigured && disabled && disabledReason && (
        <p style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 8 }}>{disabledReason}</p>
      )}
      {state.error && <p style={{ fontSize: 12, color: "var(--loss)", marginTop: 10 }}>{state.error}</p>}

      {state.text && (
        <Card className="p-4 mt-3 fade-in">
          <Eyebrow color="var(--gold)" style={{ marginBottom: 8 }}>
            {resultTitle}
          </Eyebrow>
          <div style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.6, color: "var(--text)" }}>
            {state.text}
          </div>
        </Card>
      )}
    </div>
  );
}
