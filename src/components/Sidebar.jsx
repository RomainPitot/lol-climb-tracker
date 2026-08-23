import { Swords } from "lucide-react";
import { NAV } from "../constants/nav.js";
import RankBadge from "./RankBadge.jsx";

export default function Sidebar({ page, setPage, currentRank }) {
  return (
    <aside
      style={{
        width: 232,
        flexShrink: 0,
        background: "var(--bg-elevated)",
        borderRight: "1px solid var(--border)",
        padding: "22px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 20px" }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "linear-gradient(155deg, var(--yone), var(--tahm))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Swords size={16} color="#0A0D13" />
        </div>
        <div
          style={{
            fontFamily: "var(--display)",
            fontWeight: 700,
            fontSize: 17,
            color: "var(--text)",
            letterSpacing: 0.5,
          }}
        >
          CLIMB.EUW
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: 8,
                background: active ? "rgba(212,175,55,0.12)" : "transparent",
                color: active ? "var(--gold)" : "var(--dim)",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                textAlign: "left",
                width: "100%",
              }}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
        <RankBadge tier={currentRank.tier} div={currentRank.div} lp={currentRank.lp} size="sm" />
      </div>
    </aside>
  );
}
