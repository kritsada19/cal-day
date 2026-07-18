import Link from "next/link";

const highlights = [
  {
    title: "Simple tracking",
    description: "Track your calories, daily goals, and progress in a simple and clear view.",
    badge: "01",
  },
  {
    title: "Clear routines",
    description: "Follow simple daily goals and stay on track with your nutrition plan.",
    badge: "02",
  },
  {
    title: "Safe profile",
    description: "Keep your account safe while your progress stays easy to review.",
    badge: "03",
  },
];

export default function Home() {
  const consumed = 1420;
  const target = 2200;
  const percentage = Math.min((consumed / target) * 100, 100);
  const remaining = Math.max(target - consumed, 0);

  return (
    <div className="min-h-[85vh] flex-1 px-4 py-10 md:py-16 relative overflow-hidden bg-obsidian-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8">
          <section className="bg-obsidian-900 border border-white/10 p-8 md:p-10 shadow-glow-gold relative overflow-hidden">
            <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-gold-accent to-transparent"></div>
            <span className="absolute -top-px -left-px w-2.5 h-2.5 border-t border-l border-gold-accent"></span>
            <span className="absolute -top-px -right-px w-2.5 h-2.5 border-t border-r border-gold-accent"></span>
            <span className="absolute -bottom-px -left-px w-2.5 h-2.5 border-b border-l border-gold-accent"></span>
            <span className="absolute -bottom-px -right-px w-2.5 h-2.5 border-b border-r border-gold-accent"></span>

            <div className="inline-flex items-center gap-3 border border-gold-accent/30 bg-gold-accent/10 px-3 py-1.5 text-[10px] tracking-[0.35em] text-gold-accent font-mono uppercase">
              <span className="w-2 h-2 rounded-full bg-gold-accent"></span>
              SMART DAILY TRACKING
            </div>

            <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-[0.25em] text-white leading-tight">
              CALDAY
              <span className="block mt-3 text-sm sm:text-base tracking-[0.35em] text-gold-accent font-mono uppercase">
                SIMPLE DAILY CALORIE TRACKING
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-sm sm:text-base leading-7 text-white/70 font-mono">
              A simple place to track your calories, build steady habits, and stay focused on your daily goals.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                "Daily goals",
                "Simple insights",
                "Clear focus",
              ].map((tag) => (
                <span key={tag} className="border border-white/10 bg-obsidian-950 px-3 py-1.5 text-[10px] tracking-[0.3em] text-white/50 font-mono uppercase">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/signup" className="inline-flex items-center justify-center px-6 py-3 border border-gold-accent/40 bg-obsidian-950 text-gold-accent hover:text-white hover:bg-gold-accent/10 transition-all duration-300 text-[11px] font-semibold tracking-[0.25em] font-sans uppercase">
                Start tracking
              </Link>
              <Link href="/signin" className="inline-flex items-center justify-center px-6 py-3 border border-white/10 bg-white/5 text-white/80 hover:text-white hover:border-white/20 transition-all duration-300 text-[11px] font-semibold tracking-[0.25em] font-sans uppercase">
                Open profile
              </Link>
            </div>
          </section>

          <div className="space-y-6">
            <div className="bg-obsidian-900 border border-white/10 p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-emerald-accent to-transparent"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] tracking-[0.35em] text-white/40 font-mono uppercase">Today&apos;s progress</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[0.25em] text-white">Progress summary</h2>
                </div>
                <div className="border border-emerald-accent/40 bg-emerald-accent/10 px-3 py-1.5 text-[10px] tracking-[0.3em] text-emerald-accent font-mono uppercase">
                  LIVE
                </div>
              </div>

              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold text-white">{consumed}</p>
                  <p className="text-[10px] tracking-[0.3em] text-white/40 font-mono uppercase">Calories eaten</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-gold-accent">{target}</p>
                  <p className="text-[10px] tracking-[0.3em] text-white/40 font-mono uppercase">Daily target</p>
                </div>
              </div>

              <div className="mt-6 h-2 bg-white/5 border border-white/10 relative overflow-hidden">
                <div className="h-full bg-emerald-accent shadow-glow-emerald transition-all duration-500" style={{ width: `${percentage}%` }} />
              </div>

              <div className="mt-4 flex items-center justify-between text-[10px] tracking-[0.3em] text-white/40 font-mono uppercase">
                <span>Progress</span>
                <span className="text-gold-accent">{remaining} KCAL LEFT</span>
              </div>
            </div>

            <div className="bg-obsidian-900 border border-white/10 p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-full w-px bg-linear-to-b from-transparent via-gold-accent/40 to-transparent"></div>
              <p className="text-[10px] tracking-[0.35em] text-white/40 font-mono uppercase">Today at a glance</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="w-12 h-12 border border-gold-accent/40 bg-gold-accent/10 flex items-center justify-center text-gold-accent text-lg font-bold">
                  24
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-[0.2em] text-white uppercase">Steady habits</p>
                  <p className="mt-1 text-sm text-white/60 font-mono">Your routine is on track and ready for today.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {highlights.map((item) => (
            <article key={item.title} className="bg-obsidian-900 border border-white/10 p-6 relative overflow-hidden">
              <span className="absolute -top-px -left-px w-2 h-2 border-t border-l border-gold-accent/60"></span>
              <span className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-gold-accent/60"></span>
              <p className="text-[10px] tracking-[0.35em] text-gold-accent font-mono uppercase">{item.badge}</p>
              <h3 className="mt-3 text-lg font-semibold tracking-[0.2em] text-white uppercase">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/65 font-mono">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
