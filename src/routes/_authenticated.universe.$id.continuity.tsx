import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { listIssues, updateIssue, listDocuments } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, X, Check, ChevronDown, Quote } from "lucide-react";
import type { ConsistencyIssue, IssueSeverity, IssueStatus } from "@/lib/types";
import { ContinuityScanButton, ContinuityScanSuccess } from "@/components/continuity-scan-button";
import type { AnalyzeContinuityResult } from "@/lib/story-engine";

export const Route = createFileRoute("/_authenticated/universe/$id/continuity")({
  component: Continuity,
});

const SEVERITIES = ["all", "info", "warning", "critical"] as const;
const STATUSES = ["open", "accepted", "resolved", "dismissed", "all"] as const;

function Continuity() {
  const { id } = useParams({ from: "/_authenticated/universe/$id/continuity" });
  const [sev, setSev] = useState<(typeof SEVERITIES)[number]>("all");
  const [st, setSt] = useState<(typeof STATUSES)[number]>("open");
  const [docId, setDocId] = useState<string>("");
  const [lastScan, setLastScan] = useState<AnalyzeContinuityResult | null>(null);
  const qc = useQueryClient();

  const docs = useQuery({ queryKey: ["docs", id], queryFn: () => listDocuments(id) });
  const q = useQuery({ queryKey: ["issues", id], queryFn: () => listIssues(id) });
  const mut = useMutation({
    mutationFn: (v: { id: string; patch: Partial<ConsistencyIssue> }) => updateIssue(v.id, v.patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["issues", id] }); toast.success("Continuity updated"); },
  });

  const filtered = useMemo(
    () => (q.data ?? []).filter((i) => (sev === "all" || i.severity === sev) && (st === "all" || i.status === st)),
    [q.data, sev, st],
  );

  const selectedDoc = docs.data?.find((d) => d.id === docId) ?? null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border/60 bg-card/60 p-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Continuity engine</div>
          <div className="text-lg font-medium mt-1">Scan a chapter against your canon</div>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg">Pick a chapter — the engine reads its saved text against every proposed and approved canon fact, then logs evidence-backed issues here.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={docId} onValueChange={setDocId}>
            <SelectTrigger className="min-w-[220px]"><SelectValue placeholder={docs.isLoading ? "Loading chapters…" : "Select a chapter"} /></SelectTrigger>
            <SelectContent>
              {(docs.data ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <ContinuityScanButton
            projectId={id}
            documentId={docId || null}
            getContent={() => selectedDoc?.content ?? ""}
            size="default"
            label="Run continuity scan"
            onComplete={(r) => setLastScan(r)}
          />
        </div>
      </div>

      {lastScan && (lastScan.issues?.length ?? 0) === 0 && (
        <ContinuityScanSuccess score={lastScan.score} summary={lastScan.summary} />
      )}
      {lastScan && (lastScan.issues?.length ?? 0) > 0 && (
        <div className="rounded-3xl border border-border/60 bg-card/60 p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm"><span className="uppercase tracking-wider text-xs text-muted-foreground mr-2">Continuity score</span><span className="font-medium">{lastScan.score}/100</span></div>
          {lastScan.summary && <div className="text-xs text-muted-foreground max-w-md truncate">{lastScan.summary}</div>}
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {SEVERITIES.map((s) => (
            <Chip key={s} active={sev === s} onClick={() => setSev(s)}>{s}</Chip>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map((s) => (
            <Chip key={s} active={st === s} onClick={() => setSt(s)}>{s}</Chip>
          ))}
        </div>
      </div>

      {q.isLoading || docs.isLoading ? <Skeleton className="h-96 rounded-3xl" /> : q.error || docs.error ? <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm">Unable to load continuity data. Refresh to retry.</div> : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 p-10 text-center">
          <ShieldCheck className="h-6 w-6 mx-auto text-primary" />
          <div className="text-lg font-medium mt-2">No continuity issues here</div>
          <div className="text-sm text-muted-foreground">Run a scan on a chapter to surface evidence-backed conflicts.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((i) => (
            <IssueCard
              key={i.id}
              issue={i}
              onResolve={() => mut.mutate({ id: i.id, patch: { status: "resolved" } })}
              onDismiss={() => mut.mutate({ id: i.id, patch: { status: "dismissed" } })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function severityIconClass(s: IssueSeverity) {
  if (s === "critical") return "text-destructive";
  if (s === "warning") return "text-primary";
  return "text-muted-foreground";
}

function severityBadgeVariant(s: IssueSeverity): "destructive" | "default" | "outline" {
  if (s === "critical") return "destructive";
  if (s === "warning") return "default";
  return "outline";
}

function IssueCard({ issue, onResolve, onDismiss }: { issue: ConsistencyIssue; onResolve: () => void; onDismiss: () => void }) {
  const [open, setOpen] = useState(false);
  const evidence = issue.evidence ?? [];
  const sev = issue.severity as IssueSeverity;
  const canAct = issue.status === "open" || issue.status === "accepted";
  return (
    <Card className="border-border/60 bg-card/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <ShieldAlert className={`h-4 w-4 ${severityIconClass(sev)}`} />
              <div className="text-lg font-medium">{issue.title}</div>
              <Badge variant={severityBadgeVariant(sev)} className="text-[10px] uppercase">{issue.severity}</Badge>
              {issue.issue_type && <Badge variant="secondary" className="text-[10px] uppercase">{issue.issue_type.replace(/_/g, " ")}</Badge>}
              <Badge variant="outline" className="text-[10px] uppercase">{issue.status}</Badge>
            </div>
            {issue.explanation && <p className="text-sm text-muted-foreground mt-2">{issue.explanation}</p>}
            {issue.suggested_fix && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 mt-3 text-sm">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Suggested fix</div>
                <div className="mt-1">{issue.suggested_fix}</div>
              </div>
            )}
            {evidence.length > 0 && (
              <Collapsible open={open} onOpenChange={setOpen} className="mt-3">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 uppercase tracking-wider text-xs">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                    {evidence.length} evidence row{evidence.length === 1 ? "" : "s"}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {evidence.map((ev, idx) => (
                    <div key={idx} className="rounded-2xl border border-border/60 bg-background/60 p-3 text-xs space-y-2">
                      {ev.source && <div><span className="uppercase tracking-wider text-[10px] text-muted-foreground">Source</span><div className="text-foreground/90 mt-0.5">{ev.source}</div></div>}
                      {ev.quote && <div className="flex gap-2"><Quote className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" /><div className="italic text-foreground/90">{ev.quote}</div></div>}
                      {ev.reason && <div><span className="uppercase tracking-wider text-[10px] text-muted-foreground">Reason</span><div className="text-foreground/90 mt-0.5">{ev.reason}</div></div>}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
          {canAct && (
            <div className="flex flex-col gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={onResolve} className="gap-1.5"><Check className="h-3.5 w-3.5" /> Resolve</Button>
              <Button size="sm" variant="ghost" onClick={onDismiss} className="gap-1.5"><X className="h-3.5 w-3.5" /> Dismiss</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className={`px-3 py-1 rounded-full text-xs border transition capitalize ${active ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>{children}</button>
  );
}

// Silence unused import warning if any tree-shaking mistakes reappear
export type _StatusHint = IssueStatus;
