import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string;
  trend?: string;
  /** Positive = improvement, negative = regression, undefined = neutral */
  trendDirection?: "up" | "down" | "neutral";
  /** Whether "up" is good (deployment freq) or "down" is good (cycle time, failure rate) */
  positiveDirection?: "up" | "down";
}

export function MetricCard({
  label,
  value,
  trend,
  trendDirection = "neutral",
  positiveDirection = "down",
}: MetricCardProps) {
  const isPositive =
    trendDirection === "neutral"
      ? null
      : positiveDirection === "down"
      ? trendDirection === "down"
      : trendDirection === "up";

  const trendColor =
    isPositive === null
      ? "text-muted-foreground"
      : isPositive
      ? "text-emerald-600"
      : "text-rose-500";

  const trendIcon =
    trendDirection === "up" ? "▲" : trendDirection === "down" ? "▼" : "─";

  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
      </CardHeader>
      <CardContent>
        {trend && (
          <p className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <span className="text-xs">{trendIcon}</span>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
