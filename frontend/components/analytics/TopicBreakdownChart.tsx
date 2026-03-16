"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

interface TopicBreakdownChartProps {
  topicBreakdown: Record<string, { correct: number; total: number }>;
}

function getBarColor(pct: number): string {
  if (pct >= 80) return "#22c55e"; // success
  if (pct >= 50) return "#eab308"; // warning
  return "#ef4444"; // danger
}

interface ChartEntry {
  name: string;
  percentage: number;
  correct: number;
  total: number;
  label: string;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartEntry }>;
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-surface-2 border border-border/50 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="font-semibold text-primary text-sm mb-1">{d.name}</p>
      <p className="text-secondary text-xs">
        <span className="text-white font-mono">{d.correct}/{d.total}</span> correct · <span className="text-white font-mono">{d.percentage}%</span>
      </p>
    </div>
  );
};

const CustomLabel = (props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: string;
}) => {
  const { x = 0, y = 0, width = 0, height = 0, value } = props;
  if (!value) return null;
  return (
    <text
      x={x + width + 12}
      y={y + height / 2}
      fill="#A0A0A0"
      fontSize={12}
      fontFamily="var(--font-mono)"
      dominantBaseline="middle"
    >
      {value}
    </text>
  );
};

export function TopicBreakdownChart({
  topicBreakdown,
}: TopicBreakdownChartProps) {
  const data: ChartEntry[] = Object.entries(topicBreakdown)
    .map(([name, stats]) => {
      const pct =
        stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      return {
        name,
        percentage: pct,
        correct: stats.correct,
        total: stats.total,
        label: `${pct}% (${stats.correct}/${stats.total})`,
      };
    })
    .sort((a, b) => a.percentage - b.percentage);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted text-sm font-mono">
        No topic data available
      </div>
    );
  }

  const chartHeight = Math.max(300, data.length * 56);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 120, left: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#2A2A2A" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#555555", fontFamily: "var(--font-mono)" }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 13, fill: "#A0A0A0", fontWeight: 500 }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)", radius: 6 }} />
        <Bar dataKey="percentage" maxBarSize={32} radius={6}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} style={{ filter: `drop-shadow(0 0 10px ${getBarColor(entry.percentage)}80)` }} />
          ))}
          <LabelList dataKey="label" content={<CustomLabel />} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
