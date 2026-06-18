import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Smile, BookHeart, MessageCircleHeart, HeartPulse, Flame, TrendingUp, Search, Users,
} from "lucide-react";
import { LineChart as RLineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MindMood" }] }),
  component: Dashboard,
});

const MOOD_SCORE: Record<string, number> = {
  happy: 9, excited: 9, neutral: 6, sad: 3, angry: 2, stress: 3,
  anxiety: 3, fear: 2, frustrated: 3,
};

const MOTIVATIONS = [
  "Small steps still move you forward.",
  "Your feelings are valid — and they're not forever.",
  "Rest is productive. Permission granted.",
  "Breathe. You've handled hard days before.",
  "Today doesn't have to be perfect to be meaningful.",
];

function Dashboard() {
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [{ data: user }, { data: profile }, { data: moods }, { data: emotions }, { data: journals }] =
        await Promise.all([
          supabase.auth.getUser(),
          supabase.from("profiles").select("*").maybeSingle(),
          supabase.from("moods").select("*").order("created_at", { ascending: false }).limit(100),
          supabase.from("emotion_results").select("*").order("created_at", { ascending: false }).limit(50),
          supabase.from("journal_entries").select("*").order("created_at", { ascending: false }).limit(50),
        ]);
      return {
        user: user.user, profile,
        moods: moods ?? [], emotions: emotions ?? [], journals: journals ?? [],
      };
    },
  });

  const moods = data?.moods ?? [];
  const todayMood = moods[0];
  const scores = moods.map((m) => MOOD_SCORE[m.mood.toLowerCase()] ?? 5);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const wellnessScore = Math.round(avg * 10);
  const variance = scores.length > 1
    ? Math.sqrt(scores.reduce((a, s) => a + (s - avg) ** 2, 0) / scores.length)
    : 0;
  const stability = Math.max(0, Math.round(100 - variance * 15));

  const trend = [...moods].reverse().slice(-14).map((m, i) => ({
    day: i + 1,
    score: MOOD_SCORE[m.mood.toLowerCase()] ?? 5,
  }));

  // streak: consecutive days with at least one mood entry
  const streak = useMemo(() => {
    if (!moods.length) return 0;
    const days = new Set(moods.map((m) => new Date(m.created_at).toDateString()));
    let s = 0;
    const d = new Date();
    while (days.has(d.toDateString())) { s += 1; d.setDate(d.getDate() - 1); }
    return s;
  }, [moods]);

  // search across reflections
  const q = search.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!q) return [] as Array<{ kind: string; id: string; title: string; sub: string; date: string }>;
    const out: Array<{ kind: string; id: string; title: string; sub: string; date: string }> = [];
    (data?.journals ?? []).forEach((j: any) => {
      const hay = `${j.title} ${j.content} ${(j.keywords ?? []).join(" ")}`.toLowerCase();
      if (hay.includes(q)) out.push({
        kind: "Journal", id: j.id, title: j.title, sub: j.content.slice(0, 140), date: j.created_at,
      });
    });
    (data?.emotions ?? []).forEach((e: any) => {
      const hay = `${e.detected_emotion} ${e.input_text}`.toLowerCase();
      if (hay.includes(q)) out.push({
        kind: "Emotion", id: e.id, title: e.detected_emotion, sub: e.input_text, date: e.created_at,
      });
    });
    moods.forEach((m: any) => {
      const hay = `${m.mood} ${m.notes ?? ""}`.toLowerCase();
      if (hay.includes(q)) out.push({
        kind: "Mood", id: m.id, title: m.mood, sub: m.notes ?? `Intensity ${m.intensity}/10`, date: m.created_at,
      });
    });
    return out.sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 20);
  }, [q, data, moods]);

  const motivation = MOTIVATIONS[new Date().getDate() % MOTIVATIONS.length];
  const firstName = data?.profile?.full_name?.split(" ")[0] ?? "friend";

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        {/* Hero greeting with streak */}
        <div className="relative overflow-hidden rounded-3xl p-7 lg:p-10 glass">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-transparent pointer-events-none" />
          <div className="relative">
            <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-semibold">Daily check-in</span>
            <h2 className="text-3xl lg:text-4xl font-display font-bold mt-2">
              Hello, <span className="text-gradient">{firstName}</span> 👋
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl">
              Your consecutive mood tracking streak of{" "}
              <span className="text-accent font-semibold">
                {streak} active day{streak === 1 ? "" : "s"}
              </span>{" "}
              represents remarkable perseverance. Inhale peace, exhale tension.
            </p>
            <p className="text-sm text-muted-foreground mt-2 italic">"{motivation}"</p>
            <div className="flex flex-wrap gap-2 mt-5">
              <Link to="/wellness" className="px-4 py-2.5 rounded-xl bg-background/70 hover:bg-background text-sm inline-flex items-center gap-2">
                <HeartPulse className="size-4 text-primary" /> Start breathing guide
              </Link>
              <Link to="/chat" className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground glow-primary text-sm inline-flex items-center gap-2">
                <MessageCircleHeart className="size-4" /> Speak with AI guide
              </Link>
            </div>
          </div>
        </div>

        {/* Search past reflections */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Search className="size-5 text-primary" />
            <h3 className="font-display font-semibold">Search past reflections & mood notes</h3>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type keywords (e.g. 'coffee', 'meditation', 'happy')…"
            className="w-full px-4 py-3 rounded-xl bg-input/30 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          {q && (
            <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="text-xs text-muted-foreground py-4 text-center">No matches.</div>
              ) : searchResults.map((r) => (
                <div key={`${r.kind}-${r.id}`} className="p-3 rounded-xl bg-muted/30 flex gap-3">
                  <span className="text-[10px] uppercase tracking-wider text-primary font-bold mt-0.5">{r.kind}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium capitalize truncate">{r.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{r.sub}</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(r.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Smile}
            label="Today's mood"
            value={todayMood ? todayMood.mood : "—"}
            sub={todayMood ? `Intensity ${todayMood.intensity}/10` : "Log your first mood"}
          />
          <StatCard icon={HeartPulse} label="Wellness score" value={`${wellnessScore}`} sub="out of 100" tone="primary" />
          <StatCard icon={TrendingUp} label="Stability index" value={`${stability}%`} sub="last 30 entries" tone="accent" />
          <StatCard icon={Flame} label="Active streak" value={`${streak}`} sub={`day${streak === 1 ? "" : "s"} in a row`} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">Mood trend</h3>
              <span className="text-xs text-muted-foreground">last 14 entries</span>
            </div>
            {trend.length ? (
              <div className="h-56">
                <ResponsiveContainer>
                  <RLineChart data={trend} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="oklch(0.82 0.12 215)" />
                        <stop offset="100%" stopColor="oklch(0.85 0.13 155)" />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="currentColor" opacity={0.4} fontSize={11} />
                    <YAxis stroke="currentColor" opacity={0.4} fontSize={11} domain={[0, 10]} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                    <Line type="monotone" dataKey="score" stroke="url(#g1)" strokeWidth={3} dot={{ r: 3 }} />
                  </RLineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState text="Log a mood to see your trend." />
            )}
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold mb-4">Quick actions</h3>
            <div className="space-y-2">
              <QuickAction to="/detect" icon={Sparkles} label="Detect emotion" />
              <QuickAction to="/mood" icon={Smile} label="Log mood" />
              <QuickAction to="/journal" icon={BookHeart} label="Write journal" />
              <QuickAction to="/chat" icon={MessageCircleHeart} label="Talk to companion" />
              <QuickAction to="/wellness" icon={HeartPulse} label="Breathe" />
              <QuickAction to="/community" icon={Users} label="Community plaza" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Recent emotion checks</h3>
            <Link to="/detect" className="text-xs text-primary hover:underline">New detection →</Link>
          </div>
          {data?.emotions?.length ? (
            <ul className="space-y-2">
              {data.emotions.map((e) => (
                <li key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                  <span className="text-2xl">{e.emoji ?? "🧠"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium capitalize">{e.detected_emotion}</div>
                    <div className="text-xs text-muted-foreground truncate">{e.input_text}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState text="No detections yet. Try the Emotion AI page." />
          )}
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon: Icon, label, value, sub, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub: string;
  tone?: "primary" | "accent";
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className={`size-10 rounded-xl grid place-items-center mb-3 ${
        tone === "primary" ? "bg-primary/20 text-primary"
        : tone === "accent" ? "bg-accent/20 text-accent"
        : "bg-muted text-muted-foreground"
      }`}>
        <Icon className="size-5" />
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-display font-bold mt-1 capitalize">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition text-sm">
      <Icon className="size-4 text-primary" />
      {label}
    </Link>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="text-sm text-muted-foreground py-12 text-center">{text}</div>;
}