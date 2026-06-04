import { cn } from "@/lib/utils";

interface ChartShellProps {
  title: string;
  className?: string;
  children?: React.ReactNode;
}

export function ChartShell({ title, className, children }: ChartShellProps) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="rounded-2xl border border-dashed border-foreground/15 bg-background/60 p-4">
        {children}
      </div>
    </section>
  );
}
