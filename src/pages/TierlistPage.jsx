import { useEffect, useMemo, useRef, useState } from "react";
import { Shuffle, X, Wrench } from "lucide-react";
import { Card, SectionTitle, Pill, Input, Btn, Collapsible } from "../components/ui/primitives.jsx";
import ChampAvatar from "../components/ChampAvatar.jsx";
import { useChampionList } from "../hooks/useChampionList.js";
import { ROLES } from "../constants/game.js";
import { RARITY_TIERS, rarityFor, thresholdFor, weightedPick } from "../lib/rarity.js";

export default function TierlistPage({ data, addToPool, removeFromPool, recordRouletteSpin, setChampionWeight }) {
  const { champions, loading, error } = useChampionList();
  const byId = useMemo(() => Object.fromEntries(champions.map((c) => [c.id, c.name])), [champions]);

  return (
    <div>
      <SectionTitle sub="Choisis les champions que tu veux essayer ou apprendre, par rôle — puis laisse la roulette décider pour ta prochaine game. Un champion boudé voit ses chances grimper de façon exponentielle à chaque tirage raté, jusqu'à sortir.">
        Tierlist
      </SectionTitle>

      <div style={{ marginBottom: 20 }}>
        {ROLES.map((role) => (
          <RolePoolEditor
            key={role}
            role={role}
            poolIds={data.championPool[role] || []}
            weights={data.championWeights[role] || {}}
            champions={champions}
            byId={byId}
            loading={loading}
            error={error}
            addToPool={addToPool}
            removeFromPool={removeFromPool}
          />
        ))}
      </div>

      <RouletteSection
        championPool={data.championPool}
        championWeights={data.championWeights}
        byId={byId}
        recordRouletteSpin={recordRouletteSpin}
      />

      <div style={{ marginTop: 20 }}>
        <DevPanel
          championPool={data.championPool}
          championWeights={data.championWeights}
          byId={byId}
          setChampionWeight={setChampionWeight}
        />
      </div>
    </div>
  );
}

/** Cadre coloré autour d'un avatar selon son palier de rareté (voir lib/rarity.js). Le
 * palier le plus haut ("Transcendant") scintille en continu, même au repos dans la pool. */
function RarityFrame({ tier, size, pulseKey, children }) {
  const isNormal = tier.id === "normal";
  const isTranscendent = tier.id === "transcendent";
  return (
    <div
      key={pulseKey}
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: isNormal ? "none" : `2px solid ${tier.color}`,
        boxShadow: isNormal ? "none" : `0 0 8px ${tier.color}99`,
        animation: isTranscendent ? "rarity-transcendent-idle 3s linear infinite" : "none",
        flexShrink: 0,
      }}
      title={tier.label ? `${tier.label} — n'est pas sorti depuis longtemps` : undefined}
    >
      {children}
    </div>
  );
}

