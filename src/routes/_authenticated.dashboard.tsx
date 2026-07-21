import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { listProjects } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, GitBranch, Search, Plus, Sparkles, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Writer";
  const [q, setQ] = useState("");
  const { data, isLoading, error } = useQuery({ queryKey: ["projects"], queryFn: listProjects });

  const projects = data ?? [];
  const filtered = useMemo(
    () => projects.filter((p) => p.title.toLowerCase().includes(q.toLowerCase())),
    [projects, q],
  );

  const hour = new Date().getHours();
  const greet =
    hour < 5
      ? "Late-night writing"
      : hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-10">
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{greet}</div>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight mt-2">
            Welcome back, <span className="text-gradient">{displayName}</span>
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Your writing room, ready when you are. Pick up a chapter, check your story’s health, or
            start something new.
          </p>
        </div>
        <Link to="/new-universe">
          <Button size="lg" className="gap-2 shadow-glow">
            <Plus className="h-4 w-4" /> New story
          </Button>
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <HealthCard
          icon={Activity}
          label="Story health"
          value="Stable"
          sub="Your stories are in good shape"
          tone="ok"
        />
        <HealthCard
          icon={GitBranch}
          label="Open threads"
          value="Awaiting"
          sub="Ideas waiting for your attention"
          tone="warn"
        />
        <HealthCard
          icon={Sparkles}
          label="Continuity"
          value="Watching"
          sub="Your story stays consistent"
          tone="ok"
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-2xl tracking-tight">Your stories</h2>
          <div className="relative w-72 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search stories…"
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
            Failed to load universes. Refresh to retry.
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link key={p.id} to="/universe/$id" params={{ id: p.id }}>
                <Card className="group border-border/60 bg-card/60 hover:bg-card/90 hover:border-primary/40 transition h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                        {p.genre ?? "Unclassified"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{p.status ?? "draft"}</span>
                    </div>
                    <div className="font-serif text-xl mt-2 group-hover:text-primary transition">
                      {p.title}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {p.premise ?? "No premise yet."}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Writing status</span>
                      <span>{p.status === "active" ? "In progress" : (p.status ?? "Draft")}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" /> Chapters
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> Cast
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HealthCard({
  icon: I,
  label,
  value,
  sub,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  sub: string;
  tone: "ok" | "warn";
}) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <I className={`h-4 w-4 ${tone === "ok" ? "text-primary" : "text-accent"}`} />
        </div>
        <div className="mt-3 font-serif text-2xl">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-12 text-center">
      <Sparkles className="mx-auto h-6 w-6 text-primary" />
      <h3 className="font-serif text-xl mt-3">Your first story starts here</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
        Bring a premise, a mood, or one impossible question. We’ll help you shape the world around
        it.
      </p>
      <Link to="/new-universe">
        <Button className="mt-4 gap-2">
          <Plus className="h-4 w-4" /> Create a story
        </Button>
      </Link>
    </div>
  );
}
