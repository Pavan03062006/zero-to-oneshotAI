import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listEntities, listRelationships } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CanonPill } from "./_authenticated.universe.$id.dna";
import { Target, Ghost, Mic, Route as RouteIcon, Link2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/universe/$id/characters")({
  component: Characters,
});

function Characters() {
  const { id } = useParams({ from: "/_authenticated/universe/$id/characters" });
  const q = useQuery({ queryKey: ["entities", id], queryFn: () => listEntities(id) });
  const rels = useQuery({ queryKey: ["relationships", id], queryFn: () => listRelationships(id) });
  const chars = (q.data ?? []).filter((e) => e.entity_type === "character");

  if (q.isLoading) return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-56 rounded-xl" />)}</div>;
  if (chars.length === 0) return (
    <div className="rounded-xl border border-dashed border-border/60 bg-card/30 p-10 text-center text-sm text-muted-foreground">
      No characters yet. Add a character in Story DNA and their goal, fear, voice, and arc will surface here.
    </div>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {chars.map((c) => {
        const attrs = (c.attributes ?? {}) as any;
        const cRels = (rels.data ?? []).filter((r) => r.source_entity_id === c.id || r.target_entity_id === c.id);
        return (
          <Card key={c.id} className="border-border/60 bg-card/60">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border/60"><AvatarFallback className="bg-secondary text-secondary-foreground">{c.name.slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
                  <div>
                    <div className="font-serif text-lg leading-tight">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{attrs.role ?? "Cast member"}</div>
                  </div>
                </div>
                <CanonPill status={c.canon_status} />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">{c.summary ?? "No summary."}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Trait icon={Target} label="Goal" value={attrs.goal ?? "—"} />
                <Trait icon={Ghost} label="Fear" value={attrs.fear ?? "—"} />
                <Trait icon={Mic} label="Voice" value={attrs.voice ?? "—"} />
                <Trait icon={RouteIcon} label="Arc" value={attrs.arc ?? "—"} />
              </div>
              {cRels.length > 0 && (
                <div className="pt-2 border-t border-border/60">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Link2 className="h-3 w-3" /> Relationships</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {cRels.slice(0,4).map((r) => <Badge key={r.id} variant="outline" className="text-[10px]">{r.relationship_type}</Badge>)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Trait({ icon: I, label, value }: any) {
  return (
    <div className="rounded-md border border-border/60 bg-background/40 p-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground"><I className="h-3 w-3" />{label}</div>
      <div className="mt-0.5 text-foreground/90 line-clamp-1">{value}</div>
    </div>
  );
}