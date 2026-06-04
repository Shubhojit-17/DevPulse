"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MultiLinePoint {
  date: string;
  [key: string]: string | number;
}

interface SeriesConfig {
  key: string;
  label: string;
  color: string;
}

interface MultiLineTrendChartProps {
  data: MultiLinePoint[];
  series: SeriesConfig[];
}

export function MultiLineTrendChart({ data, series }: MultiLineTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No data available for the selected window
      </div>
    );
  }

  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          stroke="rgba(15, 23, 42, 0.25)"
          fontSize={11}
          tickLine={false}
        />
        <YAxis
          stroke="rgba(15, 23, 42, 0.25)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          labelFormatter={formatDate}
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.97)",
            border: "1px solid rgba(15, 23, 42, 0.1)",
            borderRadius: "10px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            name={s.label}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
