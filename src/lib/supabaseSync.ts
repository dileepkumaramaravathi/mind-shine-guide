import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false
      }
    })
  : null;

if (isSupabaseConfigured) {
  console.log('[Supabase Client] Initialized successfully with:', SUPABASE_URL);
} else {
  console.log('[Supabase Client] Disabled or credentials not configured. Using local-first mode.');
}

export async function syncRegister(userId: string, name: string, email: string) {
  if (!supabase) return;
  console.log('[Supabase Sync] Registering user in profiles...');
  try {
    const cleanUserId = userId.startsWith('token-') ? userId.replace('token-', '') : userId;
    // UUID regex check to ensure standard UUID format for Supabase profiles table
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const dbId = uuidRegex.test(cleanUserId) ? cleanUserId : '00000000-0000-0000-0000-000000000000';

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: dbId,
        full_name: name,
        updated_at: new Date().toISOString()
      });
    if (error) {
      console.warn('[Supabase Sync Register Warning]', error.message);
    } else {
      console.log('[Supabase Sync Register] Success for user:', email);
    }
  } catch (err: any) {
    console.warn('[Supabase Sync Register Error]', err.message);
  }
}

export async function syncMood(userId: string, moodType: string, intensity: number, note: string) {
  if (!supabase) return;
  console.log('[Supabase Sync] Storing mood entry...');
  try {
    const cleanUserId = userId.startsWith('token-') ? userId.replace('token-', '') : userId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const dbId = uuidRegex.test(cleanUserId) ? cleanUserId : '00000000-0000-0000-0000-000000000000';

    const { error } = await supabase
      .from('moods')
      .insert({
        user_id: dbId,
        mood: moodType,
        intensity: intensity,
        notes: note || '',
        created_at: new Date().toISOString()
      });
    if (error) {
      console.warn('[Supabase Sync Mood Warning]', error.message);
    } else {
      console.log('[Supabase Sync Mood] Success!');
    }
  } catch (err: any) {
    console.warn('[Supabase Sync Mood Error]', err.message);
  }
}

export async function syncJournal(userId: string, text: string, moodTag: string, aiAnalysis?: any) {
  if (!supabase) return;
  console.log('[Supabase Sync] Storing journal entry...');
  try {
    const cleanUserId = userId.startsWith('token-') ? userId.replace('token-', '') : userId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const dbId = uuidRegex.test(cleanUserId) ? cleanUserId : '00000000-0000-0000-0000-000000000000';

    const journalPayload = {
      user_id: dbId,
      title: moodTag || 'Daily Journal',
      content: text,
      sentiment: aiAnalysis?.emotion || null,
      summary: aiAnalysis?.summary || null,
      created_at: new Date().toISOString()
    };

    const { error: errorEntries } = await supabase
      .from('journal_entries')
      .insert(journalPayload);

    if (errorEntries) {
      // Fallback to 'journals' table just in case they have a legacy schema
      const { error: errorJournals } = await supabase
        .from('journals')
        .insert(journalPayload);
      if (errorJournals) {
        console.warn('[Supabase Sync Journal Warning]', errorJournals.message);
      } else {
        console.log('[Supabase Sync Journal] Success (journals fallback table)!');
      }
    } else {
      console.log('[Supabase Sync Journal] Success (journal_entries table)!');
    }
  } catch (err: any) {
    console.warn('[Supabase Sync Journal Error]', err.message);
  }
}
