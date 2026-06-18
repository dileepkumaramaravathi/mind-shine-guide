import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Brain, Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — MindMood" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be 6+ characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      router.navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center glow-primary">
            <Brain className="size-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-gradient">MindMood</span>
        </div>
        <div className="glass rounded-3xl p-8">
          <h1 className="text-2xl font-display font-bold mb-1">Set a new password</h1>
          <p className="text-sm text-muted-foreground mb-6">Choose something you'll remember.</p>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl bg-input/40 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl bg-input/40 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="size-4 animate-spin" />} Update password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}