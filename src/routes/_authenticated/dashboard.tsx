import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Smile, BookHeart, MessageCircleHeart, HeartPulse, LineChart, Flame, TrendingUp,
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
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [{ data: user }, { data: profile }, { data: moods }, { data: emotions }] =
        await Promise.all([
          supabase.auth.getUser(),
          supabase.from("profiles").select("*").maybeSingle(),
          supabase.from("moods").select("*").order("created_at", { ascending: false }).limit(30),
          supabase.from("emotion_results").select("*").order("created_at", { ascending: false }).limit(5),
        ]);
      return { user: user.user, profile, moods: moods ?? [], emotions: emotions ?? [] };
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

  const motivation = MOTIVATIONS[new Date().getDate() % MOTIVATIONS.length];
  const firstName = data?.profile?.full_name?.split(" ")[0] ?? "friend";

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h2 className="text-3xl lg:text-4xl font-display font-bold mt-1">
            Hello, <span className="text-gradient">{firstName}</span>
          </h2>
          <p className="text-muted-foreground mt-2 italic">"{motivation}"</p>
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
          <StatCard icon={Flame} label="Entries" value={`${moods.length}`} sub="moods tracked" />
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