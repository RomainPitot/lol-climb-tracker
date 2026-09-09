import { useState } from "react";
import {
  ChevronLeft,
  PlayCircle,
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
import { Card, SectionTitle, Eyebrow } from "../components/ui/primitives.jsx";
import WaveDiagram from "../components/learn/WaveDiagram.jsx";
import RunesDiagram from "../components/learn/RunesDiagram.jsx";
import VisionDiagram from "../components/learn/VisionDiagram.jsx";
import TradesDiagram from "../components/learn/TradesDiagram.jsx";
import MacroDiagram from "../components/learn/MacroDiagram.jsx";
import { LEARN_COVERS } from "../components/learn/LearnCover.jsx";
import { LEARN_ARTICLES } from "../constants/learnContent.js";

const DIAGRAMS = { wave: WaveDiagram, runes: RunesDiagram, vision: VisionDiagram, trades: TradesDiagram, macro: MacroDiagram };

/** Icônes disponibles pour un cover générique (article sans diagramme bespoke, voir
 * constants/learnContent.js champ `cover: { icon, color }`). */
const ICONS = { Crosshair, Map, Users, Flag, Package, Brain, Layers, Video, Timer, ArrowRightLeft, Compass, MessageSquare };

/** Petite image de présentation sur une carte de la liste — un diagramme bespoke condensé
 * (voir LEARN_COVERS) si l'article en a un, sinon une icône colorée générique. */
function ArticleCover({ article }) {
  const Cover = LEARN_COVERS[article.diagram];
  if (Cover) {
    return (
      <div style={{ height: 72, background: "var(--bg-elevated)" }}>
        <Cover />
      </div>
    );
  }
  if (article.cover) {
    const Icon = ICONS[article.cover.icon];
    if (!Icon) return null;
    return (
      <div style={{ height: 72, background: `${article.cover.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={28} color={article.cover.color} strokeWidth={1.75} />
      </div>
    );
  }
  return null;
}

export default function LearnPage() {
  const [activeId, setActiveId] = useState(null);
  const active = LEARN_ARTICLES.find((a) => a.id === activeId);

  if (active) return <ArticleView article={active} onBack={() => setActiveId(null)} />;

  return (
    <div>
      <SectionTitle sub="Mini-tutos courts sur les fondamentaux — à lire en 2-3 minutes, pas des guides exhaustifs.">
        Learn
      </SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {LEARN_ARTICLES.map((a) => (
          <button
            key={a.id}
            onClick={() => setActiveId(a.id)}
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
            }}
          >
            <ArticleCover article={a} />
            <div style={{ padding: 16 }}>
              <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 6 }}>
                {a.title}
              </div>
              <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.4 }}>{a.tagline}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ArticleView({ article, onBack }) {
  const Diagram = DIAGRAMS[article.diagram];

  return (
    <div>
      <button
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--dim)", cursor: "pointer", fontSize: 12.5, marginBottom: 16, padding: 0 }}
      >
        <ChevronLeft size={15} /> Retour à Learn
      </button>

      <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 26, color: "var(--text)", marginBottom: 6 }}>
        {article.title}
      </div>
      <p style={{ fontSize: 13, color: "var(--dim)", marginBottom: 20 }}>{article.tagline}</p>

      {Diagram && (
        <Card className="p-4 mb-5" style={{ display: "flex", justifyContent: "center" }}>
          <Diagram />
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {article.sections.map((s) => (
          <Card key={s.heading} className="p-4">
            <Eyebrow style={{ marginBottom: 8 }}>{s.heading}</Eyebrow>
            <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{s.text}</p>
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
    </div>
  );
}
