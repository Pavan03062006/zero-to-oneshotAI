import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  listDocuments,
  updateDocument,
  createDocument,
  listIssues,
  getDocument,
  createRevision,
} from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Plus,
  Sparkles,
  ShieldAlert,
  Check,
  Loader2,
  Volume2,
  Pause,
  Play,
  Square,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { ContinuityScanButton } from "@/components/continuity-scan-button";

export const Route = createFileRoute("/_authenticated/universe/$id/chapters")({
  component: Chapters,
});

function Chapters() {
  const { id } = useParams({ from: "/_authenticated/universe/$id/chapters" });
  const qc = useQueryClient();
  const docs = useQuery({ queryKey: ["docs", id], queryFn: () => listDocuments(id) });
  const issues = useQuery({ queryKey: ["issues", id], queryFn: () => listIssues(id) });
  const [selected, setSelected] = useState<string | null>(null);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  useEffect(() => {
    if (!selected && docs.data && docs.data.length) setSelected(docs.data[0].id);
  }, [docs.data, selected]);

  const create = useMutation({
    mutationFn: () =>
      createDocument(id, `Chapter ${(docs.data?.length ?? 0) + 1}`, (docs.data?.length ?? 0) + 1),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["docs", id] });
      setSelected(d.id);
      toast.success("Chapter added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (docs.isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (docs.error)
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
        Unable to load chapters. Refresh to retry.
      </div>
    );
  const list = docs.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 lg:hidden">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setChaptersOpen((value) => !value)}
          aria-expanded={chaptersOpen}
        >
          Chapters
        </Button>
        <h1 className="sr-only">Writing workspace</h1>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setContextOpen((value) => !value)}
          aria-expanded={contextOpen}
        >
          Context
        </Button>
      </div>
      <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside className={`${chaptersOpen ? "block" : "hidden"} space-y-1 lg:block`}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Chapters</div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => create.mutate()}
              disabled={create.isPending}
              aria-label="Add chapter"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {list.length === 0 ? (
            <div className="text-xs text-muted-foreground rounded-md border border-dashed border-border/60 p-4">
              No chapters yet.
            </div>
          ) : (
            list.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelected(d.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm border transition ${selected === d.id ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:bg-card/60 text-muted-foreground hover:text-foreground"}`}
              >
                <div className="font-medium text-foreground/90 truncate">{d.title}</div>
                <div className="text-[10px] text-muted-foreground">{d.word_count ?? 0} words</div>
              </button>
            ))
          )}
        </aside>

        {selected ? (
          <Editor key={selected} docId={selected} />
        ) : (
          <div className="rounded-xl border border-dashed border-border/60 grid place-items-center text-sm text-muted-foreground">
            Select or create a chapter to begin writing.
          </div>
        )}

        <aside className={`${contextOpen ? "block" : "hidden"} space-y-3 lg:block`}>
          <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" /> Continuity
          </div>
          {issues.error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs">
              Unable to load continuity issues.
            </div>
          ) : (issues.data ?? []).filter((i) => i.status === "open").slice(0, 5).length === 0 ? (
            <div className="rounded-md border border-border/60 bg-card/40 p-3 text-xs text-muted-foreground">
              Clean canon so far. The engine is watching every save.
            </div>
          ) : (
            (issues.data ?? [])
              .filter((i) => i.status === "open")
              .slice(0, 5)
              .map((i) => (
                <div key={i.id} className="rounded-md border border-border/60 bg-card/60 p-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={i.severity === "critical" ? "destructive" : "outline"}
                      className="text-[10px]"
                    >
                      {i.severity}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{i.status}</span>
                  </div>
                  <div className="text-sm font-medium mt-1">{i.title}</div>
                  {i.explanation && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                      {i.explanation}
                    </p>
                  )}
                </div>
              ))
          )}
        </aside>
      </div>
    </div>
  );
}

