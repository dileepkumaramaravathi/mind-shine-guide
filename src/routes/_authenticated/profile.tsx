import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Loader2, UserRound } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — MindMood" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", gender: "" });

  const { data } = useQuery({
    queryKey: ["profile-full"],
    queryFn: async () => {
      const [{ data: u }, { data: p }, { count: mc }, { count: jc }, { count: ec }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("profiles").select("*").maybeSingle(),
        supabase.from("moods").select("*", { count: "exact", head: true }),
        supabase.from("journal_entries").select("*", { count: "exact", head: true }),
        supabase.from("emotion_results").select("*", { count: "exact", head: true }),
      ]);
      return { user: u.user, profile: p, moodCount: mc ?? 0, journalCount: jc ?? 0, emotionCount: ec ?? 0 };
    },
  });

  useEffect(() => {
    if (data?.profile) {
      setForm({
        full_name: data.profile.full_name ?? "",
        phone: data.profile.phone ?? "",
        gender: data.profile.gender ?? "",
      });
    }
  }, [data?.profile]);

  const save = async () => {
    if (!data?.user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", data.user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["profile-full"] });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <AppShell title="Profile">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="glass rounded-3xl p-8 flex items-center gap-5">
          <div className="size-20 rounded-2xl bg-gradient-to-br from-primary to-accent grid place-items-center glow-primary">
            <UserRound className="size-10 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-display font-bold">{data?.profile?.full_name ?? "Friend"}</h2>
            <p className="text-sm text-muted-foreground">{data?.user?.email}</p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary">
                Level {data?.profile?.level ?? 1}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-accent/20">
                {data?.profile?.xp ?? 0} XP
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="Moods" value={data?.moodCount ?? 0} />
          <Stat label="Journals" value={data?.journalCount ?? 0} />
          <Stat label="Detections" value={data?.emotionCount ?? 0} />
        </div>

        <div className="glass rounded-3xl p-6 space-y-3">
          <h3 className="font-display font-semibold mb-2">Edit profile</h3>
          <Field label="Full name" value={form.full_name} onChange={(v) => setForm((f) => ({ ...f, full_name: v }))} />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
          <div>
            <label className="text-xs text-muted-foreground">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              className="mt-1 w-full px-3 py-2.5 rounded-xl bg-input/40 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="">—</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="nonbinary">Non-binary</option>
              <option value="prefer_not">Prefer not to say</option>
            </select>
          </div>
          <button
            onClick={save} disabled={saving}
            className="w-full mt-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving && <Loader2 className="size-4 animate-spin" />} Save
          </button>
        </div>

        <button
          onClick={signOut}
          className="w-full py-3 rounded-xl glass font-medium inline-flex items-center justify-center gap-2 hover:bg-destructive/10 hover:text-destructive transition"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </AppShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2.5 rounded-xl bg-input/40 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-4 text-center">
      <div className="text-2xl font-display font-bold text-gradient">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}