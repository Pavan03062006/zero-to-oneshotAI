import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Sparkles, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/new-universe")({
  component: NewUniverse,
});

const STEPS = ["Spark", "Signature", "Craft", "Review"] as const;

function NewUniverse() {
  const [step, setStep] = useState(0);
  const [premise, setPremise] = useState("");
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("Literary sci-fi");
  const [tone, setTone] = useState("Melancholic");
  const [pov, setPov] = useState("Third limited");
  const [ambition, setAmbition] = useState<number[]>([65]);
  const [logline, setLogline] = useState("");
  const qc = useQueryClient();
  const nav = useNavigate();

  const mut = useMutation({
    mutationFn: () =>
      createProject({
        title: title || "Untitled universe",
        genre,
        premise: premise || logline || null,
      }),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Universe seeded");
      nav({ to: "/universe/$id", params: { id: p.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">New universe</div>
        <h1 className="font-serif text-3xl md:text-4xl mt-2 tracking-tight">Seed your Story DNA</h1>
        <div className="mt-6 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-7 w-7 rounded-full grid place-items-center text-xs border ${i <= step ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-xs ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>
      </div>

      <Card className="border-border/60 bg-card/60 shadow-elegant">
        <CardContent className="p-6 md:p-8 space-y-6">
          {step === 0 && (
            <div className="space-y-3">
              <Label>What's the spark?</Label>
              <Textarea rows={7} placeholder="A lighthouse keeper on a dying moon receives a message from herself, twenty years late…" value={premise} onChange={(e) => setPremise(e.target.value)} />
              <p className="text-xs text-muted-foreground">One paragraph is enough. The studio will extract characters, world rules, and threads into Story DNA.</p>
            </div>
          )}
          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Working title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Last Lantern" />
              </div>
              <div className="space-y-2">
                <Label>Genre</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Literary sci-fi","Epic fantasy","Noir","Cozy mystery","Horror","Historical","Contemporary","Cyberpunk"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Melancholic","Hopeful","Wry","Menacing","Elegiac","Whimsical","Tense"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Logline (optional)</Label>
                <Input value={logline} onChange={(e) => setLogline(e.target.value)} placeholder="One sentence that captures the promise of the story." />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Point of view</Label>
                <Select value={pov} onValueChange={setPov}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["First person","Third limited","Third omniscient","Braided POVs","Epistolary"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Canon strictness — {ambition[0]}%</Label>
                <Slider value={ambition} onValueChange={setAmbition} min={0} max={100} step={5} />
                <p className="text-xs text-muted-foreground">Higher strictness means the continuity engine flags smaller drifts.</p>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <ReviewRow label="Title" value={title || "Untitled universe"} />
              <ReviewRow label="Genre / Tone" value={`${genre} · ${tone}`} />
              <ReviewRow label="POV" value={pov} />
              <ReviewRow label="Canon strictness" value={`${ambition[0]}%`} />
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Premise</div>
                <p className="text-sm text-foreground/90">{premise || "No premise yet."}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => {
                if (step === 0 && !premise.trim()) {
                  toast.error("Add a short story spark before continuing.");
                  return;
                }
                setStep((s) => s + 1);
              }}>
                Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button disabled={mut.isPending} onClick={() => mut.mutate()} className="gap-2 shadow-glow">
                <Sparkles className="h-4 w-4" /> {mut.isPending ? "Seeding…" : "Seed universe"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
