import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listEntities, listDocuments, listIssues, listEvents, listProjects } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  BookOpen,
  ShieldAlert,
  Clock,
  ArrowRight,
  Sparkles,
  Activity,
  Lightbulb,
  MapPin,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/universe/$id/")({
  component: Overview,
});

function Overview() {
  const { id } = useParams({ from: "/_authenticated/universe/$id/" });
  const entities = useQuery({ queryKey: ["entities", id], queryFn: () => listEntities(id) });
  const docs = useQuery({ queryKey: ["docs", id], queryFn: () => listDocuments(id) });
  const issues = useQuery({ queryKey: ["issues", id], queryFn: () => listIssues(id) });
  const events = useQuery({ queryKey: ["events", id], queryFn: () => listEvents(id) });
  const projects = useQuery({ queryKey: ["projects"], queryFn: listProjects });

  const loading =
    entities.isLoading ||
    docs.isLoading ||
    issues.isLoading ||
    events.isLoading ||
    projects.isLoading;
  const characters = (entities.data ?? []).filter((e) => e.entity_type === "character");
  const approved = (entities.data ?? []).filter((e) => e.canon_status === "approved").length;
  const proposed = (entities.data ?? []).filter((e) => e.canon_status === "proposed").length;
  const openIssues = (issues.data ?? []).filter((i) => i.status === "open");
  const recentEvents = (events.data ?? []).slice(-5).reverse();
  const recentDocs = (docs.data ?? []).slice(-5).reverse();
  const story = projects.data?.find((project) => project.id === id);
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
  if (entities.error || docs.error || issues.error || events.error || projects.error)
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
        Unable to load this universe overview. Refresh to retry.
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Story Bible</div>
        <h1 className="font-serif text-4xl">{story?.title ?? "Your story"}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Editorial signals based on the story information you’ve saved so far. These are prompts
          for reflection, not grades.
        </p>
        {story?.premise && (
          <p className="max-w-2xl pt-3 font-serif text-xl leading-relaxed text-foreground/80">
            {story.premise}
          </p>
        )}
      </div>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <InsightCard
          icon={Activity}
          title="Story momentum"
          text={
            recentDocs.length > 0
              ? `${recentDocs.length} chapter${recentDocs.length === 1 ? "" : "s"} in the latest saved activity.`
              : "Write a chapter to begin seeing movement here."
          }
        />
        <InsightCard
          icon={Users}
          title="Character activity"
          text={
            characters.length > 0
              ? `${characters.length} character${characters.length === 1 ? "" : "s"} currently appear in your Story Bible.`
              : "Your cast will appear as the story takes shape."
          }
        />
        <InsightCard
          icon={Lightbulb}
          title="Suggested focus"
          text={
            openIssues.length > 0
              ? "A continuity finding is waiting for review. Consider checking it before adding more scenes."
              : "Keep writing. Deeper editorial signals emerge as more chapters and events accumulate."
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="font-serif text-xl">Recent story movement</h2>
            </div>
            {recentEvents.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No story events are recorded yet. As your chapters grow, important developments will
                gather here.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {recentEvents.map((event) => (
                  <div key={event.id} className="border-l-2 border-primary/30 pl-3">
                    <div className="text-sm font-medium">{event.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {event.description ?? "A recorded story event."}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="font-serif text-xl">Narrative balance</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {events.data?.length
                ? `${events.data.length} story event${events.data.length === 1 ? "" : "s"} and ${docs.data?.length ?? 0} chapter${(docs.data?.length ?? 0) === 1 ? "" : "s"} are currently recorded.`
                : "There is not enough saved story activity to make a meaningful balance observation yet."}
            </p>
            <div className="mt-4 rounded-xl border border-border/60 bg-background/30 p-3 text-xs text-muted-foreground">
              This view uses available chapter and Story Bible records only. It does not infer
              pacing, emotional arcs, or literary quality.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Foundation records (estimate)
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
        <QuickLink
          id={id}
          to={`/universe/${id}/memory`}
          title="Ask your story"
          desc="Connect approved facts, chapters, and events with evidence."
        />
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardContent className="p-5">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="mt-3 font-serif text-xl">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
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
