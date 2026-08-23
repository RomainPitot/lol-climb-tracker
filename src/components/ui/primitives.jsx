import { useState } from "react";
import { AlertTriangle, ArrowUp, ArrowDown, Minus, ChevronDown } from "lucide-react";

export const Card = ({ children, className = "", style = {} }) => (
  <div
    className={`rounded-xl ${className}`}
    style={{ background: "var(--card)", border: "1px solid var(--border)", ...style }}
  >
    {children}
  </div>
);

export const SectionTitle = ({ children, sub }) => (
  <div className="mb-4">
    <h2
      style={{
        fontFamily: "var(--display)",
        fontSize: 22,
        fontWeight: 700,
        color: "var(--text)",
        letterSpacing: 0.3,
      }}
    >
      {children}
    </h2>
    {sub && <p style={{ color: "var(--dim)", fontSize: 13, marginTop: 2 }}>{sub}</p>}
  </div>
);

const PILL_TONES = {
  neutral: { bg: "rgba(139,147,167,0.12)", fg: "var(--dim)" },
  win: { bg: "rgba(15,214,138,0.14)", fg: "var(--win)" },
  loss: { bg: "rgba(255,92,92,0.14)", fg: "var(--loss)" },
  gold: { bg: "rgba(212,175,55,0.14)", fg: "var(--gold)" },
};

export const Pill = ({ children, tone = "neutral" }) => {
  const t = PILL_TONES[tone] || PILL_TONES.neutral;
  return (
    <span
      style={{
        background: t.bg,
        color: t.fg,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
};

export const StatCard = ({ label, value, sub, tone }) => (
  <Card className="p-4">
    <div style={{ fontSize: 12, color: "var(--dim)", fontWeight: 500, marginBottom: 6 }}>{label}</div>
    <div
      style={{
        fontFamily: "var(--display)",
        fontSize: 26,
        fontWeight: 700,
        color: tone || "var(--text)",
      }}
    >
      {value}
    </div>
    {sub && <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>{sub}</div>}
  </Card>
);

export const Field = ({ label, children, required }) => (
  <label
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 6,
      fontSize: 12,
      color: "var(--dim)",
      fontWeight: 500,
    }}
  >
    <span>
      {label}
      {required && <span style={{ color: "var(--loss)" }}> *</span>}
    </span>
    {children}
  </label>
);

const inputStyle = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "9px 10px",
  color: "var(--text)",
  fontSize: 13,
  outline: "none",
  width: "100%",
};

export const Input = ({ style, ...props }) => <input {...props} style={{ ...inputStyle, ...style }} />;

export const Select = ({ children, style, ...props }) => (
  <select {...props} style={{ ...inputStyle, ...style }}>
    {children}
  </select>
);

export const TextArea = ({ style, ...props }) => (
  <textarea {...props} style={{ ...inputStyle, resize: "vertical", ...style }} />
);

const BTN_VARIANTS = {
  primary: { background: "var(--gold)", color: "#1a1406", border: "1px solid var(--gold)", fontWeight: 700 },
  ghost: { background: "transparent", color: "var(--text)", border: "1px solid var(--border)" },
  danger: { background: "transparent", color: "var(--loss)", border: "1px solid rgba(255,92,92,0.35)" },
};

export const Btn = ({ children, onClick, variant = "ghost", style = {}, type = "button", disabled }) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 14px",
      borderRadius: 8,
      fontSize: 13,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      ...BTN_VARIANTS[variant],
      ...style,
    }}
  >
    {children}
  </button>
);

/** Avertit quand une stat repose sur trop peu de games pour être significative. */
export function LowSample({ n, min = 10 }) {
  if (n >= min) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        color: "var(--gold)",
        background: "rgba(212,175,55,0.1)",
        padding: "4px 8px",
        borderRadius: 6,
        marginTop: 4,
      }}
    >
      <AlertTriangle size={12} /> Échantillon faible ({n} games) — interprétation prudente.
    </div>
  );
}

/** Delta signé avec flèche. `invert` = une baisse est une bonne nouvelle. */
export function Trend({ value, suffix = "", invert = false, decimals = 1 }) {
  if (value === null || value === undefined || !isFinite(value)) {
    return <span style={{ color: "var(--dim)" }}>—</span>;
  }
  const flat = Math.abs(value) < 0.05;
  const good = invert ? value < 0 : value > 0;
  const color = flat ? "var(--dim)" : good ? "var(--win)" : "var(--loss)";
  const Icon = flat ? Minus : value > 0 ? ArrowUp : ArrowDown;

  return (
    <span style={{ color, display: "inline-flex", alignItems: "center", gap: 2, fontWeight: 600, fontSize: 12 }}>
      <Icon size={12} />
      {Math.abs(value).toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function Collapsible({ title, sub, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="mb-4" style={{ padding: 0, overflow: "hidden" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: "14px 18px",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{title}</div>
          {sub && <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2 }}>{sub}</div>}
        </div>
        <ChevronDown
          size={16}
          color="var(--dim)"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s", flexShrink: 0 }}
        />
      </button>
      {open && <div style={{ padding: "0 18px 18px" }}>{children}</div>}
    </Card>
  );
}

export function EmptyChart({ label }) {
  return (
    <div
      style={{
        height: 180,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--dim)",
        fontSize: 13,
      }}
    >
      {label}
    </div>
  );
}
