import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listEntities, upsertEntity } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle2, CircleDashed } from "lucide-react";
import { toast } from "sonner";
import type { EntityType, StoryEntity } from "@/lib/types";
import { GenerateStoryDnaDialog } from "@/components/generate-story-dna-dialog";

const TYPES: EntityType[] = [
  "character",
  "location",
  "organization",
  "object",
  "world_rule",
  "theme",
  "plot_thread",
];

const TYPE_LABEL: Record<EntityType, string> = {
  character: "Characters",
  location: "Locations",
  organization: "Organizations",
  object: "Objects",
  world_rule: "World rules",
  theme: "Themes",
  plot_thread: "Plot threads",
};

export const Route = createFileRoute("/_authenticated/universe/$id/dna")({
  component: StoryDNA,
});

function StoryDNA() {
  const { id } = useParams({ from: "/_authenticated/universe/$id/dna" });
  const [filter, setFilter] = useState<EntityType | "all">("all");
  const q = useQuery({ queryKey: ["entities", id], queryFn: () => listEntities(id) });
  const entities = q.data ?? [];
  const filtered = filter === "all" ? entities : entities.filter((e) => e.entity_type === filter);
  const approved = entities.filter((e) => e.canon_status === "approved").length;
  const proposed = entities.filter((e) => e.canon_status === "proposed").length;
  const health = approved + proposed ? Math.round((approved / (approved + proposed)) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border/60 bg-card/60 p-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Story engine</div>
          <div className="text-lg font-medium mt-1">Seed this universe with proposed canon</div>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg">Draft characters, locations, timelines, and a Story Bible from your premise. You review and approve everything before it becomes canon.</p>
        </div>
        <GenerateStoryDnaDialog projectId={id} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/60"><CardContent className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Canon health</div>
          <div className="font-serif text-3xl mt-1">{health}%</div>
          <Progress value={health} className="h-1.5 mt-3" />
        </CardContent></Card>
        <Card className="border-border/60 bg-card/60"><CardContent className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Approved facts</div>
          <div className="font-serif text-3xl mt-1 text-primary">{approved}</div>
          <div className="text-xs text-muted-foreground mt-1">Locked into canon</div>
        </CardContent></Card>
        <Card className="border-border/60 bg-card/60"><CardContent className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Proposed facts</div>
          <div className="font-serif text-3xl mt-1 text-accent">{proposed}</div>
          <div className="text-xs text-muted-foreground mt-1">Awaiting your call</div>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All</FilterChip>
          {TYPES.map((t) => (
            <FilterChip key={t} active={filter === t} onClick={() => setFilter(t)}>{label(t)}</FilterChip>
          ))}
        </div>
        <EntityDialog projectId={id} />
      </div>

      {q.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/30 p-10 text-center text-sm text-muted-foreground">
          No {filter === "all" ? "entities" : label(filter).toLowerCase()} yet. Add one to seed your Story DNA.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => <EntityCard key={e.id} e={e} />)}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs border transition ${active ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
    >{children}</button>
  );
}

function label(t: EntityType) {
  return TYPE_LABEL[t];
}

function EntityCard({ e }: { e: StoryEntity }) {
  return (
    <Card className="border-border/60 bg-card/60 hover:border-primary/40 transition">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{e.entity_type.replace("_"," ")}</Badge>
          <CanonPill status={e.canon_status} />
        </div>
        <div className="font-serif text-lg mt-2">{e.name}</div>
        <p className="text-sm text-muted-foreground line-clamp-3 mt-1">{e.summary ?? "No summary yet."}</p>
      </CardContent>
    </Card>
  );
}

export function CanonPill({ status }: { status: StoryEntity["canon_status"] }) {
  if (status === "approved") return <span className="inline-flex items-center gap-1 text-[10px] text-primary"><CheckCircle2 className="h-3 w-3" /> canon</span>;
  if (status === "proposed") return <span className="inline-flex items-center gap-1 text-[10px] text-accent"><CircleDashed className="h-3 w-3" /> proposed</span>;
  if (status === "alternate") return <span className="text-[10px] text-muted-foreground">alternate</span>;
  return <span className="text-[10px] text-muted-foreground">superseded</span>;
}

function EntityDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<EntityType>("character");
  const [summary, setSummary] = useState("");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => upsertEntity({ project_id: projectId, name, entity_type: type, summary, canon_status: "proposed" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entities", projectId] });
      toast.success("Entity added to Story DNA");
      setOpen(false); setName(""); setSummary("");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Add entity</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-serif">New Story DNA entity</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2"><Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as EntityType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{label(t)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Summary</Label><Textarea rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button disabled={!name || mut.isPending} onClick={() => mut.mutate()}>{mut.isPending ? "Saving…" : "Propose to canon"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}