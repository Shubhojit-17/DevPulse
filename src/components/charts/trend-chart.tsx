"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TimeSeriesPoint {
  date: string;
  value: number;
}

interface TrendChartProps {
  data: TimeSeriesPoint[];
  label: string;
  color?: string;
}

export function TrendChart({ data, label, color = "#0f766e" }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No data available
      </div>
    );
  }

  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.1)" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          stroke="rgba(15, 23, 42, 0.3)"
          fontSize={12}
        />
        <YAxis stroke="rgba(15, 23, 42, 0.3)" fontSize={12} />
        <Tooltip
          labelFormatter={formatDate}
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid rgba(15, 23, 42, 0.1)",
            borderRadius: "8px",
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          name={label}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
