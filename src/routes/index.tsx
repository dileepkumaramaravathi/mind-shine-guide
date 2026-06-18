import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Brain, Sparkles, MessageCircleHeart, LineChart, HeartPulse, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MindMood — AI Mental Wellness Companion" },
      {
        name: "description",
        content:
          "MindMood detects how you feel, tracks your mood, journals with AI, and guides you to a calmer, healthier mind.",
      },
      { property: "og:title", content: "MindMood — AI Mental Wellness Companion" },
      {
        property: "og:description",
        content: "AI emotion detection, mood tracking, journaling, and wellness — all in one calm space.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const features = [
    { icon: Sparkles, title: "AI Emotion Detection", desc: "Type a few words. We surface what you might be feeling, with empathy." },
    { icon: MessageCircleHeart, title: "Wellness Companion", desc: "A 24/7 supportive AI that listens, reframes, and guides gentle next steps." },
    { icon: LineChart, title: "Mood Analytics", desc: "Beautiful charts of your emotional rhythm over days, weeks, months." },
    { icon: HeartPulse, title: "Wellness Center", desc: "Breathing, meditation, affirmations and gratitude — when you need them." },
  ];
  return (
    <div className="min-h-screen relative overflow-hidden">
      <nav className="px-6 lg:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center glow-primary">
            <Brain className="size-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-gradient">MindMood</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Link
            to="/auth"
            className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition font-medium"
          >
            Get started
          </Link>
        </div>
      </nav>

      <section className="px-6 lg:px-12 pt-12 lg:pt-24 pb-24 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-muted-foreground mb-8">
          <Sparkles className="size-3 text-primary" /> AI-powered mental wellness
        </div>
        <h1 className="text-5xl lg:text-7xl font-display font-bold leading-[1.05] tracking-tight">
          Feel <span className="text-gradient">heard.</span>
          <br />
          Grow <span className="text-gradient">calm.</span>
        </h1>
        <p className="mt-6 text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
          MindMood reads your emotions, tracks your moods, journals with you, and offers gentle guidance —
          a calm, private companion for everyday mental wellness.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/auth"
            className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-medium inline-flex items-center gap-2 glow-primary hover:scale-[1.02] transition"
          >
            Start free <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/onboarding"
            className="px-6 py-3 rounded-2xl glass font-medium hover:bg-muted/50 transition"
          >
            Take the tour
          </Link>
        </div>

        <div className="mt-20 relative">
          <div className="absolute inset-0 -z-10 blur-3xl opacity-50 bg-gradient-to-r from-primary via-accent to-primary rounded-full" />
          <div className="size-48 mx-auto rounded-full bg-gradient-to-br from-primary/40 to-accent/40 grid place-items-center animate-breathe">
            <div className="size-32 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center">
              <Brain className="size-12 text-primary-foreground" />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-12 pb-24 max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6">
              <div className="size-10 rounded-xl bg-primary/15 grid place-items-center text-primary mb-4">
                <f.icon className="size-5" />
              </div>
              <h3 className="font-display font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-6 lg:px-12 py-8 border-t border-border/40 text-center text-xs text-muted-foreground">
        Built with care · MindMood is a wellness companion, not a substitute for professional help.
      </footer>
    </div>
  );
}
