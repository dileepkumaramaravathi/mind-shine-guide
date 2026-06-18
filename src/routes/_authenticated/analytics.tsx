import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line,
} from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — MindMood" }] }),
  component: AnalyticsPage,
});

const COLORS = [
  "oklch(0.82 0.12 215)", "oklch(0.85 0.13 155)", "oklch(0.72 0.17 290)",
  "oklch(0.8 0.16 60)", "oklch(0.7 0.22 350)", "oklch(0.65 0.15 30)",
];
const MOOD_SCORE: Record<string, number> = {
  happy: 9, excited: 9, neutral: 6, sad: 3, angry: 2, stress: 3, anxiety: 3, fear: 2, frustrated: 3,
};

function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const [{ data: moods }, { data: emotions }] = await Promise.all([
        supabase.from("moods").select("mood, intensity, created_at").order("created_at", { ascending: true }),
        supabase.from("emotion_results").select("detected_emotion, created_at").order("created_at", { ascending: true }),
      ]);
      return { moods: moods ?? [], emotions: emotions ?? [] };
    },
  });

  const moods = data?.moods ?? [];
  const emotions = data?.emotions ?? [];

  // distribution
  const dist: Record<string, number> = {};
  moods.forEach((m) => { dist[m.mood] = (dist[m.mood] ?? 0) + 1; });
  const pieData = Object.entries(dist).map(([name, value]) => ({ name, value }));

  // weekly bar (last 7 days)
  const now = new Date();
  const weekly = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (6 - i));
    const key = d.toLocaleDateString(undefined, { weekday: "short" });
    const count = moods.filter((m) => {
      const md = new Date(m.created_at);
      return md.toDateString() === d.toDateString();
    }).length;
    return { day: key, entries: count };
  });

  // mood line trend
  const trend = moods.slice(-30).map((m, i) => ({
    i: i + 1, score: MOOD_SCORE[m.mood.toLowerCase()] ?? 5,
  }));

  // emotion bar
  const emoDist: Record<string, number> = {};
  emotions.forEach((e) => { emoDist[e.detected_emotion] = (emoDist[e.detected_emotion] ?? 0) + 1; });
  const emoBar = Object.entries(emoDist).map(([name, value]) => ({ name, value }));

  return (
    <AppShell title="Analytics">
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Mood distribution">
          {pieData.length ? (
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <Empty />}
        </Card>

        <Card title="Entries this week">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={weekly}>
                <XAxis dataKey="day" stroke="currentColor" opacity={0.5} fontSize={11} />
                <YAxis stroke="currentColor" opacity={0.5} fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="entries" fill="oklch(0.82 0.12 215)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Mood score trend (last 30)">
          {trend.length ? (
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <XAxis dataKey="i" stroke="currentColor" opacity={0.5} fontSize={11} />
                  <YAxis stroke="currentColor" opacity={0.5} fontSize={11} domain={[0, 10]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="score" stroke="oklch(0.85 0.13 155)" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <Empty />}
        </Card>

        <Card title="AI emotion detections">
          {emoBar.length ? (
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={emoBar} layout="vertical">
                  <XAxis type="number" stroke="currentColor" opacity={0.5} fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="currentColor" opacity={0.5} fontSize={11} width={80} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="oklch(0.72 0.17 290)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <Empty />}
        </Card>
      </div>
    </AppShell>
  );
}

const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 };

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="font-display font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}
function Empty() {
  return <p className="text-sm text-muted-foreground text-center py-12">Not enough data yet.</p>;
}