import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listEntities, listDocuments, listIssues, listEvents } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, ShieldAlert, Clock, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/universe/$id/")({
  component: Overview,
});

function Overview() {
  const { id } = useParams({ from: "/_authenticated/universe/$id/" });
  const entities = useQuery({ queryKey: ["entities", id], queryFn: () => listEntities(id) });
  const docs = useQuery({ queryKey: ["docs", id], queryFn: () => listDocuments(id) });
  const issues = useQuery({ queryKey: ["issues", id], queryFn: () => listIssues(id) });
  const events = useQuery({ queryKey: ["events", id], queryFn: () => listEvents(id) });

  const loading = entities.isLoading || docs.isLoading || issues.isLoading || events.isLoading;
  const characters = (entities.data ?? []).filter((e) => e.entity_type === "character");
  const approved = (entities.data ?? []).filter((e) => e.canon_status === "approved").length;
  const proposed = (entities.data ?? []).filter((e) => e.canon_status === "proposed").length;
  const openIssues = (issues.data ?? []).filter((i) => i.status === "open");

  const health =
    approved + proposed === 0 ? 0 : Math.round((approved / (approved + proposed)) * 100);

  if (loading)
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  if (entities.error || docs.error || issues.error || events.error)
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
        Unable to load this universe overview. Refresh to retry.
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          icon={Users}
          label="Characters"
          value={characters.length}
          sub={`${entities.data?.length ?? 0} total entities`}
        />
        <Stat
          icon={BookOpen}
          label="Chapters"
          value={docs.data?.length ?? 0}
          sub="Living manuscript"
        />
        <Stat
          icon={Clock}
          label="Story events"
          value={events.data?.length ?? 0}
          sub="Across all timelines"
        />
        <Stat
          icon={ShieldAlert}
          label="Open continuity"
          value={openIssues.length}
          sub="Awaiting resolution"
          tone={openIssues.length > 0 ? "warn" : "ok"}
        />
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Canon health
              </div>
              <div className="font-serif text-3xl mt-1">{health}%</div>
              <div className="text-sm text-muted-foreground mt-1">
                {approved} approved · {proposed} proposed facts
              </div>
            </div>
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <Progress value={health} className="h-1.5 mt-4" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <QuickLink
          id={id}
          to={`/universe/${id}/chapters`}
          title="Pick up writing"
          desc="Open the last chapter and let autosave handle the rest."
        />
        <QuickLink
          id={id}
          to={`/universe/${id}/continuity`}
          title="Resolve continuity"
          desc="Review flagged conflicts with cited canon sources."
        />
        <QuickLink
          id={id}
          to={`/universe/${id}/characters`}
          title="Deepen a character"
          desc="Refine goals, fears, and voice as your story evolves."
        />
        <QuickLink
          id={id}
          to={`/universe/${id}/timeline`}
          title="Trace the timeline"
          desc="Zoom the cinematic timeline or branch an alternate."
        />
      </div>
    </div>
  );
}

function Stat({ icon: I, label, value, sub, tone = "ok" }: any) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <I className={`h-4 w-4 ${tone === "ok" ? "text-primary" : "text-accent"}`} />
        </div>
        <div className="font-serif text-3xl mt-2">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      </CardContent>
    </Card>
  );
}

function QuickLink({ to, title, desc }: { id: string; to: string; title: string; desc: string }) {
  return (
    <Link to={to as any}>
      <Card className="border-border/60 bg-card/40 hover:bg-card/70 hover:border-primary/40 transition">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <div className="font-serif text-lg">{title}</div>
            <div className="text-sm text-muted-foreground mt-1">{desc}</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
