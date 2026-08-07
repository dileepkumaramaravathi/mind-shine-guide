-- SQL script to create missing community_posts table in Supabase
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    bg_gradient TEXT NOT NULL,
    likes TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Create policies so anyone can select and insert, and the author can update/delete
CREATE POLICY "Allow public select on community_posts" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on community_posts" ON public.community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on community_posts" ON public.community_posts FOR UPDATE USING (true);

-- Disable RLS to match other tables for testing
ALTER TABLE public.community_posts DISABLE ROW LEVEL SECURITY;
