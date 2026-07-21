import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listTimelines, listEvents } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, Sparkles } from "lucide-react";
import { CanonPill } from "./_authenticated.universe.$id.dna";

export const Route = createFileRoute("/_authenticated/universe/$id/timeline")({
  component: TimelinePage,
});

function TimelinePage() {
  const { id } = useParams({ from: "/_authenticated/universe/$id/timeline" });
  const tls = useQuery({ queryKey: ["timelines", id], queryFn: () => listTimelines(id) });
  const evs = useQuery({ queryKey: ["events", id], queryFn: () => listEvents(id) });
  const [active, setActive] = useState<string | "all">("all");

  if (tls.isLoading || evs.isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (tls.error || evs.error) return <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm">Unable to load the timeline. Refresh to retry.</div>;
  const timelines = tls.data ?? [];
  const events = (evs.data ?? []).filter((e) => active === "all" || e.timeline_id === active);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Timelines</div>
        <button onClick={() => setActive("all")} className={chip(active === "all")}>All threads</button>
        {timelines.map((t) => (
          <button key={t.id} onClick={() => setActive(t.id)} className={chip(active === t.id)}>
            <span className="flex items-center gap-1.5">
              {t.is_primary ? <Sparkles className="h-3 w-3 text-primary" /> : <GitBranch className="h-3 w-3 text-accent" />}
              {t.name}
            </span>
          </button>
        ))}
        <Button variant="outline" size="sm" className="w-full mt-3 gap-1.5"><GitBranch className="h-3.5 w-3.5" /> Branch alternate</Button>
      </aside>

      <div className="relative pl-6">
        <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-primary/60 via-accent/40 to-transparent" />
        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
            No events on this timeline yet. Story events appear here as you draft chapters and confirm canon.
          </div>
        ) : events.map((e) => (
          <div key={e.id} className="relative pl-6 pb-8">
            <div className="absolute -left-0.5 top-1.5 h-3 w-3 rounded-full bg-primary shadow-glow" />
            <div className="text-xs text-muted-foreground">{e.story_time ?? `Sequence ${e.sequence_order}`}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="font-serif text-lg">{e.title}</div>
              <CanonPill status={e.canon_status} />
            </div>
            {e.description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{e.description}</p>}
            {e.timeline_id && (
              <Badge variant="outline" className="mt-2 text-[10px]">
                {timelines.find((t) => t.id === e.timeline_id)?.name ?? "Timeline"}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function chip(active: boolean) {
  return `w-full text-left px-3 py-2 rounded-md text-sm border transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-card/60"}`;
}
