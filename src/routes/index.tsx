import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { GitBranch, Users, Clock, ShieldCheck, BookOpen, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard", replace: true });
  }, [user, loading, nav]);

  return (
    <div className="min-h-screen bg-[color:var(--pumice)] text-[color:var(--obsidian)]">
      {/* Nav — Limestone pill */}
      <header className="mx-auto max-w-[1280px] px-6 pt-6">
        <div className="flex items-center justify-between rounded-full bg-[color:var(--limestone)] px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--obsidian)] text-[color:var(--ember)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-serif text-[22px] tracking-[0.04em]">ONESHOT</span>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {["Story foundation", "Writing room", "Continuity", "Story Memory"].map((n) => (
              <a
                key={n}
                href="#pillars"
                className="rounded-full px-3 py-2 text-[15px] font-medium hover:bg-[color:var(--pumice)]"
              >
                {n}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="hidden rounded-full px-4 py-2 text-[15px] font-medium hover:bg-[color:var(--pumice)] sm:inline-block"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ember)] px-5 py-2.5 text-[15px] font-medium text-[color:var(--obsidian)] hover:brightness-95"
            >
              Start writing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-[1280px] gap-10 px-6 pt-16 pb-20 lg:grid-cols-[1.15fr_1fr] lg:items-end">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[color:var(--sulfur)] px-3 py-1 text-[12px] font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--obsidian)]" />
            CONTINUITY-FIRST AI STORYTELLING
          </div>
          <h1 className="font-serif text-[clamp(64px,12vw,180px)] leading-[0.94] tracking-[0.02em]">
            Build stories
            <br />
            that remember.
          </h1>
          <p className="mt-8 max-w-xl text-[16px] leading-[1.55] text-[color:var(--obsidian)]/80">
            Turn one idea into a living story universe that stays organized, consistent, and ready
            to grow.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ember)] px-6 py-3 text-[16px] font-medium text-[color:var(--obsidian)] hover:brightness-95"
            >
              Open the writers' room <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#pillars"
              className="inline-flex items-center gap-2 rounded-[40px] border-[1.5px] border-[color:var(--obsidian)] px-6 py-3 text-[16px] font-medium hover:bg-[color:var(--limestone)]"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Halftone hero block */}
        <div className="halftone-hero relative aspect-[4/5] w-full rounded-[40px] overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 p-8">
            <div className="font-serif text-[color:var(--chalk)] text-[clamp(40px,6vw,72px)] leading-[0.94] tracking-[0.02em]">
              STORY
              <br />
              DNA
              <br />
              ENGINE
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-20">
        <div className="rounded-[40px] bg-[color:var(--limestone)] p-8 md:p-12">
          <div className="max-w-2xl">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--obsidian)]/60">
              A quieter way to write
            </div>
            <p className="mt-4 font-serif text-[clamp(32px,5vw,64px)] leading-none">
              Your characters, rules, chapters, and questions—held in one living place.
            </p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section id="pillars" className="mx-auto max-w-[1280px] px-6 pb-24">
        <div className="mb-10 flex items-end justify-between gap-6">
          <h2 className="font-serif text-[clamp(48px,8vw,96px)] leading-[0.94] tracking-[0.02em]">
            Every pillar.
            <br />
            One canon.
          </h2>
          <p className="hidden max-w-sm text-[16px] leading-[1.55] text-[color:var(--obsidian)]/70 md:block">
            A writers' room, a development studio, and a continuity guardrail — folded into one
            workspace.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: GitBranch,
              t: "Story DNA",
              d: "Canon facts with proposed and approved states across every entity.",
            },
            {
              icon: Users,
              t: "Characters in voice",
              d: "Goals, fears, arcs, and relationships kept inside continuity.",
            },
            {
              icon: Clock,
              t: "Story memory",
              d: "Ask why a relationship exists or where a promise began, with evidence from your story.",
            },
            {
              icon: BookOpen,
              t: "Chapter workspace",
              d: "Distraction-free writing with autosave and inline AI assist.",
            },
            {
              icon: ShieldCheck,
              t: "Continuity center",
              d: "Cited evidence, conflicting canon, one-click resolutions.",
            },
            {
              icon: Sparkles,
              t: "Story consistency",
              d: "Review possible contradictions with calm, traceable evidence before they become continuity problems.",
            },
          ].map(({ icon: I, t, d }) => (
            <div key={t} className="rounded-[40px] bg-[color:var(--limestone)] p-10">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--obsidian)] text-[color:var(--ember)]">
                <I className="h-5 w-5" />
              </span>
              <div className="mt-6 font-serif text-[32px] leading-none tracking-[0.02em]">{t}</div>
              <p className="mt-3 text-[16px] leading-[1.55] text-[color:var(--obsidian)]/75">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA — Obsidian */}
      <section className="mx-auto max-w-[1280px] px-6 pb-16">
        <div className="rounded-[40px] bg-[color:var(--obsidian)] p-10 text-[color:var(--chalk)] md:p-16">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
            <h3 className="font-serif text-[clamp(40px,7vw,80px)] leading-[0.94] tracking-[0.02em]">
              From spark to
              <br />
              shipped canon.
            </h3>
            <Link
              to="/auth"
              className="justify-self-start inline-flex items-center gap-2 rounded-full bg-[color:var(--ember)] px-6 py-3 text-[16px] font-medium text-[color:var(--obsidian)] hover:brightness-95 md:justify-self-end"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
