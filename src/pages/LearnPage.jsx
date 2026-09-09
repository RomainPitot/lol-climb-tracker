import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Search,
  Check,
  Crosshair,
  Map,
  Users,
  Flag,
  Package,
  Brain,
  Layers,
  Video,
  Timer,
  ArrowRightLeft,
  Compass,
  MessageSquare,
} from "lucide-react";
import { Card, SectionTitle, Eyebrow, ToggleChip, Input, Pill } from "../components/ui/primitives.jsx";
import WaveDiagram from "../components/learn/WaveDiagram.jsx";
import RunesDiagram from "../components/learn/RunesDiagram.jsx";
import VisionDiagram from "../components/learn/VisionDiagram.jsx";
import TradesDiagram from "../components/learn/TradesDiagram.jsx";
import MacroDiagram from "../components/learn/MacroDiagram.jsx";
import { LEARN_COVERS } from "../components/learn/LearnCover.jsx";
import { LEARN_ARTICLES, LEARN_CATEGORIES } from "../constants/learnContent.js";

const DIAGRAMS = { wave: WaveDiagram, runes: RunesDiagram, vision: VisionDiagram, trades: TradesDiagram, macro: MacroDiagram };

/** Icônes disponibles pour un cover générique (article sans diagramme bespoke, voir
 * constants/learnContent.js champ `cover: { icon, color }`). */
const ICONS = { Crosshair, Map, Users, Flag, Package, Brain, Layers, Video, Timer, ArrowRightLeft, Compass, MessageSquare };

const categoryLabel = (id) => LEARN_CATEGORIES.find((c) => c.id === id)?.label || id;

/** Petite image de présentation sur une carte — un diagramme bespoke condensé (voir
 * LEARN_COVERS) si l'article en a un, sinon une icône colorée générique. La coche "lu"
 * (voir data.learnRead) se superpose en haut à droite, sans changer la mise en page. */
function ArticleCover({ article, read }) {
  const Cover = LEARN_COVERS[article.diagram];
  const Icon = !Cover && article.cover ? ICONS[article.cover.icon] : null;

  return (
    <div style={{ height: 116, position: "relative", background: Cover ? "var(--bg-elevated)" : article.cover ? `${article.cover.color}18` : "var(--bg-elevated)" }}>
      {Cover && <Cover />}
      {!Cover && Icon && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={40} color={article.cover.color} strokeWidth={1.6} />
        </div>
      )}
      {read && (
        <div
          title="Déjà lu"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "var(--win)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={13} color="#0A0D13" strokeWidth={3} />
        </div>
      )}
    </div>
  );
}

function ArticleCard({ article, read, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="hoverable"
      style={{
        textAlign: "left",
        padding: 0,
        borderRadius: "var(--radius-lg)",
        background: "var(--card)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        opacity: read ? 0.85 : 1,
      }}
    >
      <ArticleCover article={article} read={read} />
      <div style={{ padding: 18 }}>
        <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 17, color: "var(--text)", marginBottom: 8 }}>
          {article.title}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--dim)", lineHeight: 1.5 }}>{article.tagline}</div>
      </div>
    </button>
  );
}

const GRID_STYLE = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, maxWidth: 1120 };

