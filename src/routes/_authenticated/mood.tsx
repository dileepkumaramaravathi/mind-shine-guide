import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/mood")({
  head: () => ({ meta: [{ title: "Mood — MindMood" }] }),
  component: MoodPage,
});

const MOOD_OPTS = [
  { v: "happy", e: "😊" },
  { v: "excited", e: "🤩" },
  { v: "neutral", e: "😐" },
  { v: "sad", e: "😢" },
  { v: "angry", e: "😠" },
  { v: "stress", e: "😣" },
  { v: "anxiety", e: "😰" },
  { v: "fear", e: "😨" },
  { v: "frustrated", e: "😤" },
];

function MoodPage() {
  const qc = useQueryClient();
  const [mood, setMood] = useState("happy");
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["moods"],
    queryFn: async () =>
      (await supabase.from("moods").select("*").order("created_at", { ascending: false }).limit(60)).data ?? [],
  });

  const save = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return; }
    const { error } = await supabase.from("moods").insert({
      user_id: u.user.id, mood, intensity, notes: notes || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Mood logged");
    setNotes("");
    qc.invalidateQueries({ queryKey: ["moods"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  return (
    <AppShell title="Mood">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="glass rounded-3xl p-8">
          <h2 className="font-display text-lg font-semibold mb-1">How are you feeling right now?</h2>
          <p className="text-xs text-muted-foreground mb-5">A quick check-in builds your wellness story.</p>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
            {MOOD_OPTS.map((m) => (
              <button
                key={m.v}
                onClick={() => setMood(m.v)}
                className={`p-4 rounded-2xl transition flex flex-col items-center gap-1 ${
                  mood === m.v ? "bg-primary/20 glow-primary" : "bg-muted/30 hover:bg-muted/50"
                }`}
              >
                <span className="text-3xl">{m.e}</span>
                <span className="text-xs capitalize">{m.v}</span>
              </button>
            ))}
          </div>

          <label className="text-xs text-muted-foreground">Intensity: {intensity}/10</label>
          <input
            type="range" min={1} max={10} value={intensity}
            onChange={(e) => setIntensity(+e.target.value)}
            className="w-full mt-2 accent-primary"
          />

          <textarea
            placeholder="Anything to note? (optional)"
            value={notes} onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full mt-4 px-4 py-3 rounded-xl bg-input/30 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
          />

          <button
            onClick={save} disabled={saving}
            className="w-full mt-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving && <Loader2 className="size-4 animate-spin" />} Save mood
          </button>
        </div>

        <div className="glass rounded-3xl p-8">
          <h3 className="font-display font-semibold mb-4">Mood history</h3>
          {data?.length ? (
            <ul className="divide-y divide-border/40">
              {data.map((m) => {
                const emoji = MOOD_OPTS.find((x) => x.v === m.mood)?.e ?? "🙂";
                return (
                  <li key={m.id} className="py-3 flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium capitalize">{m.mood}</div>
                      {m.notes && <div className="text-xs text-muted-foreground truncate">{m.notes}</div>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Intensity {m.intensity}/10
                    </div>
                    <div className="text-xs text-muted-foreground hidden sm:block ml-3">
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No moods logged yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}