import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DetectInput = z.object({
  text: z.string().min(1).max(2000),
  userMood: z.string().optional(),
});

const EMOJI: Record<string, string> = {
  happy: "😊", sad: "😢", angry: "😠", neutral: "😐",
  stress: "😣", anxiety: "😰", fear: "😨", excited: "🤩", frustrated: "😤",
};

export const detectEmotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => DetectInput.parse(data))
  .handler(async ({ data, context }) => {
    const { callGemini } = await import("./ai-gateway.server");
    const raw = await callGemini({
      jsonMode: true,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are an emotion detection model. Given user text, respond with strict JSON: " +
            '{"emotion": one of [happy,sad,angry,neutral,stress,anxiety,fear,excited,frustrated], ' +
            '"confidence": 0-1 number, "intensity": "low"|"medium"|"high", ' +
            '"explanation": one short empathetic sentence (max 30 words)}. ' +
            "Respond with ONLY the JSON object, no markdown.",
        },
        { role: "user", content: data.text },
      ],
    });

    let parsed: { emotion: string; confidence: number; intensity: string; explanation: string };
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      parsed = { emotion: "neutral", confidence: 0.5, intensity: "medium", explanation: raw.slice(0, 200) };
    }
    const emotion = (parsed.emotion || "neutral").toLowerCase();
    const emoji = EMOJI[emotion] ?? "🧠";

    let matchPercentage: number | null = null;
    if (data.userMood) {
      const um = data.userMood.toLowerCase();
      matchPercentage = um === emotion ? 100 : um.includes(emotion) || emotion.includes(um) ? 70 : 30;
    }

    const { error } = await context.supabase.from("emotion_results").insert({
      user_id: context.userId,
      input_text: data.text,
      detected_emotion: emotion,
      confidence: parsed.confidence ?? null,
      intensity: parsed.intensity ?? null,
      emoji,
      explanation: parsed.explanation ?? null,
      user_mood: data.userMood ?? null,
      match_percentage: matchPercentage,
    });
    if (error) console.error("emotion_results insert", error);

    return {
      emotion,
      emoji,
      confidence: parsed.confidence ?? 0,
      intensity: parsed.intensity ?? "medium",
      explanation: parsed.explanation ?? "",
      matchPercentage,
    };
  });

const ChatInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
});

export const chatWithAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ChatInput.parse(data))
  .handler(async ({ data, context }) => {
    const { callGemini } = await import("./ai-gateway.server");
    const reply = await callGemini({
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content:
            "You are MindMood, a warm, empathetic mental wellness companion. " +
            "Listen carefully, validate feelings, and offer gentle, practical suggestions: " +
            "breathing techniques, grounding exercises, reframing, journaling prompts, or small actions. " +
            "Keep responses concise (2-4 short paragraphs), supportive, never clinical or diagnostic. " +
            "If the user mentions self-harm or crisis, encourage them to reach out to a trusted person or a local helpline.",
        },
        ...data.messages,
      ],
    });

    const last = data.messages[data.messages.length - 1];
    await context.supabase.from("chat_messages").insert([
      { user_id: context.userId, role: "user", content: last.content },
      { user_id: context.userId, role: "assistant", content: reply },
    ]);

    return { reply };
  });

const JournalInput = z.object({ content: z.string().min(1).max(8000) });

export const analyzeJournal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => JournalInput.parse(data))
  .handler(async ({ data }) => {
    const { callGemini } = await import("./ai-gateway.server");
    const raw = await callGemini({
      jsonMode: true,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "Analyze the journal entry. Respond with strict JSON only: " +
            '{"sentiment": "positive"|"neutral"|"negative", ' +
            '"keywords": array of 3-6 short lowercase keywords, ' +
            '"summary": 1-2 sentence reflective summary}. No markdown.',
        },
        { role: "user", content: data.content },
      ],
    });
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      return {
        sentiment: String(parsed.sentiment ?? "neutral"),
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [],
        summary: String(parsed.summary ?? ""),
      };
    } catch {
      return { sentiment: "neutral", keywords: [], summary: raw.slice(0, 300) };
    }
  });