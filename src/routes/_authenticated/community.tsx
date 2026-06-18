import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Send, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({ meta: [{ title: "Community — MindMood" }] }),
  component: CommunityPage,
});

const MOODS = ["grateful", "calm", "anxious", "hopeful", "sad", "excited", "tired"];

type Post = {
  id: string;
  user_id: string;
  author_name: string | null;
  content: string;
  mood: string | null;
  likes: number;
  created_at: string;
};

function CommunityPage() {
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string>("");
  const [posting, setPosting] = useState(false);

  const { data: posts = [] } = useQuery({
    queryKey: ["community-posts"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as Post[];
    },
  });

  const { data: myLikes = new Set<string>() } = useQuery({
    queryKey: ["community-likes"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return new Set<string>();
      const { data } = await (supabase as any)
        .from("community_likes")
        .select("post_id")
        .eq("user_id", user.user.id);
      return new Set<string>(((data ?? []) as { post_id: string }[]).map((l) => l.post_id));
    },
  });

  const submit = async () => {
    const text = content.trim();
    if (!text) return;
    setPosting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data: profile } = await supabase
        .from("profiles").select("full_name").eq("id", u.user.id).maybeSingle();
      const { error } = await (supabase as any).from("community_posts").insert({
        user_id: u.user.id,
        author_name: profile?.full_name ?? "Anonymous",
        content: text,
        mood: mood || null,
      });
      if (error) throw error;
      setContent(""); setMood("");
      qc.invalidateQueries({ queryKey: ["community-posts"] });
      toast.success("Shared with the community");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post");
    } finally { setPosting(false); }
  };

  const toggleLike = async (post: Post) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const liked = myLikes.has(post.id);
    if (liked) {
      await (supabase as any).from("community_likes")
        .delete().eq("post_id", post.id).eq("user_id", u.user.id);
      await (supabase as any).from("community_posts")
        .update({ likes: Math.max(0, post.likes - 1) }).eq("id", post.id);
    } else {
      await (supabase as any).from("community_likes")
        .insert({ post_id: post.id, user_id: u.user.id });
      await (supabase as any).from("community_posts")
        .update({ likes: post.likes + 1 }).eq("id", post.id);
    }
    qc.invalidateQueries({ queryKey: ["community-posts"] });
    qc.invalidateQueries({ queryKey: ["community-likes"] });
  };

  return (
    <AppShell title="Community Plaza">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center glow-primary">
              <Users className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display font-semibold">Share a reflection</h2>
              <p className="text-xs text-muted-foreground">Anonymous-friendly space. Be kind.</p>
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="What's been on your mind today?"
            className="w-full px-4 py-3 rounded-xl bg-input/30 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {MOODS.map((m) => (
              <button
                key={m} type="button"
                onClick={() => setMood(mood === m ? "" : m)}
                className={`px-3 py-1 rounded-full text-xs capitalize border transition ${
                  mood === m
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/50 hover:border-primary/50"
                }`}
              >{m}</button>
            ))}
          </div>
          <button
            onClick={submit}
            disabled={!content.trim() || posting}
            className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground glow-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {posting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Post
          </button>
        </div>

        <div className="space-y-3">
          {posts.length === 0 && (
            <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
              No posts yet. Be the first to share.
            </div>
          )}
          {posts.map((p) => {
            const liked = myLikes.has(p.id);
            return (
              <article key={p.id} className="glass rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-9 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-bold text-sm">
                    {(p.author_name ?? "A").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.author_name ?? "Anonymous"}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleString()}
                      {p.mood && <span className="ml-2 capitalize">· feeling {p.mood}</span>}
                    </div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{p.content}</p>
                <button
                  onClick={() => toggleLike(p)}
                  className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition ${
                    liked
                      ? "bg-accent/20 border-accent/50 text-accent"
                      : "border-border/40 hover:border-accent/50"
                  }`}
                >
                  <Heart className={`size-3.5 ${liked ? "fill-current" : ""}`} />
                  {p.likes}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}