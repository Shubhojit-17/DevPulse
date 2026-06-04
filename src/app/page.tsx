export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col">
      <div className="absolute inset-0 -z-10 bg-hero-gradient" />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3 text-lg font-semibold tracking-tight">
          <span className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center">
            DP
          </span>
          DevPulse
        </div>
        <div className="flex items-center gap-3 text-sm font-medium">
          <a className="text-muted-foreground hover:text-foreground" href="/signin">
            Sign in
          </a>
          <a
            className="rounded-full bg-foreground px-4 py-2 text-background hover:bg-foreground/90"
            href="/signin"
          >
            Connect GitHub
          </a>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 pb-20 pt-8">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Engineering signal, not noise
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              A real-time pulse on delivery health, review flow, and deployment
              momentum.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              DevPulse ingests GitHub activity, computes DORA + flow metrics, and
              turns raw engineering data into a weekly narrative your team can
              act on.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90"
                href="/signin"
              >
                Start with GitHub
              </a>
              <a
                className="rounded-full border border-foreground/20 px-5 py-2.5 text-sm font-medium text-foreground hover:border-foreground/40"
                href="#features"
              >
                Explore metrics
              </a>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-panel/60 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Current week
                </p>
                <h2 className="text-2xl font-semibold">Delivery snapshot</h2>
              </div>
              <span className="rounded-full bg-success/20 px-3 py-1 text-xs text-success">
                +12% momentum
              </span>
            </div>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-white/5 bg-background/50 p-4">
                <p className="text-xs text-muted-foreground">Lead time</p>
                <p className="text-2xl font-semibold">8.4 hrs</p>
                <p className="text-xs text-muted-foreground">Down from 11.2 hrs</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-background/50 p-4">
                <p className="text-xs text-muted-foreground">Deployment frequency</p>
                <p className="text-2xl font-semibold">3.2 / day</p>
                <p className="text-xs text-muted-foreground">Stable across repos</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-background/50 p-4">
                <p className="text-xs text-muted-foreground">Review latency</p>
                <p className="text-2xl font-semibold">4.1 hrs</p>
                <p className="text-xs text-muted-foreground">First review velocity up</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "DORA + flow metrics",
              copy: "Cycle time, lead time, review load, and deployment reliability in one feed.",
            },
            {
              title: "Automated weekly digest",
              copy: "Gemini-powered summaries highlight what moved and why it matters.",
            },
            {
              title: "Live delivery dashboard",
              copy: "Filter by repository and time window to surface trends instantly.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-white/10 bg-panel/40 p-6 shadow-soft"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.copy}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
