
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  content TEXT NOT NULL,
  mood TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community read all" ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "community insert own" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "community update own" ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "community delete own" ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX community_posts_created_idx ON public.community_posts(created_at DESC);

CREATE TABLE public.community_likes (
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.community_likes TO authenticated;
GRANT ALL ON public.community_likes TO service_role;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes read all" ON public.community_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "likes own write" ON public.community_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes own delete" ON public.community_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX notifications_user_created_idx ON public.notifications(user_id, created_at DESC);

-- seed welcome notification on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_notifications()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, type)
  VALUES
    (NEW.id, 'Welcome to MindMood 🌿', 'Take a deep breath. Log your first mood to begin your journey.', 'welcome'),
    (NEW.id, 'Try a 1-minute breathing exercise', 'Your nervous system will thank you.', 'tip');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_notify
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_notifications();
