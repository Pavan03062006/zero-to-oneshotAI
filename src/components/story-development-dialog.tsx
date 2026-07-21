import { useEffect, useRef, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Film, Loader2, Sparkles, Volume2, Pause, Play, Square } from "lucide-react";
import {
  generateDevelopmentPack,
  StoryEngineError,
  type DevelopmentPackResult,
} from "@/lib/story-engine";

export function StoryDevelopmentDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<"story" | "movie">("story");
  const [direction, setDirection] = useState("");
  const [result, setResult] = useState<DevelopmentPackResult | null>(null);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => generateDevelopmentPack({ projectId, format, direction: direction.trim() }),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["entities", projectId] });
      qc.invalidateQueries({ queryKey: ["docs", projectId] });
      qc.invalidateQueries({ queryKey: ["events", projectId] });
      toast.success(
        format === "movie" ? "Movie development pack created" : "Story development pack created",
      );
    },
    onError: (error: StoryEngineError | Error) =>
      toast.error(error instanceof StoryEngineError ? error.friendly : error.message),
  });
  useEffect(() => {
    if (!open) {
      setResult(null);
      mutation.reset();
    }
  }, [open]);
  const close = () => {
    if (!mutation.isPending) setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2">
          <Film className="h-4 w-4" /> Develop story
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Develop the next version
          </DialogTitle>
          <DialogDescription>
            Generate new plot directions, character growth, story beats, and a saved outline.
            Generated material stays proposed until you approve it.
          </DialogDescription>
        </DialogHeader>
        {result ? (
          <div className="space-y-4 py-2 max-h-[55vh] overflow-y-auto">
            <ReadAloud text={developmentText(result)} />
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Suggestions" value={result.suggestions.length} />
              <Stat label="Character arcs" value={result.character_arcs.length} />
              <Stat label="Story beats" value={result.beats.length} />
              <Stat label="Saved outline" value={result.document ? 1 : 0} />
            </div>
            {result.suggestions.length > 0 && (
              <section>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Creative directions
                </div>
                <ul className="space-y-2 text-sm">
                  {result.suggestions.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="rounded-lg bg-card/60 border border-border/60 p-3"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {result.character_arcs.length > 0 && (
              <section>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Character development
                </div>
                <div className="space-y-2">
                  {result.character_arcs.map((arc, index) => (
                    <div
                      key={`${arc.name}-${index}`}
                      className="rounded-lg border border-border/60 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{arc.name}</span>
                        <Badge variant="secondary">PROPOSED</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{arc.arc || arc.need}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {result.document && (
              <p className="text-xs text-muted-foreground">
                Saved as <span className="text-foreground">{result.document.title}</span> in
                Chapters and Versions.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={format === "story" ? "default" : "outline"}
                onClick={() => setFormat("story")}
              >
                Expand story
              </Button>
              <Button
                type="button"
                variant={format === "movie" ? "default" : "outline"}
                onClick={() => setFormat("movie")}
              >
                Create whole movie
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="development-direction">What should change or grow?</Label>
              <Textarea
                id="development-direction"
                rows={5}
                value={direction}
                onChange={(event) => setDirection(event.target.value)}
                disabled={mutation.isPending}
                placeholder="Add a rival, make the ending darker, branch after the midpoint, deepen the hero's fear…"
              />
            </div>
            {mutation.isPending && (
              <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Building your{" "}
                {format === "movie" ? "film treatment" : "story plan"}…
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          {result ? (
            <Button onClick={close}>Review proposed material</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={close} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" /> Generate
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function developmentText(result: DevelopmentPackResult) {
  return [
    ...result.suggestions,
    ...result.character_arcs.map((arc) => `${arc.name}. ${arc.arc || arc.need}`),
    ...result.beats.map((beat) => `${beat.title}. ${beat.purpose || beat.turning_point}`),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function ReadAloud({ text }: { text: string }) {
  const [reading, setReading] = useState(false);
  const [paused, setPaused] = useState(false);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(
    () => () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window)
        window.speechSynthesis.cancel();
    },
    [],
  );

  const stop = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window)
      window.speechSynthesis.cancel();
    utterance.current = null;
    setReading(false);
    setPaused(false);
  };

  const start = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }
    if (!text.trim()) {
      toast.message("There is no generated text to read yet.");
      return;
    }
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find(
        (item) =>
          /en-US|en-GB/i.test(item.lang) &&
          /natural|neural|google|microsoft|samantha|alex/i.test(item.name),
      ) ?? voices.find((item) => /en-US|en-GB/i.test(item.lang));
    const next = new SpeechSynthesisUtterance(text);
    next.voice = voice ?? null;
    next.rate = 0.92;
    next.pitch = 1;
    next.onend = () => {
      setReading(false);
      setPaused(false);
      utterance.current = null;
    };
    next.onerror = (event) => {
      if (event.error !== "canceled" && event.error !== "interrupted")
        toast.error("The generated story could not be read aloud.");
      setReading(false);
      setPaused(false);
      utterance.current = null;
    };
    utterance.current = next;
    setReading(true);
    setPaused(false);
    window.speechSynthesis.speak(next);
  };

  const toggle = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  };

  return !reading ? (
    <Button size="sm" variant="outline" className="gap-1.5" onClick={start}>
      <Volume2 className="h-3.5 w-3.5" /> Read generated story aloud
    </Button>
  ) : (
    <div className="flex items-center gap-1">
      <Button size="sm" variant="outline" className="gap-1.5" onClick={toggle}>
        {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        {paused ? "Resume" : "Pause"}
      </Button>
      <Button size="sm" variant="ghost" onClick={stop} aria-label="Stop reading">
        <Square className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-3">
      <div className="text-2xl font-medium text-primary">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
