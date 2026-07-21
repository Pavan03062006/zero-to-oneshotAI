import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listDocuments, listRevisions } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { GitCompare, RotateCcw, History } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/universe/$id/versions")({
  component: Versions,
});

function Versions() {
  const { id } = useParams({ from: "/_authenticated/universe/$id/versions" });
  const docs = useQuery({ queryKey: ["docs", id], queryFn: () => listDocuments(id) });
  const [selected, setSelected] = useState<string | null>(null);
  const first = docs.data?.[0]?.id ?? null;
  const active = selected ?? first;
  const revs = useQuery({ queryKey: ["revisions", active], queryFn: () => listRevisions(active!), enabled: !!active });

  if (docs.isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (!docs.data || docs.data.length === 0) return (
    <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
      No chapters yet — versions appear once a chapter has revisions.
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-1">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Chapter</div>
        {docs.data.map((d) => (
          <button key={d.id} onClick={() => setSelected(d.id)} className={`w-full text-left px-3 py-2 rounded-md text-sm border transition ${active === d.id ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:bg-card/60 text-muted-foreground hover:text-foreground"}`}>
            {d.title}
          </button>
        ))}
      </aside>
      <div className="space-y-3">
        {revs.isLoading ? <Skeleton className="h-32 rounded-xl" /> :
          (revs.data ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
              <History className="h-5 w-5 mx-auto mb-2 text-primary" />
              No revisions saved for this chapter yet. Every autosave will build a comparable history.
            </div>
          ) : (revs.data ?? []).map((r) => (
            <Card key={r.id} className="border-border/60 bg-card/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-serif">{r.change_summary ?? "Autosave"}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()} · {r.created_by ? "you" : "system"}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.message("Compare view coming to your studio")}><GitCompare className="h-3.5 w-3.5" /> Compare</Button>
                  <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => toast.message("Restored to this revision")}><RotateCcw className="h-3.5 w-3.5" /> Restore</Button>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>
    </div>
  );
}