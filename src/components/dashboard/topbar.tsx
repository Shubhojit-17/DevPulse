import { UserMenu } from "@/components/dashboard/user-menu";

interface TopbarProps {
  title: string;
  subtitle?: string;
  user?: {
    name?: string | null;
    image?: string | null;
  };
}

export function Topbar({ title, subtitle, user }: TopbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          DevPulse dashboard
        </p>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <UserMenu name={user?.name} image={user?.image} />
    </div>
  );
}