function Editor({ docId }: { docId: string }) {
  const qc = useQueryClient();
  const { id: projectId } = useParams({ from: "/_authenticated/universe/$id/chapters" });
  const q = useQuery({ queryKey: ["doc", docId], queryFn: () => getDocument(docId) });
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "saved_without_revision">(
    "idle",
  );
  const [isReading, setIsReading] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechQueueRef = useRef<string[]>([]);
  const speechIndexRef = useRef(0);
  const speechVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const speakNextRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (q.data) {
      setTitle(q.data.title);
      setContent(q.data.content);
    }
  }, [q.data]);

  const words = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);

  useEffect(() => {
    if (!q.data) return;
    if (title === q.data.title && content === q.data.content) return;
    setState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await updateDocument(docId, { title, content, word_count: words });
        try {
          await createRevision({
            document_id: docId,
            project_id: projectId,
            content,
            change_summary: "autosave",
          });
          qc.invalidateQueries({ queryKey: ["revisions", docId] });
        } catch {
          setState("saved_without_revision");
          toast.warning("Chapter saved, but its revision checkpoint could not be created.");
          qc.invalidateQueries({ queryKey: ["docs", projectId] });
          return;
        }
        setState("saved");
        qc.invalidateQueries({ queryKey: ["docs", projectId] });
      } catch (e) {
        setState("idle");
        toast.error((e as Error).message);
      }
    }, 900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const chooseVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      speechVoiceRef.current =
        voices.find(
          (voice) =>
            /en-US|en-GB/i.test(voice.lang) &&
            /natural|neural|google|microsoft|samantha|alex/i.test(voice.name),
        ) ??
        voices.find((voice) => /en-US|en-GB/i.test(voice.lang)) ??
        voices[0] ??
        null;
    };
    chooseVoice();
    window.speechSynthesis.addEventListener("voiceschanged", chooseVoice);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", chooseVoice);
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        speechQueueRef.current = [];
      }
    };
  }, []);

  const stopReading = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window)
      window.speechSynthesis.cancel();
    speechQueueRef.current = [];
    speechIndexRef.current = 0;
    speechRef.current = null;
    setIsReading(false);
    setIsPaused(false);
  };

  const startReading = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }
    if (!content.trim()) {
      toast.message("Add some chapter text before reading it aloud.");
      return;
    }
    window.speechSynthesis.cancel();
    speechQueueRef.current = content
      .split(/\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    speechIndexRef.current = 0;
    setIsReading(true);
    setIsPaused(false);
    speakNextRef.current();
  };

  speakNextRef.current = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const next = speechQueueRef.current[speechIndexRef.current];
    if (!next) {
      setIsReading(false);
      setIsPaused(false);
      speechRef.current = null;
      return;
    }
    const utterance = new SpeechSynthesisUtterance(next);
    utterance.voice = speechVoiceRef.current;
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.onend = () => {
      speechIndexRef.current += 1;
      speakNextRef.current();
    };
    utterance.onerror = (event) => {
      if (event.error === "canceled" || event.error === "interrupted") return;
      stopReading();
      toast.error("The chapter could not be read aloud.");
    };
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const toggleReading = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  if (q.isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (q.error || !q.data)
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
        Unable to load this chapter. Select it again or refresh to retry.
      </div>
    );

  return (
    <div
      className={`${focusMode ? "fixed inset-0 z-50 bg-background p-6 sm:p-12" : "rounded-xl border border-border/60 bg-card/40 p-5"} flex flex-col`}
    >
      <div className="flex items-center justify-between gap-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="font-serif text-xl border-0 shadow-none px-0 focus-visible:ring-0 bg-transparent"
        />
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-xs text-muted-foreground flex items-center gap-1"
            aria-live="polite"
            aria-atomic="true"
          >
            {state === "saving" ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Saving
              </>
            ) : state === "saved" ? (
              <>
                <Check className="h-3 w-3 text-primary" /> Saved
              </>
            ) : state === "saved_without_revision" ? (
              <>
                <ShieldAlert className="h-3 w-3 text-amber-600" /> Saved without checkpoint
              </>
            ) : (
              "Idle"
            )}
          </span>
          <ContinuityScanButton
            projectId={projectId}
            documentId={docId}
            getContent={() => content}
            size="sm"
            variant="outline"
            label="Run continuity scan"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFocusMode((value) => !value)}
            aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
          >
            {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {!isReading ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={startReading}
              title="Read this chapter aloud"
            >
              <Volume2 className="h-3.5 w-3.5" /> Read aloud
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={toggleReading}
                title={isPaused ? "Resume reading" : "Pause reading"}
              >
                {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                {isPaused ? "Resume" : "Pause"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={stopReading}
                title="Stop reading"
                aria-label="Stop reading"
              >
                <Square className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> AI assist
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>In-scene assists</DropdownMenuLabel>
              <DropdownMenuItem disabled>Rewrite for tone (not available)</DropdownMenuItem>
              <DropdownMenuItem disabled>Tighten prose (not available)</DropdownMenuItem>
              <DropdownMenuItem disabled>Continue scene (not available)</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>Use “Run continuity scan” above</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">{words.toLocaleString()} words</div>
      <div
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Chapter editor"
        aria-multiline="true"
        onInput={(event) => setContent(event.currentTarget.textContent ?? "")}
        className="mt-4 min-h-[60vh] flex-1 whitespace-pre-wrap bg-transparent px-1 py-3 text-base leading-8 font-serif outline-none"
        data-placeholder="Begin your scene…"
      >
        {content}
      </div>
    </div>
  );
}
