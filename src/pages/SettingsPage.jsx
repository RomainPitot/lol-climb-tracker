import { useState } from "react";
import { Check, Upload, RotateCcw, Download, AlertTriangle } from "lucide-react";
import { SectionTitle, Field, Input, Select, TextArea, Btn, Collapsible } from "../components/ui/primitives.jsx";
import GoalsSection from "../components/settings/GoalsSection.jsx";
import RiotImportSection from "../components/settings/RiotImportSection.jsx";
import NotificationsSection from "../components/settings/NotificationsSection.jsx";
import { TIERS, APEX, DIVS } from "../constants/ranks.js";
import { rankLabel } from "../lib/rank.js";
import { csvToGames } from "../lib/importers.js";
import { emptyGame } from "../lib/gameModel.js";
import { uid } from "../lib/format.js";

const HIST_FIELDS = [
  "games", "wins", "losses", "kills", "deaths", "assists", "lp", "cs",
  "damage", "gold", "maxKills", "maxDeaths", "doubles", "triples", "quadras", "pentas",
];

export default function SettingsPage({
  data, sorted, currentRank, addGoal, deleteGoal, setHistorical,
  setThresholds, setCurrentRank, setSettings, importGames, importRiotResult, resetAll,
}) {
  const [hist, setHist] = useState(data.historical);
  const [th, setTh] = useState(data.thresholds);
  const [rankForm, setRankForm] = useState({
    tier: currentRank.tier,
    div: currentRank.div || "IV",
    lp: currentRank.lp,
  });
  const [pasteText, setPasteText] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [msg, setMsg] = useState("");
  const [msgError, setMsgError] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const notify = (text, isError = false) => {
    setMsg(text);
    setMsgError(isError);
  };

  const saveCurrentRank = () => {
    const isApex = APEX.includes(rankForm.tier);
    setCurrentRank({
      tier: rankForm.tier,
      div: isApex ? null : rankForm.div,
      lp: Math.max(0, Math.round(Number(rankForm.lp) || 0)),
    });
    notify("Rang actuel mis à jour.");
  };

  /** Vérifie que les totaux saisis à la main tiennent debout avant d'enregistrer. */
  const checkConsistency = () => {
    const issues = [];
    ["yone", "tahm"].forEach((k) => {
      const h = hist[k];
      if (h.wins + h.losses !== h.games) {
        issues.push(`${k}: W(${h.wins}) + L(${h.losses}) ≠ games (${h.games})`);
      }
    });
    if (hist.global.wins + hist.global.losses !== hist.global.games) {
      issues.push(`global: W(${hist.global.wins}) + L(${hist.global.losses}) ≠ games (${hist.global.games})`);
    }
    if (hist.yone.games + hist.tahm.games > hist.global.games) {
      issues.push("Yone + Tahm dépasse le total global — vérifie les chiffres.");
    }
    return issues;
  };

  const saveHist = () => {
    const issues = checkConsistency();
    if (issues.length) {
      notify(`Incohérences détectées : ${issues.join(" | ")}`, true);
      return;
    }
    setHistorical(hist);
    notify("Statistiques historiques enregistrées.");
  };

  const doImportCsv = () => {
    if (!pasteText.trim()) return;
    const n = importGames(csvToGames(pasteText));
    notify(`${n} games importées.`);
    setPasteText("");
  };

  const doImportJson = () => {
    try {
      const arr = JSON.parse(jsonText);
      if (!Array.isArray(arr)) throw new Error("not array");
      const n = importGames(arr.map((g) => ({ id: uid(), ...emptyGame(), ...g })));
      notify(`${n} games importées (JSON).`);
      setJsonText("");
    } catch {
      notify("JSON invalide.", true);
    }
  };

  /** Sauvegarde complète : tout l'état vit dans le navigateur, un export est la seule copie. */
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `climb-euw-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateHistField = (key, field, val) =>
    setHist((p) => ({ ...p, [key]: { ...p[key], [field]: Number(val) } }));
  const updateTh = (key, field, val) =>
    setTh((p) => ({ ...p, [key]: { ...p[key], [field]: Number(val) } }));

  return (
    <div style={{ maxWidth: 820 }}>
      <SectionTitle sub="Sections repliables — ouvre uniquement ce dont tu as besoin.">Paramètres</SectionTitle>

      {msg && (
        <div
          className="fade-in"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            padding: "10px 14px",
            background: msgError ? "rgba(255,92,92,0.08)" : "rgba(15,214,138,0.08)",
            border: `1px solid ${msgError ? "rgba(255,92,92,0.3)" : "rgba(15,214,138,0.3)"}`,
            borderRadius: "var(--radius-md)",
            marginBottom: 16,
            fontSize: 13,
            color: "var(--text)",
          }}
        >
          {msgError ? (
            <AlertTriangle size={14} color="var(--loss)" style={{ flexShrink: 0, marginTop: 1 }} />
          ) : (
            <Check size={14} color="var(--win)" style={{ flexShrink: 0, marginTop: 1 }} />
          )}
          {msg}
        </div>
      )}

      <Collapsible
        title="Import automatique (Riot API)"
        sub="Récupère tes dernières games SoloQ automatiquement, avec repli manuel si besoin."
      >
        <RiotImportSection
          data={data}
          setSettings={setSettings}
          importGames={importGames}
          importRiotResult={importRiotResult}
        />
      </Collapsible>

      <Collapsible
        title="Notifications"
        sub="Configure le webhook Discord utilisé par le script local GameDetectorLol (ready check, début et fin de partie)."
      >
        <NotificationsSection data={data} setSettings={setSettings} />
      </Collapsible>

      <Collapsible
        title="Rang actuel"
        sub={`Actuellement : ${rankLabel(currentRank.tier, currentRank.div)} — ${currentRank.lp} LP. Corrige-le ici s'il n'est pas à jour.`}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, alignItems: "end" }}>
          <Field label="Tier">
            <Select value={rankForm.tier} onChange={(e) => setRankForm((p) => ({ ...p, tier: e.target.value }))}>
              {[...TIERS, ...APEX].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          {!APEX.includes(rankForm.tier) && (
            <Field label="Division">
              <Select value={rankForm.div} onChange={(e) => setRankForm((p) => ({ ...p, div: e.target.value }))}>
                {DIVS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="LP">
            <Input type="number" value={rankForm.lp} onChange={(e) => setRankForm((p) => ({ ...p, lp: e.target.value }))} />
          </Field>
          <Btn variant="primary" onClick={saveCurrentRank}>
            <Check size={14} /> Mettre à jour le rang actuel
          </Btn>
        </div>
      </Collapsible>

      <Collapsible title="Objectifs" sub={`${data.goals.length} objectif(s) défini(s)`}>
        <GoalsSection data={data} sorted={sorted} addGoal={addGoal} deleteGoal={deleteGoal} />
      </Collapsible>

      <Collapsible
        title="Seuils de couleur"
        sub="Règle à partir de quelle valeur une stat s'affiche en vert / orange / rouge."
      >
        {Object.entries(th).map(([key, t]) => (
          <div
            key={key}
            style={{ display: "grid", gridTemplateColumns: "1fr repeat(2, 120px)", gap: 10, alignItems: "end", marginBottom: 10 }}
          >
            <div style={{ fontSize: 12.5, color: "var(--text)", fontWeight: 600 }}>
              {t.label}
              {t.invert ? " (plus bas = mieux)" : " (plus haut = mieux)"}
            </div>
            <Field label="Seuil bon (vert)">
              <Input type="number" value={t.good} onChange={(e) => updateTh(key, "good", e.target.value)} />
            </Field>
            <Field label="Seuil mauvais (rouge)">
              <Input type="number" value={t.bad} onChange={(e) => updateTh(key, "bad", e.target.value)} />
            </Field>
          </div>
        ))}
        <Btn
          variant="primary"
          onClick={() => {
            setThresholds(th);
            notify("Seuils de couleur enregistrés.");
          }}
          style={{ marginTop: 6 }}
        >
          <Check size={14} /> Enregistrer les seuils
        </Btn>
      </Collapsible>

      <Collapsible
        title="Statistiques historiques"
        sub="Chiffres d'avant le début du tracking (Yone, Tahm Kench, global) — jamais mélangés aux stats calculées game par game."
      >
        {["yone", "tahm"].map((k) => (
          <div key={k} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: k === "yone" ? "var(--yone)" : "var(--tahm)",
                marginBottom: 8,
              }}
            >
              {k === "tahm" ? "Tahm Kench" : "Yone"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8 }}>
              {HIST_FIELDS.map((f) => (
                <Field key={f} label={f}>
                  <Input type="number" value={hist[k][f]} onChange={(e) => updateHistField(k, f, e.target.value)} />
                </Field>
              ))}
            </div>
          </div>
        ))}

        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>Global</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8, marginBottom: 12 }}>
          {["games", "wins", "losses", "lp"].map((f) => (
            <Field key={f} label={f}>
              <Input type="number" value={hist.global[f]} onChange={(e) => updateHistField("global", f, e.target.value)} />
            </Field>
          ))}
          <Field label="tier">
            <Select
              value={hist.global.tier}
              onChange={(e) => setHist((p) => ({ ...p, global: { ...p.global, tier: e.target.value } }))}
            >
              {[...TIERS, ...APEX].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="div">
            <Select
              value={hist.global.div}
              onChange={(e) => setHist((p) => ({ ...p, global: { ...p.global, div: e.target.value } }))}
            >
              {DIVS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Btn variant="primary" onClick={saveHist}>
          <Check size={14} /> Enregistrer &amp; vérifier cohérence
        </Btn>
      </Collapsible>

      <Collapsible title="Import CSV / copier-coller de tableau">
        <p style={{ fontSize: 12, color: "var(--dim)", marginBottom: 10 }}>
          En-têtes : date, time, champion, role, rolestatus, win, lpchange, kills, deaths, assists, cs, duration,
          damage, gold, vision, matchup, matchupadc, matchupsupport, side.
        </p>
        <TextArea
          rows={5}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="date,champion,role,win,kills,deaths,assists,cs,duration,damage,gold,vision..."
        />
        <div style={{ marginTop: 10 }}>
          <Btn onClick={doImportCsv}>
            <Upload size={14} /> Importer
          </Btn>
        </div>
      </Collapsible>

      <Collapsible title="Import / export JSON" sub="Sauvegarde tes données — elles ne vivent que dans ce navigateur.">
        <div style={{ marginBottom: 14 }}>
          <Btn onClick={exportBackup}>
            <Download size={14} /> Exporter une sauvegarde complète
          </Btn>
        </div>
        <TextArea
          rows={5}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='[{"date":"2026-08-01","champion":"Yone",...}]'
        />
        <div style={{ marginTop: 10 }}>
          <Btn onClick={doImportJson}>
            <Upload size={14} /> Importer des games (JSON)
          </Btn>
        </div>
      </Collapsible>

      <Collapsible title="Zone sensible">
        {!confirmReset ? (
          <Btn variant="danger" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={14} /> Réinitialiser toutes les données
          </Btn>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "var(--text)" }}>
              Confirmer la suppression de toutes les données ?
            </span>
            <Btn
              variant="danger"
              onClick={() => {
                resetAll();
                setConfirmReset(false);
              }}
            >
              Oui, tout effacer
            </Btn>
            <Btn onClick={() => setConfirmReset(false)}>Annuler</Btn>
          </div>
        )}
      </Collapsible>
    </div>
  );
}
