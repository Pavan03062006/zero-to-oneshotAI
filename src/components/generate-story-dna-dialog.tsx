import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import {
  generateStoryDna,
  STATUS_COPY,
  StoryEngineError,
  type GenerateStoryDnaResult,
} from "@/lib/story-engine";

export function GenerateStoryDnaDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState("");
  const [statusIdx, setStatusIdx] = useState(0);
  const [result, setResult] = useState<GenerateStoryDnaResult | null>(null);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () =>
      generateStoryDna({ projectId, creativeDirection: direction.trim() || undefined }),
    onSuccess: (data) => {
      setResult(data);
      toast.success("Story DNA generated — review your proposed canon");
      qc.invalidateQueries({ queryKey: ["entities", projectId] });
      qc.invalidateQueries({ queryKey: ["relationships", projectId] });
      qc.invalidateQueries({ queryKey: ["events", projectId] });
      qc.invalidateQueries({ queryKey: ["timelines", projectId] });
      qc.invalidateQueries({ queryKey: ["docs", projectId] });
      qc.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (e: StoryEngineError | Error) => {
      const friendly = e instanceof StoryEngineError ? e.friendly : e.message;
      toast.error(friendly);
    },
  });

  useEffect(() => {
    if (!mut.isPending) return;
    setStatusIdx(0);
    const id = setInterval(() => setStatusIdx((i) => (i + 1) % STATUS_COPY.dna.length), 1800);
    return () => clearInterval(id);
  }, [mut.isPending]);

  const handleClose = (next: boolean) => {
    if (mut.isPending) return;
    setOpen(next);
    if (!next) {
      setResult(null);
      mut.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 uppercase tracking-wider">
          <Sparkles className="h-4 w-4" /> Generate Story DNA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-wide flex items-center gap-2">
            <Wand2 className="h-5 w-5" /> Generate Story DNA
          </DialogTitle>
          <DialogDescription>
            The story engine drafts characters, locations, events, and a Story Bible from your
            project premise. Everything lands as{" "}
            <span className="text-foreground font-medium">Proposed canon</span> — nothing is
            auto-approved.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3 py-2">
            <div className="rounded-3xl border border-border/60 bg-card/60 p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Fresh material
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <Stat label="Entities" value={result.entities?.length ?? 0} />
                <Stat label="Events" value={result.events?.length ?? 0} />
                <Stat label="Story Bible" value={result.document?.id ? 1 : 0} />
              </div>
              {result.document?.title && (
                <div className="text-xs text-muted-foreground mt-3">
                  Story Bible drafted:{" "}
                  <span className="text-foreground">{result.document.title}</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-4">
                All new material is badged <span className="text-foreground">PROPOSED</span> until
                you accept it into canon.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="direction">Creative direction (optional)</Label>
              <Textarea
                id="direction"
                rows={5}
                placeholder="Anchor the tone, spotlight a protagonist, forbid a trope, seed a mystery…"
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                disabled={mut.isPending}
              />
            </div>
            {mut.isPending && (
              <div className="flex items-center gap-3 rounded-full border border-border/60 bg-card/60 px-4 py-2 text-sm text-muted-foreground motion-safe:animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span aria-live="polite">{STATUS_COPY.dna[statusIdx]}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={() => handleClose(false)}>Review proposed canon</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => handleClose(false)} disabled={mut.isPending}>
                Cancel
              </Button>
              <Button
                onClick={() => mut.mutate()}
                disabled={mut.isPending}
                className="gap-2 uppercase tracking-wider"
              >
                {mut.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-3xl font-medium tracking-tight text-primary">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