function RolePoolEditor({ role, poolIds, weights, champions, byId, loading, error, addToPool, removeFromPool }) {
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
        {selected.map((c) => {
          const tier = rarityFor(weights[c.id], poolIds.length);
          return (
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
              <RarityFrame tier={tier} size={20}>
                <ChampAvatar ddragonId={c.id} size={20} />
              </RarityFrame>
              <span style={{ fontSize: 12, color: "var(--text)" }}>{c.name}</span>
              {tier.label && (
                <span style={{ fontSize: 10, fontWeight: 700, color: tier.color }}>{tier.label}</span>
              )}
              <button
                onClick={() => removeFromPool(role, c.id)}
                aria-label={`Retirer ${c.name} du rôle ${role}`}
                style={{ background: "none", border: "none", color: "var(--dim)", cursor: "pointer", display: "flex", padding: 2 }}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// Le bandeau défile comme une machine à sous : une longue bande d'avatars aléatoires se
// termine par le champion gagnant, positionné pour s'arrêter pile sous le repère central
// grâce à un `transform: translateX` animé en CSS (décélération via cubic-bezier).
// Des champions supplémentaires après le gagnant (REEL_TRAILING_COUNT) évitent que le
// bandeau ne s'arrête pile à sa dernière case : sans ça, plus rien à afficher après le
// gagnant trahissait à l'avance où le tirage allait s'arrêter.
const REEL_ITEM_WIDTH = 78;
const REEL_LEADING_COUNT = 34;
const REEL_TRAILING_COUNT = 10;
const REEL_DURATION_MS = 3200;

/** Un palier de rareté = un nom d'animation CSS + une durée, pour un effet d'atterrissage
 * proportionnel à combien le champion tiré s'était fait attendre (voir lib/rarity.js). */
const PULSE_BY_TIER = {
  normal: { animation: "roulette-win-pulse-normal", duration: 0.8 },
  uncommon: { animation: "roulette-win-pulse-uncommon", duration: 0.9 },
  rare: { animation: "roulette-win-pulse-rare", duration: 1 },
  epic: { animation: "roulette-win-pulse-epic", duration: 1.3 },
  legendary: { animation: "roulette-win-pulse-legendary", duration: 1.8 },
  mythic: { animation: "roulette-win-pulse-mythic", duration: 2.2 },
  transcendent: { animation: "roulette-win-pulse-transcendent", duration: 2.6 },
};

function RouletteSection({ championPool, championWeights, byId, recordRouletteSpin }) {
  const [role, setRole] = useState(ROLES[0]);
  const [spinning, setSpinning] = useState(false);
  const [reel, setReel] = useState(null); // { items, winnerIndex, weightsSnapshot, offset, animate }
  const [result, setResult] = useState(null);
  const [resultTier, setResultTier] = useState(null);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const pool = championPool[role] || [];
  const weights = championWeights[role] || {};

  const changeRole = (r) => {
    if (spinning) return;
    setRole(r);
    setReel(null);
    setResult(null);
    setResultTier(null);
  };

  const spin = () => {
    if (!pool.length || spinning) return;
    setSpinning(true);
    setResult(null);
    setResultTier(null);

    // Tirage pondéré : le "pity" accumulé (voir lib/rarity.js) avantage les champions boudés
    // depuis longtemps. On capture leur rareté AVANT de l'envoyer à recordRouletteSpin, qui
    // remet le compteur du gagnant à 0 — sans quoi l'effet d'atterrissage retomberait toujours
    // sur "normal".
    const weightsSnapshot = weights;
    const winner = weightedPick(pool, weightsSnapshot);
    const winnerTier = rarityFor(weightsSnapshot[winner], pool.length);
    const randomFiller = () => pool[Math.floor(Math.random() * pool.length)];
    const leading = Array.from({ length: REEL_LEADING_COUNT }, randomFiller);
    const trailing = Array.from({ length: REEL_TRAILING_COUNT }, randomFiller);
    const items = [...leading, winner, ...trailing];
    const winnerIndex = leading.length;

    const containerWidth = containerRef.current?.offsetWidth || 320;
    const winnerCenterX = REEL_ITEM_WIDTH * winnerIndex + REEL_ITEM_WIDTH / 2;
    const finalOffset = -(winnerCenterX - containerWidth / 2);

    // Étape 1 : poser la bande à son point de départ sans transition. Étape 2 (deux frames
    // plus tard, pour laisser le navigateur peindre l'état de départ) : appliquer la position
    // finale AVEC transition — c'est ce delta qui produit l'animation de défilement.
    setReel({ items, winnerIndex, weightsSnapshot, poolSize: pool.length, offset: 0, animate: false });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setReel({ items, winnerIndex, weightsSnapshot, poolSize: pool.length, offset: finalOffset, animate: true });
      });
    });

    recordRouletteSpin(role, winner);

    timeoutRef.current = setTimeout(() => {
      setResult(winner);
      setResultTier(winnerTier);
      setSpinning(false);
    }, REEL_DURATION_MS);
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

      <div
        ref={containerRef}
        style={{
          position: "relative",
          height: 100,
          overflow: "hidden",
          borderRadius: 12,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          marginBottom: 16,
        }}
      >
        {/* Repère central : le champion qui s'arrête dessous est le gagnant. */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 2,
            background: "var(--gold)",
            transform: "translateX(-1px)",
            zIndex: 2,
            boxShadow: "0 0 10px var(--gold)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: -1,
            width: 0,
            height: 0,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderTop: "9px solid var(--gold)",
            transform: "translateX(-7px)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        {reel ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              transform: `translateX(${reel.offset}px)`,
              transition: reel.animate ? `transform ${REEL_DURATION_MS}ms cubic-bezier(0.1, 0.7, 0.15, 1)` : "none",
              willChange: "transform",
            }}
          >
            {reel.items.map((id, i) => {
              const isWinner = result && i === reel.winnerIndex;
              const tier = rarityFor(reel.weightsSnapshot[id], reel.poolSize);
              const pulse = isWinner ? PULSE_BY_TIER[resultTier?.id] || PULSE_BY_TIER.normal : null;
              return (
                <div
                  key={i}
                  style={{
                    width: REEL_ITEM_WIDTH,
                    flexShrink: 0,
                    display: "flex",
                    justifyContent: "center",
                    animation: pulse ? `${pulse.animation} ${pulse.duration}s ease-out` : "none",
                    borderRadius: 10,
                  }}
                >
                  <RarityFrame tier={tier} size={60}>
                    <ChampAvatar ddragonId={id} size={60} />
                  </RarityFrame>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              fontSize: 13,
              color: "var(--dim)",
              textAlign: "center",
              padding: "0 16px",
            }}
          >
            {pool.length ? "Prêt à tirer." : `Ajoute des champions au rôle ${role} ci-dessus pour pouvoir tirer.`}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        {result && (
          <div style={{ textAlign: "center" }}>
            {resultTier?.label && (
              <div style={{ fontSize: 12, fontWeight: 700, color: resultTier.color, marginBottom: 2 }}>
                ✦ {resultTier.label} ✦
              </div>
            )}
            <div
              style={{
                fontFamily: "var(--display)",
                fontWeight: 700,
                fontSize: 22,
                color: resultTier?.label ? resultTier.color : "var(--gold)",
                textShadow: `0 0 20px ${resultTier?.label ? resultTier.color : "rgba(212,175,55,0.45)"}`,
              }}
            >
              {byId[result] || result}
            </div>
          </div>
        )}

        <Btn variant="primary" onClick={spin} disabled={!pool.length || spinning}>
          <Shuffle size={14} /> {spinning ? "Ça tourne…" : "Tirer un champion"}
        </Btn>
      </div>
    </Card>
  );
}

/**
 * Panneau de test : prévisualiser l'effet d'atterrissage de chaque palier instantanément
 * (sans accumuler de vrais tirages ratés), et forcer le compteur d'un champion précis pour
 * vérifier son liseré. N'affecte que championWeights — jamais les games ni le reste de l'app.
 */
function DevPanel({ championPool, championWeights, byId, setChampionWeight }) {
  const [role, setRole] = useState(ROLES[0]);
  const [previewTierId, setPreviewTierId] = useState(null);
  const [previewKey, setPreviewKey] = useState(0);

  const pool = championPool[role] || [];
  const weights = championWeights[role] || {};
  const previewChamp = pool[0];

  const triggerPreview = (tierId) => {
    setPreviewTierId(tierId);
    setPreviewKey((k) => k + 1);
  };

  return (
    <Collapsible
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Wrench size={13} /> Panneau de test (dev)
        </span>
      }
      sub="Prévisualiser les effets de rareté et forcer des compteurs, sans attendre de vrais tirages."
    >
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
          Aperçu instantané de l'effet d'atterrissage
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {RARITY_TIERS.map((t) => (
            <button
              key={t.id}
              onClick={() => triggerPreview(t.id)}
              style={{
                padding: "6px 10px",
                borderRadius: 7,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                background: "var(--bg-elevated)",
                color: t.id === "normal" ? "var(--dim)" : t.color,
                border: `1px solid ${t.id === "normal" ? "var(--border)" : t.color}`,
              }}
            >
              {t.label || "Normal"}
            </button>
          ))}
        </div>

        {previewTierId && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 0" }}>
            <div
              key={previewKey}
              style={{
                width: 76,
                height: 76,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: `${PULSE_BY_TIER[previewTierId].animation} ${PULSE_BY_TIER[previewTierId].duration}s ease-out`,
              }}
            >
              <ChampAvatar ddragonId={previewChamp} size={64} />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--dim)" }}>
              {previewChamp ? byId[previewChamp] || previewChamp : "Ajoute un champion à un rôle pour un avatar réel"}
            </div>
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
          Forcer le compteur de tirages ratés d'un champion
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              style={{
                padding: "6px 12px",
                borderRadius: 7,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                background: role === r ? "var(--gold)" : "var(--card)",
                color: role === r ? "#1a1406" : "var(--dim)",
                border: `1px solid ${role === r ? "var(--gold)" : "var(--border)"}`,
              }}
            >
              {r} ({(championPool[r] || []).length})
            </button>
          ))}
        </div>

        {pool.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--dim)" }}>Ajoute des champions à ce rôle pour pouvoir tester leur compteur.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pool.map((id) => {
              const tier = rarityFor(weights[id], pool.length);
              return (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <RarityFrame tier={tier} size={28}>
                    <ChampAvatar ddragonId={id} size={28} />
                  </RarityFrame>
                  <span style={{ fontSize: 12.5, color: "var(--text)", minWidth: 100 }}>{byId[id] || id}</span>
                  <Input
                    type="number"
                    min={0}
                    value={weights[id] || 0}
                    onChange={(e) => setChampionWeight(role, id, e.target.value)}
                    style={{ width: 70 }}
                  />
                  <div style={{ display: "flex", gap: 4 }}>
                    {RARITY_TIERS.map((t) => {
                      const threshold = Math.ceil(thresholdFor(t, pool.length));
                      return (
                      <button
                        key={t.id}
                        title={`Passer à ${t.label || "Normal"} (${threshold} misses pour cette pool de ${pool.length})`}
                        onClick={() => setChampionWeight(role, id, threshold)}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 4,
                          border: `1px solid ${t.id === "normal" ? "var(--border)" : t.color}`,
                          background: t.id === "normal" ? "transparent" : `${t.color}33`,
                          cursor: "pointer",
                        }}
                      />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Collapsible>
  );
}
