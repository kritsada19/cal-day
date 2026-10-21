import Link from "next/link";
import { Sparkles } from "lucide-react";

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

const tags = ["Daily goals", "Simple insights", "Clear focus"];

export default function Home() {
  return (
    <div className="relative min-h-[85vh] flex-1 overflow-hidden bg-canvas px-4 py-10 text-ink selection:bg-highlight selection:text-ink md:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/50 blur-3xl"
      />

      <div className="relative mx-auto max-w-280">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-line bg-surface p-6 shadow-soft sm:p-8 md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-highlight px-3 py-1.5 text-sm font-medium text-ink">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary" />
              Smart daily tracking
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
              CALDAY
              <span className="mt-3 block text-lg font-medium tracking-normal text-primary sm:text-xl">
                Simple nutrition planning
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              A calm and focused space to understand your nutrition goals, keep your profile organized, and stay consistent with a simple daily routine.
            </p>

            <ul className="mt-7 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-line bg-primary-tint px-3 py-1.5 text-sm text-ink"
                >
                  {tag}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/signup"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto"
              >
                Start tracking
              </Link>
              <Link
                href="/signin"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary-tint px-6 py-3 text-base font-semibold text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto"
              >
                Open profile
              </Link>
            </div>
          </section>

          <div className="space-y-6">
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft md:p-8">
              <p className="text-sm font-medium text-muted">What this app does</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                Stay focused
              </h2>

              <div className="mt-5 space-y-3 text-base leading-7 text-muted">
                <p>
                  Calday helps you keep your daily nutrition habits simple and focused.
                </p>
                <p>
                  You can create an account, fill in your profile, and review your personal targets in one place.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-highlight text-ink">
                  <Sparkles className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted">Built for clarity</p>
                  <p className="mt-0.5 text-base font-semibold text-ink">Clean and modern</p>
                </div>
              </div>
              <p className="mt-4 text-base leading-7 text-muted">
                The experience stays simple, polished, and easy to understand from the first visit.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-3 md:gap-6">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-line bg-surface p-6 shadow-soft"
            >
              <p className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-highlight px-2 text-sm font-semibold text-ink">
                {item.badge}
              </p>
              <h3 className="mt-4 text-lg font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-base leading-7 text-muted">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}