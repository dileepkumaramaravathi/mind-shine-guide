import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://geqgbznbgbffcployftk.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_JMrMtWHO3ahkmeusnpb9RA_NDx_oY_e';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false
      }
    })
  : null;

export async function syncRegister(userId: string, name: string, email: string) {
  if (!supabase) return;
  try {
    const { data: authData } = await supabase.auth.getUser();
    const targetId = authData?.user?.id;
    if (targetId) {
      await supabase.from('profiles').upsert({
        id: targetId,
        full_name: name,
        updated_at: new Date().toISOString()
      });
    }
  } catch { /* Silent non-blocking fallback */ }
}

export async function syncMood(userId: string, moodType: string, intensity: number, note: string) {
  if (!supabase) return;
  try {
    const { data: authData } = await supabase.auth.getUser();
    const targetId = authData?.user?.id;
    if (targetId) {
      await supabase.from('moods').insert({
        user_id: targetId,
        mood: moodType,
        intensity: intensity,
        notes: note || '',
        created_at: new Date().toISOString()
      });
    }
  } catch { /* Silent non-blocking fallback */ }
}

export async function syncJournal(userId: string, text: string, moodTag: string, aiAnalysis?: any) {
  if (!supabase) return;
  try {
    const { data: authData } = await supabase.auth.getUser();
    const targetId = authData?.user?.id;
    if (targetId) {
      const journalPayload = {
        user_id: targetId,
        title: moodTag || 'Daily Journal',
        content: text,
        sentiment: aiAnalysis?.emotion || null,
        summary: aiAnalysis?.summary || null,
        created_at: new Date().toISOString()
      };
      await supabase.from('journal_entries').insert(journalPayload);
    }
  } catch { /* Silent non-blocking fallback */ }
}