export default function LearnPage({ data, markLearnRead }) {
  const [activeId, setActiveId] = useState(null);
  const [category, setCategory] = useState(null);
  const [query, setQuery] = useState("");
  const readIds = data?.learnRead || [];
  const active = LEARN_ARTICLES.find((a) => a.id === activeId);

  const openArticle = (id) => {
    setActiveId(id);
    markLearnRead?.(id);
  };

  if (active) {
    return (
      <ArticleView
        article={active}
        read={readIds.includes(active.id)}
        onBack={() => setActiveId(null)}
        onOpen={openArticle}
      />
    );
  }

  const q = query.trim().toLowerCase();
  const matches = (a) => !q || a.title.toLowerCase().includes(q) || a.tagline.toLowerCase().includes(q);
  const visible = LEARN_ARTICLES.filter((a) => (!category || a.category === category) && matches(a));

  return (
    <div>
      <SectionTitle sub={`Mini-tutos courts sur les fondamentaux — à lire en 2-3 minutes. ${readIds.length}/${LEARN_ARTICLES.length} lus.`}>
        Learn
      </SectionTitle>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <div style={{ position: "relative", flex: "0 1 260px" }}>
          <Search size={14} color="var(--dim)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un tuto…"
            style={{ paddingLeft: 32 }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
        <ToggleChip active={category === null} onClick={() => setCategory(null)}>
          Tous ({LEARN_ARTICLES.length})
        </ToggleChip>
        {LEARN_CATEGORIES.map((c) => {
          const count = LEARN_ARTICLES.filter((a) => a.category === c.id).length;
          if (!count) return null;
          return (
            <ToggleChip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
              {c.label} ({count})
            </ToggleChip>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--dim)" }}>Aucun tuto ne correspond à cette recherche.</p>
      ) : (
        LEARN_CATEGORIES.map((c) => {
          const inCategory = visible.filter((a) => a.category === c.id);
          if (!inCategory.length) return null;
          // Le libellé de section devient redondant une fois qu'on a déjà filtré sur cette
          // seule catégorie via les chips — pas la peine de le répéter au-dessus de la liste.
          const showHeader = category === null;
          return (
            <div key={c.id} style={{ marginBottom: 28 }}>
              {showHeader && (
                <Eyebrow style={{ marginBottom: 12, color: "var(--gold)" }}>{c.label}</Eyebrow>
              )}
              <div style={GRID_STYLE}>
                {inCategory.map((a) => (
                  <ArticleCard key={a.id} article={a} read={readIds.includes(a.id)} onOpen={() => openArticle(a.id)} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function ArticleView({ article, read, onBack, onOpen }) {
  const Diagram = DIAGRAMS[article.diagram];

  const siblings = useMemo(() => LEARN_ARTICLES.filter((a) => a.category === article.category), [article.category]);
  const idx = siblings.findIndex((a) => a.id === article.id);
  const prev = siblings[idx - 1];
  const next = siblings[idx + 1];

  // Un tuto ouvert directement depuis le lien précédent/suivant doit aussi remonter en
  // haut de l'article plutôt que de garder le scroll de la fin de l'article précédent.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [article.id]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--dim)", marginBottom: 16 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--dim)", cursor: "pointer", padding: 0, fontSize: 12.5 }}>
          <ChevronLeft size={15} /> Learn
        </button>
        <span>/</span>
        <span>{categoryLabel(article.category)}</span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
        <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 26, color: "var(--text)" }}>
          {article.title}
        </div>
        {read && (
          <Pill tone="win" title="Déjà lu">
            <Check size={11} style={{ marginRight: 3 }} /> Lu
          </Pill>
        )}
      </div>
      <p style={{ fontSize: 13, color: "var(--dim)", marginBottom: 20 }}>{article.tagline}</p>

      {Diagram && (
        <Card className="p-4 mb-5" style={{ display: "flex", justifyContent: "center" }}>
          <Diagram />
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {article.sections.map((s, i) => (
          <Card key={s.heading} className="p-4" style={{ display: "flex", gap: 14 }}>
            <div
              style={{
                flexShrink: 0,
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "rgba(212,175,55,0.12)",
                border: "1px solid var(--gold)",
                color: "var(--gold)",
                fontSize: 11.5,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {i + 1}
            </div>
            <div>
              <Eyebrow style={{ marginBottom: 8 }}>{s.heading}</Eyebrow>
              <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{s.text}</p>
            </div>
          </Card>
        ))}
      </div>

      {article.video && (
        <Card className="p-4 mt-5">
          <Eyebrow style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <PlayCircle size={13} /> Vidéo
          </Eyebrow>
          <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "var(--radius-md)" }}>
            <iframe
              src={article.video}
              title={`Vidéo — ${article.title}`}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
              allowFullScreen
            />
          </div>
        </Card>
      )}

      {(prev || next) && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
          {prev ? (
            <button
              onClick={() => onOpen(prev.id)}
              className="hoverable"
              style={{ display: "flex", alignItems: "center", gap: 8, textAlign: "left", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 14px", cursor: "pointer", color: "var(--text)", maxWidth: "48%" }}
            >
              <ChevronLeft size={15} color="var(--dim)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 10, color: "var(--dim)" }}>Précédent</div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{prev.title}</div>
              </div>
            </button>
          ) : (
            <div />
          )}
          {next && (
            <button
              onClick={() => onOpen(next.id)}
              className="hoverable"
              style={{ display: "flex", alignItems: "center", gap: 8, textAlign: "right", justifyContent: "flex-end", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 14px", cursor: "pointer", color: "var(--text)", maxWidth: "48%", marginLeft: "auto" }}
            >
              <div>
                <div style={{ fontSize: 10, color: "var(--dim)" }}>Suivant</div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{next.title}</div>
              </div>
              <ChevronRight size={15} color="var(--dim)" style={{ flexShrink: 0 }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
