import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: Guard,
});

function Guard() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth", replace: true });
  }, [user, loading, nav]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-hero flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Sparkles className="h-4 w-4 animate-pulse text-primary" />
          Tuning the writers' room…
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}