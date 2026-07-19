import Link from "next/link";

const highlights = [
  {
    title: "Simple tracking",
    description: "Keep your nutrition goals clear with a calm and easy-to-read experience.",
    badge: "01",
  },
  {
    title: "Clear routines",
    description: "Build steady habits with a simple flow from profile setup to daily planning.",
    badge: "02",
  },
  {
    title: "Safe profile",
    description: "Enjoy a secure account experience while your personal information stays organized.",
    badge: "03",
  },
];

export default function Home() {
  return (
    <div className="min-h-[85vh] flex-1 px-4 py-10 md:py-16 relative overflow-hidden bg-obsidian-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-obsidian-900/90 p-8 shadow-[0_0_80px_rgba(212,175,55,0.08)] md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.14),transparent_45%)] pointer-events-none" />
            <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-gold-accent to-transparent" />
            <span className="absolute -top-px -left-px h-2.5 w-2.5 border-l border-t border-gold-accent" />
            <span className="absolute -top-px -right-px h-2.5 w-2.5 border-r border-t border-gold-accent" />
            <span className="absolute -bottom-px -left-px h-2.5 w-2.5 border-b border-l border-gold-accent" />
            <span className="absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-gold-accent" />

            <div className="inline-flex items-center gap-3 rounded-full border border-gold-accent/30 bg-gold-accent/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.35em] text-gold-accent">
              <span className="h-2 w-2 rounded-full bg-gold-accent" />
              Smart daily tracking
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-[0.25em] text-white sm:text-5xl">
              CALDAY
              <span className="mt-3 block text-sm font-mono uppercase tracking-[0.35em] text-gold-accent sm:text-base">
                Simple nutrition planning
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
              A calm and focused space to understand your nutrition goals, keep your profile organized, and stay consistent with a simple daily routine.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                "Daily goals",
                "Simple insights",
                "Clear focus",
              ].map((tag) => (
                <span key={tag} className="border border-white/10 bg-obsidian-950 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-white/50">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center border border-gold-accent/40 bg-obsidian-950 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-accent transition-all duration-300 hover:bg-gold-accent/10 hover:text-white"
              >
                Start tracking
              </Link>
              <Link
                href="/signin"
                className="inline-flex items-center justify-center border border-white/10 bg-white/5 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80 transition-all duration-300 hover:border-white/20 hover:text-white"
              >
                Open profile
              </Link>
            </div>
          </section>

          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-obsidian-900/90 p-6 md:p-8">
              <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-emerald-accent to-transparent" />
              <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/40">
                What this app does
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[0.25em] text-white">
                Stay focused
              </h2>

              <div className="mt-5 space-y-3 text-sm leading-7 text-white/70">
                <p>
                  Calday helps you keep your daily nutrition habits simple and focused.
                </p>
                <p>
                  You can create an account, fill in your profile, and review your personal targets in one place.
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-obsidian-900 via-obsidian-900 to-obsidian-950 p-6 md:p-8">
              <div className="absolute -right-8 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-gold-accent/10 blur-3xl" />
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center border border-gold-accent/40 bg-gold-accent/10 text-lg font-bold text-gold-accent">
                  ✦
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/40">
                    Built for clarity
                  </p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-[0.2em] text-white">
                    Clean and modern
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-white/70">
                The experience stays simple, polished, and easy to understand from the first visit.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.title} className="relative overflow-hidden rounded-2xl border border-white/10 bg-obsidian-900/90 p-6">
              <span className="absolute -top-px -left-px h-2 w-2 border-l border-t border-gold-accent/60" />
              <span className="absolute -bottom-px -right-px h-2 w-2 border-b border-r border-gold-accent/60" />
              <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-gold-accent">{item.badge}</p>
              <h3 className="mt-3 text-lg font-semibold uppercase tracking-[0.2em] text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/65">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
