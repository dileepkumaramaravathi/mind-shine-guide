import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Brain, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — MindMood" },
      { name: "description", content: "Sign in or create your MindMood account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    full_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
  });

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        toast.success("Welcome back");
        router.navigate({ to: "/dashboard" });
      } else if (mode === "register") {
        if (form.password !== form.confirm) throw new Error("Passwords don't match");
        if (form.password.length < 6) throw new Error("Password must be at least 6 characters");
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: form.full_name,
              phone: form.phone,
              date_of_birth: form.date_of_birth,
              gender: form.gender,
            },
          },
        });
        if (error) throw error;
        toast.success("Account created");
        router.navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Reset link sent to your email");
        setMode("login");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center glow-primary">
            <Brain className="size-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-gradient">MindMood</span>
        </Link>

        <div className="glass rounded-3xl p-8">
          <h1 className="text-2xl font-display font-bold mb-1">
            {mode === "login" ? "Welcome back" : mode === "register" ? "Create your account" : "Reset password"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "login"
              ? "Sign in to continue your wellness journey."
              : mode === "register"
                ? "A few details to personalize your space."
                : "We'll email you a reset link."}
          </p>

          {mode !== "forgot" && (
            <div className="flex gap-1 p-1 rounded-xl bg-muted/40 mb-6 text-sm">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-2 rounded-lg transition ${mode === "login" ? "bg-card glow-primary" : ""}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 py-2 rounded-lg transition ${mode === "register" ? "bg-card glow-primary" : ""}`}
              >
                Register
              </button>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "register" && (
              <>
                <Field label="Full name" value={form.full_name} onChange={upd("full_name")} required />
                <Field label="Phone" type="tel" value={form.phone} onChange={upd("phone")} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date of birth" type="date" value={form.date_of_birth} onChange={upd("date_of_birth")} />
                  <div>
                    <label className="text-xs text-muted-foreground">Gender</label>
                    <select
                      value={form.gender}
                      onChange={upd("gender")}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl bg-input/40 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="">Select…</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="nonbinary">Non-binary</option>
                      <option value="prefer_not">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </>
            )}
            <Field label="Email" type="email" value={form.email} onChange={upd("email")} required />
            {mode !== "forgot" && (
              <Field label="Password" type="password" value={form.password} onChange={upd("password")} required />
            )}
            {mode === "register" && (
              <Field label="Confirm password" type="password" value={form.confirm} onChange={upd("confirm")} required />
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary hover:scale-[1.01] transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <button type="button" className="hover:text-foreground" onClick={() => setMode("forgot")}>
                Forgot password?
              </button>
            ) : (
              <button type="button" className="hover:text-foreground" onClick={() => setMode("login")}>
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        {...props}
        className="mt-1 w-full px-3 py-2.5 rounded-xl bg-input/40 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
      />
    </div>
  );
}