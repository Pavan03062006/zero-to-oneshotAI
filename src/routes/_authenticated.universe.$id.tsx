import { createFileRoute, Link, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getProject } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutGrid, Dna, Users, Globe2, Clock, BookOpen, ShieldAlert, History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/universe/$id")({
  component: UniverseShell,
});

const TABS: { to: any; label: string; icon: any; exact?: boolean }[] = [
  { to: "/universe/$id", label: "Overview", icon: LayoutGrid, exact: true },
  { to: "/universe/$id/dna", label: "Story DNA", icon: Dna },
  { to: "/universe/$id/characters", label: "Characters", icon: Users },
  { to: "/universe/$id/world", label: "World", icon: Globe2 },
  { to: "/universe/$id/timeline", label: "Timeline", icon: Clock },
  { to: "/universe/$id/chapters", label: "Chapters", icon: BookOpen },
  { to: "/universe/$id/continuity", label: "Continuity", icon: ShieldAlert },
  { to: "/universe/$id/versions", label: "Versions", icon: History },
];

function UniverseShell() {
  const { id } = useParams({ from: "/_authenticated/universe/$id" });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: p, isLoading } = useQuery({ queryKey: ["project", id], queryFn: () => getProject(id) });

  return (
    <div className="border-b border-border/60 bg-plum">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-0">
        {isLoading ? (
          <Skeleton className="h-10 w-64" />
        ) : p ? (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Universe</div>
              <h1 className="font-serif text-3xl md:text-4xl tracking-tight mt-1">{p.title}</h1>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                {p.genre && <Badge variant="secondary">{p.genre}</Badge>}
                {p.status && <Badge variant="outline">{p.status}</Badge>}
              </div>
            </div>
            <div className="text-xs text-muted-foreground max-w-md line-clamp-2">{p.premise}</div>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">Universe not found.</div>
        )}

        <nav className="mt-8 flex gap-1 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          {TABS.map((t) => {
            const active = t.exact
              ? pathname === `/universe/${id}`
              : pathname.startsWith(`/universe/${id}${t.to.replace("/universe/$id", "")}`);
            const I = t.icon;
            return (
              <Link
                key={t.label}
                {...({ to: t.to, params: { id } } as any)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm border-b-2 transition ${
                  active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <I className="h-3.5 w-3.5" /> {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}