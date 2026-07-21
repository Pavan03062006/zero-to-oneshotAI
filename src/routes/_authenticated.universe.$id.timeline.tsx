import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  listTimelines,
  listEvents,
  createTimeline,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, Sparkles } from "lucide-react";
import { CanonPill } from "./_authenticated.universe.$id.dna";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/universe/$id/timeline")({
  component: TimelinePage,
});

function TimelinePage() {
  const { id } = useParams({ from: "/_authenticated/universe/$id/timeline" });
  const tls = useQuery({ queryKey: ["timelines", id], queryFn: () => listTimelines(id) });
  const evs = useQuery({ queryKey: ["events", id], queryFn: () => listEvents(id) });
  const qc = useQueryClient();
  const [active, setActive] = useState<string | "all">("all");

  if (tls.isLoading || evs.isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (tls.error || evs.error)
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
        Unable to load the timeline. Refresh to retry.
      </div>
    );
  const timelines = tls.data ?? [];
  const events = (evs.data ?? []).filter((e) => active === "all" || e.timeline_id === active);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Timelines</div>
        <button onClick={() => setActive("all")} className={chip(active === "all")}>
          All threads
        </button>
        {timelines.map((t) => (
          <button key={t.id} onClick={() => setActive(t.id)} className={chip(active === t.id)}>
            <span className="flex items-center gap-1.5">
              {t.is_primary ? (
                <Sparkles className="h-3 w-3 text-primary" />
              ) : (
                <GitBranch className="h-3 w-3 text-accent" />
              )}
              {t.name}
            </span>
          </button>
        ))}
        <BranchDialog
          projectId={id}
          parentTimelineId={
            active === "all"
              ? (timelines.find((timeline) => timeline.is_primary)?.id ?? null)
              : active
          }
          onCreated={(timelineId) => {
            qc.invalidateQueries({ queryKey: ["timelines", id] });
            setActive(timelineId);
          }}
        />
        <EventDialog
          projectId={id}
          timelineId={
            active === "all"
              ? (timelines.find((timeline) => timeline.is_primary)?.id ?? null)
              : active
          }
          nextOrder={events.length}
          onCreated={() => qc.invalidateQueries({ queryKey: ["events", id] })}
        />
      </aside>

      <div className="relative pl-6">
        <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-primary/60 via-accent/40 to-transparent" />
        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
            No events on this timeline yet. Story events appear here as you draft chapters and
            confirm canon.
          </div>
        ) : (
          events.map((e) => (
            <div key={e.id} className="relative pl-6 pb-8">
              <div className="absolute -left-0.5 top-1.5 h-3 w-3 rounded-full bg-primary shadow-glow" />
              <div className="text-xs text-muted-foreground">
                {e.story_time ?? `Sequence ${e.sequence_order}`}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="font-serif text-lg">{e.title}</div>
                <CanonPill status={e.canon_status} />
              </div>
              {e.description && (
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{e.description}</p>
              )}
              {e.timeline_id && (
                <Badge variant="outline" className="mt-2 text-[10px]">
                  {timelines.find((t) => t.id === e.timeline_id)?.name ?? "Timeline"}
                </Badge>
              )}
              <EventEditor
                event={e}
                onSaved={() => qc.invalidateQueries({ queryKey: ["events", id] })}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BranchDialog({
  projectId,
  parentTimelineId,
  onCreated,
}: {
  projectId: string;
  parentTimelineId: string | null;
  onCreated: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [point, setPoint] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      createTimeline({
        project_id: projectId,
        name: name.trim(),
        parent_timeline_id: parentTimelineId,
        branch_point: point.trim() || null,
      }),
    onSuccess: (timeline) => {
      setOpen(false);
      setName("");
      setPoint("");
      onCreated(timeline.id);
      toast.success("Alternate branch created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-3 gap-1.5">
          <GitBranch className="h-3.5 w-3.5" /> Branch alternate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Create a story branch</DialogTitle>
          <DialogDescription>
            Fork the current canon at a decision point. The branch can develop independently without
            changing the primary timeline.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="branch-name">Branch name</Label>
            <Input
              id="branch-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="The door stays closed"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-point">Branch point (optional)</Label>
            <Textarea
              id="branch-point"
              rows={3}
              value={point}
              onChange={(event) => setPoint(event.target.value)}
              placeholder="Describe the choice or event where this timeline diverges."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
            Create branch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EventDialog({
  projectId,
  timelineId,
  nextOrder,
  onCreated,
}: {
  projectId: string;
  timelineId: string | null;
  nextOrder: number;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      createEvent({
        project_id: projectId,
        timeline_id: timelineId,
        title: title.trim(),
        description,
        sequence_order: nextOrder,
      }),
    onSuccess: () => {
      setOpen(false);
      setTitle("");
      setDescription("");
      onCreated();
      toast.success("Story beat added");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Add story beat
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Add story beat</DialogTitle>
          <DialogDescription>
            Add a scene, turning point, or future moment. You can reorder it later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="beat-title">Title</Label>
            <Input
              id="beat-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="The signal returns"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="beat-description">Description</Label>
            <Textarea
              id="beat-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What changes in this beat?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!title.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
            Add beat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EventEditor({
  event,
  onSaved,
}: {
  event: import("@/lib/types").StoryEvent;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [order, setOrder] = useState(String(event.sequence_order));
  const save = useMutation({
    mutationFn: () =>
      updateEvent(event.id, {
        title: title.trim(),
        description,
        sequence_order: Math.max(0, Number(order) || 0),
      }),
    onSuccess: () => {
      setEditing(false);
      onSaved();
      toast.success("Story beat updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: () => deleteEvent(event.id),
    onSuccess: onSaved,
    onError: (error: Error) => toast.error(error.message),
  });
  if (!editing)
    return (
      <div className="flex gap-2 mt-2">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          Edit beat
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={remove.isPending}
          onClick={() => remove.mutate()}
        >
          Delete
        </Button>
      </div>
    );
  return (
    <div className="space-y-2 rounded-xl border border-primary/30 bg-card/60 p-3 mt-2">
      <Input value={title} onChange={(event) => setTitle(event.target.value)} />
      <Textarea
        rows={2}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">
          Order{" "}
          <Input
            className="inline-flex ml-2 w-20"
            type="number"
            min="0"
            value={order}
            onChange={(event) => setOrder(event.target.value)}
          />
        </Label>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!title.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function chip(active: boolean) {
  return `w-full text-left px-3 py-2 rounded-md text-sm border transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-card/60"}`;
}
