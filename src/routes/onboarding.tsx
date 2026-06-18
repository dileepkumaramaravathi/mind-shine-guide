import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Smile, BookHeart, HeartPulse, LineChart, ArrowRight, ArrowLeft, Check } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — MindMood" }] }),
  component: Onboarding,
});

const STEPS = [
  { icon: Sparkles, title: "Welcome to MindMood", desc: "Your private, AI-powered companion for emotional wellness. Calm, gentle, and always available." },
  { icon: Sparkles, title: "AI Emotion Detection", desc: "Type how you feel in your own words. We'll surface the underlying emotion with empathy and context." },
  { icon: Smile, title: "Mood Tracking", desc: "Log your mood with intensity and notes. We'll build a calendar of your emotional rhythm." },
  { icon: HeartPulse, title: "Wellness Guidance", desc: "Breathing exercises, meditations, affirmations, and gratitude — gentle tools for tough moments." },
  { icon: LineChart, title: "Analytics & Insights", desc: "Beautiful charts reveal patterns. Discover what lifts you up and what drains you." },
];

function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const S = STEPS[step];
  const Icon = S.icon;
  const last = step === STEPS.length - 1;

  return (
    <div className="min-h-screen grid place-items-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex gap-1.5 mb-8 justify-center">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/50" : "w-4 bg-muted"}`}
            />
          ))}
        </div>
        <div className="glass rounded-3xl p-10 text-center">
          <div className="size-20 rounded-2xl bg-gradient-to-br from-primary to-accent grid place-items-center mx-auto mb-6 glow-primary animate-float">
            <Icon className="size-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-3">{S.title}</h1>
          <p className="text-muted-foreground leading-relaxed">{S.desc}</p>

          <div className="mt-10 flex items-center justify-between gap-3">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 disabled:opacity-30"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
            {last ? (
              <Link
                to="/dashboard"
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium inline-flex items-center gap-2 glow-primary"
              >
                <Check className="size-4" /> Enter MindMood
              </Link>
            ) : (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium inline-flex items-center gap-2 glow-primary"
              >
                Next <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        </div>
        <div className="text-center mt-4">
          <button onClick={() => router.navigate({ to: "/dashboard" })} className="text-xs text-muted-foreground hover:text-foreground">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}