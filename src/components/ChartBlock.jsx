import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "./ui/primitives.jsx";

const TOOLTIP_STYLE = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--text)",
};

/** Graphe linéaire multi-séries indexé sur le numéro de game. */
export default function ChartBlock({ title, data, lines, full }) {
  return (
    <Card className="p-4" style={full ? { gridColumn: "1 / -1" } : {}}>
      <div style={{ fontSize: 12, color: "var(--dim)", fontWeight: 600, marginBottom: 10 }}>
        {title.toUpperCase()}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="i" stroke="var(--dim)" fontSize={11} tickLine={false} />
          <YAxis stroke="var(--dim)" fontSize={11} tickLine={false} width={36} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          {lines.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.name}
              stroke={l.color}
              strokeWidth={2}
              dot={false}
              strokeOpacity={l.opacity || 1}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
