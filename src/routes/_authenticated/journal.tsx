import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { analyzeJournal } from "@/lib/ai.functions";
import { toast } from "sonner";
import { Loader2, Sparkles, BookHeart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({ meta: [{ title: "Journal — MindMood" }] }),
  component: JournalPage,
});

function JournalPage() {
  const qc = useQueryClient();
  const analyzeFn = useServerFn(analyzeJournal);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("reflection");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [search, setSearch] = useState("");

  const { data: entries } = useQuery({
    queryKey: ["journal"],
    queryFn: async () =>
      (await supabase.from("journal_entries").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const filtered = (entries ?? []).filter((e) =>
    !search ||
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.content.toLowerCase().includes(search.toLowerCase()),
  );

  const save = async (withAI: boolean) => {
    if (!title.trim() || !content.trim()) return toast.error("Add a title and content");
    setSaving(true);
    try {
      let ai: { sentiment: string; keywords: string[]; summary: string } | null = null;
      if (withAI) {
        setAnalyzing(true);
        ai = await analyzeFn({ data: { content } });
        setAnalyzing(false);
      }
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { error } = await supabase.from("journal_entries").insert({
        user_id: u.user.id,
        title, content, category,
        sentiment: ai?.sentiment ?? null,
        keywords: ai?.keywords ?? null,
        summary: ai?.summary ?? null,
      });
      if (error) throw error;
      toast.success(withAI ? "Saved & analyzed" : "Saved");
      setTitle(""); setContent("");
      qc.invalidateQueries({ queryKey: ["journal"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false); setAnalyzing(false);
    }
  };

  return (
    <AppShell title="Journal">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookHeart className="size-5 text-primary" />
            <h2 className="font-display font-semibold">New entry</h2>
          </div>
          <input
            placeholder="Title"
            value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-input/30 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm mb-3"
          />
          <select
            value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-input/30 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm mb-3"
          >
            <option value="reflection">Reflection</option>
            <option value="gratitude">Gratitude</option>
            <option value="dream">Dream</option>
            <option value="goal">Goal</option>
            <option value="vent">Vent</option>
          </select>
          <textarea
            placeholder="Let it out…"
            value={content} onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 rounded-xl bg-input/30 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none leading-relaxed"
          />
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => save(false)} disabled={saving}
              className="flex-1 py-3 rounded-xl glass font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {saving && !analyzing && <Loader2 className="size-4 animate-spin" />} Save
            </button>
            <button
              onClick={() => save(true)} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {analyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Save + analyze
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <input
            placeholder="Search entries…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-input/30 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          {filtered.length ? filtered.map((e) => (
            <div key={e.id} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-sm truncate">{e.title}</h3>
                {e.sentiment && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
                    e.sentiment === "positive" ? "bg-accent/30 text-accent-foreground"
                    : e.sentiment === "negative" ? "bg-destructive/20 text-destructive"
                    : "bg-muted text-muted-foreground"
                  }`}>{e.sentiment}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 mt-1">{e.content}</p>
              {e.summary && (
                <p className="text-xs italic text-muted-foreground mt-2 border-l-2 border-primary/40 pl-2">
                  {e.summary}
                </p>
              )}
              {e.keywords && e.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {e.keywords.map((k: string) => (
                    <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{k}</span>
                  ))}
                </div>
              )}
              <div className="text-[10px] text-muted-foreground mt-2">
                {new Date(e.created_at).toLocaleDateString()} · {e.category}
              </div>
            </div>
          )) : <p className="text-sm text-muted-foreground text-center py-8">No entries yet.</p>}
        </div>
      </div>
    </AppShell>
  );
}