import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, LayoutDashboard, Plus } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Writer";
  const initials = displayName.slice(0, 2).toUpperCase();
  return (
    <div className="min-h-screen bg-[color:var(--pumice)] text-[color:var(--obsidian)]">
      <header className="sticky top-0 z-40 bg-[color:var(--pumice)]/90 backdrop-blur">
        <div className="mx-auto max-w-[1280px] px-4 pt-4 sm:px-6">
          <div className="flex items-center justify-between rounded-full bg-[color:var(--limestone)] px-4 py-2 sm:px-6">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src="/logo.png" alt="ONESHOT" className="h-8 w-8 shrink-0" />
              <span className="font-serif text-[20px] tracking-[0.04em]">ONESHOT</span>
            </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="hidden items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-medium hover:bg-[color:var(--pumice)] sm:inline-flex"
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link
              to="/new-universe"
              className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--ember)] px-4 py-2 text-[14px] font-medium text-[color:var(--obsidian)] hover:brightness-95"
            >
              <Plus className="h-4 w-4" /> New universe
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-[color:var(--obsidian)] text-[color:var(--chalk)] text-[12px] font-medium">{initials}</AvatarFallback>
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
                    await signOut();
                    nav({ to: "/", replace: true });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          </div>
        </div>
      </header>
      <main className="pt-6">{children}</main>
    </div>
  );
}