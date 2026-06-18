import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { detectEmotion } from "@/lib/ai.functions";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/detect")({
  head: () => ({ meta: [{ title: "Emotion AI — MindMood" }] }),
  component: DetectPage,
});

const MOODS = ["happy", "sad", "angry", "neutral", "stress", "anxiety", "fear", "excited", "frustrated"];

function DetectPage() {
  const [text, setText] = useState("");
  const [userMood, setUserMood] = useState<string>("");
  const detectFn = useServerFn(detectEmotion);

  const mutation = useMutation({
    mutationFn: (input: { text: string; userMood?: string }) => detectFn({ data: input }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Detection failed"),
  });

  const result = mutation.data;

  return (
    <AppShell title="Emotion AI">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="glass rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center glow-primary">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg">Tell us what's on your mind</h2>
              <p className="text-xs text-muted-foreground">We'll gently detect the underlying emotion.</p>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. I have so much to do and I can't seem to start anything…"
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-input/30 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm leading-relaxed"
          />

          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">How do you think you're feeling? (optional)</p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setUserMood(userMood === m ? "" : m)}
                  className={`px-3 py-1.5 rounded-full text-xs capitalize border transition ${
                    userMood === m
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/50 hover:border-primary/50"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => mutation.mutate({ text, userMood: userMood || undefined })}
            disabled={!text.trim() || mutation.isPending}
            className="w-full mt-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Detect emotion
          </button>
        </div>

        {result && (
          <div className="glass rounded-3xl p-8 animate-in fade-in duration-500">
            <div className="flex items-start gap-6">
              <div className="text-7xl">{result.emoji}</div>
              <div className="flex-1">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Detected emotion</div>
                <div className="text-3xl font-display font-bold capitalize mt-1 text-gradient">
                  {result.emotion}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Pill>Intensity: {result.intensity}</Pill>
                  <Pill>Confidence: {Math.round(result.confidence * 100)}%</Pill>
                  {result.matchPercentage != null && (
                    <Pill>Match with your guess: {result.matchPercentage}%</Pill>
                  )}
                </div>
                <p className="mt-4 text-muted-foreground leading-relaxed">{result.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="px-3 py-1 rounded-full bg-muted/50 text-xs">{children}</span>;
}