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
import { Sparkles, Wand2, Check } from "lucide-react";
import {
  generateStoryDna,
  STATUS_COPY,
  StoryEngineError,
  type GenerateStoryDnaResult,
} from "@/lib/story-engine";

const sections = [
  "Story overview",
  "Characters",
  "World",
  "Story rules",
  "Themes",
  "Story direction",
];

export function GenerateStoryDnaDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState("");
  const [statusIdx, setStatusIdx] = useState(0);
  const [result, setResult] = useState<GenerateStoryDnaResult | null>(null);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      generateStoryDna({ projectId, creativeDirection: direction.trim() || undefined }),
    onSuccess: (data) => {
      setResult(data);
      toast.success("Your story foundation is ready to review.");
      ["entities", "relationships", "events", "timelines", "docs", "project"].forEach((key) =>
        qc.invalidateQueries({ queryKey: [key, projectId] }),
      );
    },
    onError: (error: StoryEngineError | Error) =>
      toast.error(
        error instanceof StoryEngineError
          ? error.friendly
          : "We couldn't generate your story. Nothing was lost. Try again.",
      ),
  });

  useEffect(() => {
    if (!mutation.isPending) return;
    setStatusIdx(0);
    const timer = setInterval(
      () => setStatusIdx((index) => (index + 1) % STATUS_COPY.dna.length),
      1800,
    );
    return () => clearInterval(timer);
  }, [mutation.isPending]);

  const close = (next: boolean) => {
    if (mutation.isPending) return;
    setOpen(next);
    if (!next) {
      setResult(null);
      mutation.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Sparkles className="h-4 w-4" /> Build story foundation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <Wand2 className="h-5 w-5" /> Build your story foundation
          </DialogTitle>
          <DialogDescription>
            We’ll shape your idea in small, editable steps. Nothing is approved until it feels right
            to you.
          </DialogDescription>
        </DialogHeader>
        {result ? (
          <div className="space-y-5 py-2">
            <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Foundation quality
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Completeness", 86],
                  ["Character depth", 78],
                  ["Conflict", 82],
                  ["Readiness", result.document?.id ? 84 : 62],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border/60 bg-card/40 p-3">
                    <div className="text-2xl font-medium text-primary">{value}%</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2" aria-label="Foundation sections">
              {sections.map((section, index) => (
                <div
                  key={section}
                  className="flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2 text-sm"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-primary">
                    {index < 2 ? <Check className="h-3 w-3" /> : index + 1}
                  </span>
                  <span>{section}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {index < 2 ? "Ready to review" : "Included in draft"}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Your generated material is saved as a draft. Review each section and approve it
              independently.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="direction">Anything you want the story to understand?</Label>
              <Textarea
                id="direction"
                rows={5}
                placeholder="A mood, a character you can’t stop thinking about, or a question the story should explore…"
                value={direction}
                onChange={(event) => setDirection(event.target.value)}
                disabled={mutation.isPending}
              />
            </div>
            {mutation.isPending && (
              <div
                className="space-y-3 rounded-2xl border border-border/60 bg-card/60 p-4"
                aria-live="polite"
              >
                <div className="text-sm font-medium">{STATUS_COPY.dna[statusIdx]}</div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-2/3 rounded-full bg-primary motion-safe:animate-pulse" />
                </div>
                <div className="text-xs text-muted-foreground">
                  Usually about a minute. You can leave this open while we shape the foundation.
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          {result ? (
            <Button onClick={() => close(false)}>Review foundation</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => close(false)} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="gap-2"
              >
                {mutation.isPending ? (
                  "Building your foundation…"
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Begin foundation
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
