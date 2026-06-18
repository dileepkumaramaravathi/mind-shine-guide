import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { chatWithAssistant } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2, MessageCircleHeart } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Companion — MindMood" }] }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatFn = useServerFn(chatWithAssistant);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("chat_messages")
      .select("role, content")
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data?.length) {
          setMessages(data.filter((m) => m.role !== "system") as Msg[]);
        }
      });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const { reply } = await chatFn({ data: { messages: next } });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Companion couldn't respond");
      setMessages(messages);
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell title="Wellness companion">
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-9rem)]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="glass rounded-3xl p-10 text-center">
              <div className="size-14 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent grid place-items-center glow-primary mb-4">
                <MessageCircleHeart className="size-7 text-primary-foreground" />
              </div>
              <h2 className="font-display font-semibold text-xl">I'm here whenever you are.</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Share what's on your mind — a feeling, a worry, a win.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role}>
              {m.role === "assistant" ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
            </Bubble>
          ))}
          {sending && (
            <Bubble role="assistant">
              <Loader2 className="size-4 animate-spin inline" /> <span className="opacity-70">Thinking…</span>
            </Bubble>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="glass rounded-2xl p-2 flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Tell me what's on your mind…"
            rows={1}
            className="flex-1 bg-transparent resize-none px-3 py-2 focus:outline-none text-sm max-h-40"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="size-10 rounded-xl bg-primary text-primary-foreground grid place-items-center glow-primary disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "glass"
        }`}
      >
        {typeof children === "string" ? children : <div className="prose-sm">{children}</div>}
      </div>
    </div>
  );
}