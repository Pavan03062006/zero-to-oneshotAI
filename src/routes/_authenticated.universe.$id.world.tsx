import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listEntities } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CanonPill } from "./_authenticated.universe.$id.dna";
import { Globe2, Users2, Package, ScrollText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/universe/$id/world")({
  component: World,
});

const GROUPS = [
  { key: "location", label: "Locations", icon: Globe2 },
  { key: "organization", label: "Organizations", icon: Users2 },
  { key: "object", label: "Objects", icon: Package },
  { key: "world_rule", label: "World rules", icon: ScrollText },
] as const;

function World() {
  const { id } = useParams({ from: "/_authenticated/universe/$id/world" });
  const q = useQuery({ queryKey: ["entities", id], queryFn: () => listEntities(id) });
  const [search, setSearch] = useState("");
  if (q.isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (q.error)
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
        Unable to load the world data. Refresh to retry.
      </div>
    );
  const entities = q.data ?? [];
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">World</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The places, systems, and forces behind your story.
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search the world…"
            className="pl-9"
            aria-label="Search world"
          />
        </div>
      </div>
      {GROUPS.map(({ key, label, icon: I }) => {
        const rows = entities.filter(
          (e) =>
            e.entity_type === key &&
            `${e.name} ${e.summary ?? ""}`.toLowerCase().includes(search.toLowerCase()),
        );
        return (
          <section key={key}>
            <div className="flex items-center gap-2 mb-3">
              <I className="h-4 w-4 text-primary" />
              <h2 className="font-serif text-xl tracking-tight">{label}</h2>
              <span className="text-xs text-muted-foreground">· {rows.length}</span>
            </div>
            {rows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-xs text-muted-foreground">
                No {label.toLowerCase()} in canon yet.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {rows.map((e) => (
                  <Card key={e.id} className="border-border/60 bg-card/60">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-serif">{e.name}</div>
                        <CanonPill status={e.canon_status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                        {e.summary ?? "No summary."}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
