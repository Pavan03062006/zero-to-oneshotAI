import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LogOut,
  LayoutDashboard,
  Plus,
  Loader2,
  BookOpen,
  PenLine,
  ShieldCheck,
  Map,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const universeId = pathname.match(/\/universe\/([^/]+)/)?.[1];
  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Writer";
  const initials = displayName.slice(0, 2).toUpperCase();
  return (
    <div className="min-h-screen bg-[color:var(--pumice)] text-[color:var(--obsidian)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[color:var(--obsidian)] focus:px-4 focus:py-2 focus:text-[color:var(--chalk)]"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border/40 bg-[color:var(--pumice)]/90 backdrop-blur">
        <div className="mx-auto max-w-[1280px] px-4 pt-4 sm:px-6">
          <div className="flex items-center justify-between rounded-2xl bg-[color:var(--limestone)] px-4 py-2 sm:px-6">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src="/logo.png" alt="ONESHOT" className="h-8 w-8 shrink-0" />
              <span className="font-serif text-[20px] tracking-[0.04em]">ONESHOT</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
              <NavLink to="/dashboard" icon={LayoutDashboard}>
                Home
              </NavLink>
              {universeId && <WorkspaceLinks id={universeId} />}
            </nav>
            <div className="flex items-center gap-2">
              <Link
                to="/new-universe"
                className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--ember)] px-4 py-2 text-[14px] font-medium text-[color:var(--obsidian)] hover:brightness-95"
              >
                <Plus className="h-4 w-4" /> New story
              </Link>
              <button
                className="inline-flex rounded-full p-2 md:hidden"
                aria-label="Toggle navigation"
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-[color:var(--obsidian)] text-[color:var(--chalk)] text-[12px] font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-medium">{displayName}</div>
                    <div className="text-xs text-muted-foreground font-normal">{user?.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      if (signingOut) return;
                      setSigningOut(true);
                      try {
                        await signOut();
                        nav({ to: "/", replace: true });
                      } catch (error) {
                        setSigningOut(false);
                        toast.error(
                          error instanceof Error ? error.message : "Could not sign out. Try again.",
                        );
                      }
                    }}
                    disabled={signingOut}
                  >
                    {signingOut ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}{" "}
                    {signingOut ? "Signing out…" : "Sign out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {mobileOpen && (
            <nav className="grid gap-1 py-3 md:hidden" aria-label="Mobile navigation">
              <NavLink to="/dashboard" icon={LayoutDashboard}>
                Home
              </NavLink>
              {universeId && <WorkspaceLinks id={universeId} />}
            </nav>
          )}
        </div>
      </header>
      <main id="main-content" className="pt-6">
        {children}
      </main>
    </div>
  );
}

function NavLink({ children, icon: Icon, ...props }: any) {
  return (
    <Link
      {...props}
      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-[color:var(--pumice)] hover:text-foreground [&.active]:bg-[color:var(--pumice)] [&.active]:text-foreground"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}

function WorkspaceLinks({ id }: { id: string }) {
  return (
    <>
      <NavLink to="/universe/$id" params={{ id }} icon={BookOpen}>
        Story Bible
      </NavLink>
      <NavLink to="/universe/$id/chapters" params={{ id }} icon={PenLine}>
        Write
      </NavLink>
      <NavLink to="/universe/$id/continuity" params={{ id }} icon={ShieldCheck}>
        Continuity
      </NavLink>
      <NavLink to="/universe/$id/timeline" params={{ id }} icon={Map}>
        Plan
      </NavLink>
    </>
  );
}
