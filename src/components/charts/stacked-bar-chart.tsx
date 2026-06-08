"use client";

import { usePathname } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface StackedBarPoint {
  date: string;
  [key: string]: string | number;
}

interface StackedBarChartProps {
  data: StackedBarPoint[];
  bars: { key: string; label: string; color: string }[];
}

export function StackedBarChart({ data, bars }: StackedBarChartProps) {
  const pathname = usePathname();

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
      <BarChart key={pathname} data={data}>
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
        <Legend />
        {bars.map((bar) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            fill={bar.color}
            name={bar.label}
            stackId="a"
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
