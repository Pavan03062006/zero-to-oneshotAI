import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listEntities,
  listDocuments,
  listEvents,
  listRelationships,
  listIssues,
} from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Clock3, Link2, Search, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/universe/$id/memory")({
  component: StoryMemory,
});

const prompts = [
  "Why does this relationship exist?",
  "Where was this rule introduced?",
  "What remains unresolved?",
  "Which chapters involve this character?",
];

function StoryMemory() {
  const { id } = useParams({ from: "/_authenticated/universe/$id/memory" });
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string[]>(() =>
    typeof window === "undefined"
      ? []
      : JSON.parse(localStorage.getItem(`oneshot-memory-${id}`) ?? "[]"),
  );
  const entities = useQuery({ queryKey: ["entities", id], queryFn: () => listEntities(id) });
  const docs = useQuery({ queryKey: ["docs", id], queryFn: () => listDocuments(id) });
  const events = useQuery({ queryKey: ["events", id], queryFn: () => listEvents(id) });
  const relationships = useQuery({
    queryKey: ["relationships", id],
    queryFn: () => listRelationships(id),
  });
  const issues = useQuery({ queryKey: ["issues", id], queryFn: () => listIssues(id) });
  const allText = useMemo(
    () => [
      ...(entities.data ?? []).map((item) => `${item.name} ${item.summary ?? ""}`),
      ...(docs.data ?? []).map((item) => `${item.title} ${item.content ?? ""}`),
      ...(events.data ?? []).map((item) => `${item.title} ${item.description ?? ""}`),
    ],
    [docs.data, entities.data, events.data],
  );
  const answer = useMemo(
    () =>
      question.trim()
        ? buildAnswer(
            question,
            allText,
            entities.data ?? [],
            docs.data ?? [],
            events.data ?? [],
            relationships.data ?? [],
            issues.data ?? [],
          )
        : null,
    [allText, docs.data, entities.data, events.data, issues.data, question, relationships.data],
  );

  const ask = (value = question) => {
    const clean = value.trim();
    if (!clean) return;
    const next = [clean, ...asked.filter((item) => item !== clean)].slice(0, 8);
    setAsked(next);
    if (typeof window !== "undefined")
      localStorage.setItem(`oneshot-memory-${id}`, JSON.stringify(next));
    setQuestion(clean);
  };
  const loading = entities.isLoading || docs.isLoading || events.isLoading;
  if (loading)
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <Brain className="h-4 w-4 text-primary" /> Story memory
        </div>
        <h1 className="mt-2 font-serif text-4xl">Story Memory</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Ask what your story already knows. Answers use approved story records, saved chapters,
          events, and continuity context.
        </p>
      </header>
      <Card className="border-border/60 bg-card/60">
        <CardContent className="p-5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && ask()}
                placeholder="Why does this relationship exist?"
                className="pl-9"
                aria-label="Ask your story"
              />
            </div>
            <Button onClick={() => ask()} className="gap-2">
              <Sparkles className="h-4 w-4" /> Ask
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <Button key={prompt} variant="outline" size="sm" onClick={() => setQuestion(prompt)}>
                {prompt}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      {answer && <Answer answer={answer} />}
      {!answer && asked.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-serif text-xl">
            <Clock3 className="h-4 w-4 text-primary" /> Recent questions
          </h2>
          <div className="flex flex-wrap gap-2">
            {asked.map((item) => (
              <Button key={item} variant="ghost" size="sm" onClick={() => setQuestion(item)}>
                {item}
              </Button>
            ))}
          </div>
        </section>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/60 bg-card/50">
          <CardContent className="p-5">
            <h2 className="font-serif text-xl">Important story facts</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {entities.data?.length ?? 0} approved story records and {events.data?.length ?? 0}{" "}
              recorded events are available as memory.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/50">
          <CardContent className="p-5">
            <h2 className="font-serif text-xl">How memory works</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Story Memory uses approved Foundation and Story Bible information, saved chapters,
              continuity records, and narrative insights. It cannot answer questions unsupported by
              those sources.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type Evidence = { label: string; text: string };
function buildAnswer(
  question: string,
  text: string[],
  entities: any[],
  docs: any[],
  events: any[],
  relationships: any[],
  issues: any[],
) {
  const terms = question
    .toLowerCase()
    .split(/\W+/)
    .filter((term) => term.length > 3);
  const matches = text
    .filter((item) => terms.some((term) => item.toLowerCase().includes(term)))
    .slice(0, 4);
  const evidence: Evidence[] = matches.map((item, index) => ({
    label: index < entities.length ? "Story Bible" : "Saved story record",
    text: item.slice(0, 220),
  }));
  const related = entities
    .filter((item) =>
      terms.some((term) => `${item.name} ${item.summary ?? ""}`.toLowerCase().includes(term)),
    )
    .slice(0, 6);
  return {
    supported: matches.length > 0,
    summary: matches.length
      ? "Based on the approved story information currently available, these records are connected to your question."
      : "The current Story Bible does not contain enough supported information to answer this yet.",
    evidence,
    related,
    chapters: docs
      .filter((doc) =>
        terms.some((term) => `${doc.title} ${doc.content ?? ""}`.toLowerCase().includes(term)),
      )
      .slice(0, 4),
    events,
    relationships,
    issues,
  };
}
function Answer({ answer }: { answer: ReturnType<typeof buildAnswer> }) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="space-y-5 p-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Short answer</div>
          <p className="mt-2 font-serif text-xl">{answer.summary}</p>
        </div>
        {answer.evidence.length > 0 ? (
          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
              Evidence
            </div>
            <div className="space-y-2">
              {answer.evidence.map((item) => (
                <div
                  key={item.text}
                  className="rounded-xl border border-border/60 bg-background/50 p-3 text-sm"
                >
                  <div className="mb-1 text-xs text-primary">{item.label}</div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
            No supported evidence found. Nothing was changed.
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link2 className="h-3.5 w-3.5" /> Confidence is limited by the available approved records;
          this is not a complete reading of the manuscript.
        </div>
      </CardContent>
    </Card>
  );
}
