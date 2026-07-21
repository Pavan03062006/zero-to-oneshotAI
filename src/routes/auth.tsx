import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"in" | "up">("in");

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard", replace: true });
  }, [user, loading, nav]);

  return (
    <div className="min-h-screen bg-[color:var(--pumice)] px-4 py-8 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1280px] gap-6 lg:grid-cols-2">
        {/* Halftone panel */}
        <div className="halftone-hero relative hidden overflow-hidden rounded-[40px] p-10 lg:flex lg:flex-col lg:justify-between">
          <Link to="/" className="flex items-center gap-2 text-[color:var(--chalk)]">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--obsidian)] text-[color:var(--ember)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-serif text-[20px] tracking-[0.04em]">ONESHOT</span>
          </Link>
          <div>
            <div className="font-serif text-[color:var(--chalk)] text-[clamp(56px,7vw,96px)] leading-[0.94] tracking-[0.02em]">
              ENTER THE
              <br />
              WRITERS'
              <br />
              ROOM
            </div>
            <p className="mt-6 max-w-sm text-[color:var(--chalk)]/85 text-[16px] leading-[1.55]">
              Living Story DNA. Continuity guardrails. One workspace for every universe you'll ever
              build.
            </p>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center rounded-[40px] bg-[color:var(--limestone)] p-8 lg:p-14">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--obsidian)] text-[color:var(--ember)]">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="font-serif text-[20px] tracking-[0.04em]">ONESHOT</span>
            </Link>
            <h2 className="font-serif text-[clamp(40px,7vw,64px)] leading-[0.94] tracking-[0.02em]">
              {tab === "in" ? "Welcome back." : "Start a universe."}
            </h2>
            <p className="mt-3 text-[16px] text-[color:var(--obsidian)]/70">
              {tab === "in"
                ? "Sign in to your writers' room."
                : "Create your account. Confirm via email."}
            </p>

            <div className="mt-8 inline-flex rounded-full bg-[color:var(--pumice)] p-1">
              {(["in", "up"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setTab(v)}
                  className={
                    "rounded-full px-5 py-2 text-[14px] font-medium transition " +
                    (tab === v
                      ? "bg-[color:var(--obsidian)] text-[color:var(--chalk)]"
                      : "text-[color:var(--obsidian)]")
                  }
                >
                  {v === "in" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <div className="mt-6">{tab === "in" ? <SignInForm /> : <SignUpForm />}</div>

            <p className="mt-8 text-[12px] text-[color:var(--obsidian)]/60">
              By continuing you agree to keep canon consistent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const pillInput =
  "w-full rounded-full border-[1.5px] border-[color:var(--obsidian)]/20 bg-[color:var(--chalk)] px-6 py-3 text-[16px] font-medium text-[color:var(--obsidian)] placeholder:text-[color:var(--obsidian)]/40 focus:border-[color:var(--ember)] focus:outline-none";
const pillLabel =
  "block mb-2 text-[12px] font-medium uppercase tracking-wide text-[color:var(--obsidian)]/60";
const pillSubmit =
  "w-full rounded-full bg-[color:var(--ember)] px-6 py-3 text-[16px] font-medium text-[color:var(--obsidian)] hover:brightness-95 disabled:opacity-60";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (error) toast.error(error.message);
          else toast.success("Welcome back");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Unable to sign in. Try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <label className={pillLabel} htmlFor="e">
          Email
        </label>
        <input
          id="e"
          className={pillInput}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className={pillLabel} htmlFor="p">
          Password
        </label>
        <input
          id="p"
          className={pillInput}
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit" className={pillSubmit} disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function SignUpForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <div className="space-y-2 rounded-[24px] bg-[color:var(--sulfur)] p-6 text-[14px] text-[color:var(--obsidian)]">
        <p className="font-serif text-[24px] tracking-[0.02em]">Check your inbox.</p>
        <p>
          We sent a confirmation link to <strong>{email}</strong>. Confirm to unlock your creator
          dashboard.
        </p>
      </div>
    );
  }
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const { error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo: window.location.origin,
              data: { display_name: displayName.trim() },
            },
          });
          if (error) toast.error(error.message);
          else {
            setSent(true);
            toast.success("Confirmation sent");
          }
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Unable to create your account. Try again.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <label className={pillLabel} htmlFor="dn">
          Display name
        </label>
        <input
          id="dn"
          className={pillInput}
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Ada Wren"
        />
      </div>
      <div>
        <label className={pillLabel} htmlFor="ue">
          Email
        </label>
        <input
          id="ue"
          className={pillInput}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className={pillLabel} htmlFor="up">
          Password
        </label>
        <input
          id="up"
          className={pillInput}
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit" className={pillSubmit} disabled={busy}>
        {busy ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
