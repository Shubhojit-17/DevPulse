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
} from "recharts";

interface BarDataPoint {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  data: BarDataPoint[];
  color?: string;
}

export function SimpleBarChart({ data, color = "#0f766e" }: SimpleBarChartProps) {
  const pathname = usePathname();

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart key={pathname} data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.1)" />
        <XAxis type="number" stroke="rgba(15, 23, 42, 0.3)" fontSize={12} />
        <YAxis
          dataKey="label"
          type="category"
          stroke="rgba(15, 23, 42, 0.3)"
          fontSize={12}
          width={100}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid rgba(15, 23, 42, 0.1)",
            borderRadius: "8px",
          }}
        />
        <Bar dataKey="value" fill={color} />
      </BarChart>
    </ResponsiveContainer>
  );
}
