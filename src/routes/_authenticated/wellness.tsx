import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Wind, Quote, Heart, Leaf } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wellness")({
  head: () => ({ meta: [{ title: "Wellness — MindMood" }] }),
  component: WellnessPage,
});

const AFFIRMATIONS = [
  "I am safe in this moment.",
  "My feelings are valid and they pass.",
  "I am doing the best I can with what I have.",
  "I deserve gentleness — especially from myself.",
  "I trust my ability to handle whatever comes.",
  "I am more than my thoughts.",
];

function WellnessPage() {
  return (
    <AppShell title="Wellness center">
      <div className="max-w-5xl mx-auto space-y-6">
        <BreathingCard />
        <div className="grid lg:grid-cols-2 gap-4">
          <AffirmationCard />
          <GratitudeCard />
        </div>
        <MeditationCard />
      </div>
    </AppShell>
  );
}

function BreathingCard() {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");

  useEffect(() => {
    if (!running) return;
    const seq: Array<typeof phase> = ["inhale", "hold", "exhale"];
    let i = 0;
    setPhase("inhale");
    const id = setInterval(() => { i = (i + 1) % 3; setPhase(seq[i]); }, 4000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <div className="glass rounded-3xl p-8 text-center">
      <div className="flex items-center justify-center gap-2 text-primary mb-2">
        <Wind className="size-5" />
        <h3 className="font-display font-semibold">Box breathing</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-8">4 seconds in · hold · 4 seconds out.</p>
      <div className="relative h-64 grid place-items-center">
        <div
          className={`size-40 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center transition-transform duration-[4000ms] ease-in-out ${
            running && phase === "inhale" ? "scale-125"
            : running && phase === "exhale" ? "scale-90"
            : "scale-100"
          }`}
        >
          <span className="text-primary-foreground font-display font-semibold capitalize">
            {running ? phase : "ready"}
          </span>
        </div>
      </div>
      <button
        onClick={() => setRunning((r) => !r)}
        className="mt-6 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary"
      >
        {running ? "Stop" : "Begin"}
      </button>
    </div>
  );
}

function AffirmationCard() {
  const [i, setI] = useState(0);
  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center gap-2 mb-3 text-primary">
        <Quote className="size-5" />
        <h3 className="font-display font-semibold">Daily affirmation</h3>
      </div>
      <p className="text-xl font-display leading-relaxed min-h-24 flex items-center">
        "{AFFIRMATIONS[i % AFFIRMATIONS.length]}"
      </p>
      <button
        onClick={() => setI((x) => x + 1)}
        className="mt-4 px-4 py-2 rounded-xl glass text-sm hover:bg-muted/40"
      >
        Next →
      </button>
    </div>
  );
}

function GratitudeCard() {
  const [items, setItems] = useState<string[]>(["", "", ""]);
  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center gap-2 mb-3 text-accent">
        <Heart className="size-5" />
        <h3 className="font-display font-semibold">Three things I'm grateful for</h3>
      </div>
      <div className="space-y-2">
        {items.map((v, idx) => (
          <input
            key={idx}
            value={v}
            onChange={(e) => setItems((arr) => arr.map((x, i) => (i === idx ? e.target.value : x)))}
            placeholder={`Gratitude ${idx + 1}…`}
            className="w-full px-3 py-2 rounded-xl bg-input/30 border border-border/40 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3">Reflect for a moment on each. No need to save.</p>
    </div>
  );
}

function MeditationCard() {
  const prompts = [
    "Notice five things you can see right now.",
    "Place a hand on your chest and feel three full breaths.",
    "Drop your shoulders. Unclench your jaw. Soften your eyes.",
    "Picture a warm light traveling slowly from your head to your toes.",
  ];
  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center gap-2 mb-3 text-accent">
        <Leaf className="size-5" />
        <h3 className="font-display font-semibold">Mini meditations</h3>
      </div>
      <ul className="grid sm:grid-cols-2 gap-3">
        {prompts.map((p, i) => (
          <li key={i} className="p-4 rounded-2xl bg-muted/30 text-sm leading-relaxed">{p}</li>
        ))}
      </ul>
    </div>
  );
}