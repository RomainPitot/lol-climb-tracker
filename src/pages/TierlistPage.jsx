import { useEffect, useMemo, useRef, useState } from "react";
import { Shuffle, X } from "lucide-react";
import { Card, SectionTitle, Pill, Input, Btn } from "../components/ui/primitives.jsx";
import ChampAvatar from "../components/ChampAvatar.jsx";
import { useChampionList } from "../hooks/useChampionList.js";
import { ROLES } from "../constants/game.js";

export default function TierlistPage({ data, addToPool, removeFromPool }) {
  const { champions, loading, error } = useChampionList();
  const byId = useMemo(() => Object.fromEntries(champions.map((c) => [c.id, c.name])), [champions]);

  return (
    <div>
      <SectionTitle sub="Choisis les champions que tu veux essayer ou apprendre, par rôle — puis laisse la roulette décider pour ta prochaine game.">
        Tierlist
      </SectionTitle>

      <div style={{ marginBottom: 20 }}>
        {ROLES.map((role) => (
          <RolePoolEditor
            key={role}
            role={role}
            poolIds={data.championPool[role] || []}
            champions={champions}
            byId={byId}
            loading={loading}
            error={error}
            addToPool={addToPool}
            removeFromPool={removeFromPool}
          />
        ))}
      </div>

      <RouletteSection championPool={data.championPool} byId={byId} />
    </div>
  );
}

function RolePoolEditor({ role, poolIds, champions, byId, loading, error, addToPool, removeFromPool }) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return champions.filter((c) => !poolIds.includes(c.id) && c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, champions, poolIds]);

  const selected = useMemo(
    () =>
      [...poolIds]
        .map((id) => ({ id, name: byId[id] || id }))
        .sort((a, b) => a.name.localeCompare(b.name, "fr")),
    [poolIds, byId]
  );

  return (
    <Card className="p-4" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{role}</div>
        <Pill tone={poolIds.length ? "gold" : "neutral"}>{poolIds.length} champion(s)</Pill>
      </div>

      <div style={{ position: "relative", marginBottom: 10 }}>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={loading ? "Chargement de la liste des champions…" : "Chercher un champion à ajouter…"}
          disabled={loading || !!error}
        />
        {matches.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 5,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              marginTop: 4,
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            }}
          >
            {matches.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  addToPool(role, c.id);
                  setQuery("");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "8px 10px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <ChampAvatar ddragonId={c.id} size={22} />
                <span style={{ fontSize: 12.5, color: "var(--text)" }}>{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div style={{ fontSize: 11.5, color: "var(--loss)", marginBottom: 8 }}>
          Impossible de charger la liste des champions ({error}) — réessaie plus tard.
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {selected.length === 0 && (
          <span style={{ fontSize: 12, color: "var(--dim)" }}>Aucun champion pour ce rôle pour l'instant.</span>
        )}
        {selected.map((c) => (
          <div
            key={c.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 999,
              padding: "4px 8px 4px 4px",
            }}
          >
            <ChampAvatar ddragonId={c.id} size={20} />
            <span style={{ fontSize: 12, color: "var(--text)" }}>{c.name}</span>
            <button
              onClick={() => removeFromPool(role, c.id)}
              aria-label={`Retirer ${c.name} du rôle ${role}`}
              style={{ background: "none", border: "none", color: "var(--dim)", cursor: "pointer", display: "flex", padding: 2 }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

const SPIN_DURATION_MS = 1200;
const SPIN_STEP_MS = 80;

function RouletteSection({ championPool, byId }) {
  const [role, setRole] = useState(ROLES[0]);
  const [spinning, setSpinning] = useState(false);
  const [displayId, setDisplayId] = useState(null);
  const [landed, setLanded] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const pool = championPool[role] || [];

  const changeRole = (r) => {
    if (spinning) return;
    setRole(r);
    setDisplayId(null);
    setLanded(false);
  };

  const spin = () => {
    if (!pool.length || spinning) return;
    setSpinning(true);
    setLanded(false);
    let elapsed = 0;
    intervalRef.current = setInterval(() => {
      setDisplayId(pool[Math.floor(Math.random() * pool.length)]);
      elapsed += SPIN_STEP_MS;
      if (elapsed >= SPIN_DURATION_MS) {
        clearInterval(intervalRef.current);
        setDisplayId(pool[Math.floor(Math.random() * pool.length)]);
        setLanded(true);
        setSpinning(false);
      }
    }, SPIN_STEP_MS);
  };

  return (
    <Card className="p-5">
      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 12 }}>Roulette</div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => changeRole(r)}
            disabled={spinning}
            style={{
              padding: "6px 12px",
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: spinning ? "not-allowed" : "pointer",
              background: role === r ? "var(--gold)" : "var(--card)",
              color: role === r ? "#1a1406" : "var(--dim)",
              border: `1px solid ${role === r ? "var(--gold)" : "var(--border)"}`,
            }}
          >
            {r} ({(championPool[r] || []).length})
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0" }}>
        {displayId ? (
          <>
            <ChampAvatar ddragonId={displayId} size={96} />
            <div
              style={{
                fontFamily: "var(--display)",
                fontWeight: 700,
                fontSize: 22,
                color: landed ? "var(--gold)" : "var(--text)",
              }}
            >
              {byId[displayId] || displayId}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: "var(--dim)", textAlign: "center" }}>
            {pool.length ? "Prêt à tirer." : `Ajoute des champions au rôle ${role} ci-dessus pour pouvoir tirer.`}
          </div>
        )}

        <Btn variant="primary" onClick={spin} disabled={!pool.length || spinning}>
          <Shuffle size={14} /> {spinning ? "Ça tourne…" : "Tirer un champion"}
        </Btn>
      </div>
    </Card>
  );
}
