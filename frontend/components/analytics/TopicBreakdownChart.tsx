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
  if (pct >= 80) return "#16a34a";
  if (pct >= 50) return "#d97706";
  return "#dc2626";
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
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg">
      <p className="font-medium text-slate-800 text-sm">{d.name}</p>
      <p className="text-slate-500 text-xs mt-0.5">
        {d.correct}/{d.total} correct · {d.percentage}%
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
      x={x + width + 8}
      y={y + height / 2}
      fill="#64748b"
      fontSize={11}
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
      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
        No topic data available
      </div>
    );
  }

  const chartHeight = Math.max(300, data.length * 52);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 110, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#475569" }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
        <Bar dataKey="percentage" maxBarSize={28} radius={4}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
          ))}
          <LabelList dataKey="label" content={<CustomLabel />} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
