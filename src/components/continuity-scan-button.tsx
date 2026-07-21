import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ScanSearch } from "lucide-react";
import {
  analyzeContinuity,
  STATUS_COPY,
  StoryEngineError,
  type AnalyzeContinuityResult,
} from "@/lib/story-engine";

export function ContinuityScanButton({
  projectId,
  documentId,
  getContent,
  variant = "default",
  size = "sm",
  onComplete,
  label = "Run continuity scan",
}: {
  projectId: string;
  documentId: string | null;
  getContent: () => string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  onComplete?: (r: AnalyzeContinuityResult) => void;
  label?: string;
}) {
  const qc = useQueryClient();
  const [statusIdx, setStatusIdx] = useState(0);

  const mut = useMutation({
    mutationFn: () => {
      if (!documentId)
        throw new StoryEngineError("Select a chapter first", {
          friendly: "Select a chapter to scan.",
        });
      return analyzeContinuity({ projectId, documentId, content: getContent() });
    },
    onSuccess: (data) => {
      const n = data.issues?.length ?? 0;
      if (n === 0)
        toast.success(
          `Canon intact — no issues found${typeof data.score === "number" ? ` (score ${data.score}/100)` : ""}`,
        );
      else toast.message(`Continuity scan complete — ${n} issue${n === 1 ? "" : "s"} logged`);
      qc.invalidateQueries({ queryKey: ["issues", projectId] });
      onComplete?.(data);
    },
    onError: (e: StoryEngineError | Error) => {
      toast.error(e instanceof StoryEngineError ? e.friendly : e.message);
    },
  });

  useEffect(() => {
    if (!mut.isPending) return;
    setStatusIdx(0);
    const id = setInterval(
      () => setStatusIdx((i) => (i + 1) % STATUS_COPY.continuity.length),
      1800,
    );
    return () => clearInterval(id);
  }, [mut.isPending]);

  return (
    <div className="inline-flex items-center gap-3">
      <Button
        size={size}
        variant={variant}
        onClick={() => mut.mutate()}
        disabled={mut.isPending || !documentId}
        className="gap-2 uppercase tracking-wider"
      >
        {mut.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Scanning
          </>
        ) : (
          <>
            <ScanSearch className="h-4 w-4" /> {label}
          </>
        )}
      </Button>
      {mut.isPending && (
        <span
          className="text-xs text-muted-foreground motion-safe:animate-pulse"
          aria-live="polite"
        >
          {STATUS_COPY.continuity[statusIdx]}
        </span>
      )}
    </div>
  );
}

export function ContinuityScanSuccess({ score, summary }: { score?: number; summary?: string }) {
  return (
    <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 text-center">
      <ShieldCheck className="h-6 w-6 mx-auto text-primary" />
      <div className="text-lg font-medium mt-2">Canon holds</div>
      {typeof score === "number" && (
        <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
          Continuity score {score}/100
        </div>
      )}
      {summary && <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{summary}</p>}
    </div>
  );
}
