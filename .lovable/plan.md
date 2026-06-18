## MindMood v1 — Core Wellness MVP

A demo-ready mental wellness platform with the "Calm Aurora" theme (deep navy + mint/aqua + glassmorphism).

### Visual & Design System
- Dark-first theme with light mode toggle.
- Palette: `#0B1220` bg, `#1B2A4E` surface, `#7BD3EA` primary (aqua), `#A6F1C6` accent (mint), `#F6F7FB` foreground.
- Glassmorphism cards (backdrop blur + subtle borders), soft glow shadows, smooth Motion-style transitions.
- Typography: Inter (body) + Outfit (display) via @fontsource.
- All colors defined as semantic tokens in `src/styles.css` (oklch). No hard-coded colors in components.

### Backend (Lovable Cloud / Supabase)
Tables (all with RLS scoped to `auth.uid()`):
- `profiles` (full_name, phone, dob, gender, avatar, xp, level)
- `moods` (mood, intensity, notes, created_at)
- `emotion_results` (input_text, detected_emotion, confidence, intensity, explanation, user_mood)
- `journal_entries` (title, content, category, sentiment, keywords, summary)
- `chat_messages` (role, content, thread_id)
- `wellness_scores` (score, stability_index, computed_at)

Server functions (`createServerFn`) for Gemini calls — `GEMINI_API_KEY` stays server-side.

### Auth
- Email/password via Supabase. Sign up captures full name, phone, DOB, gender → profile row via trigger.
- Login, forgot password, `/reset-password` page (recovery flow).
- `_authenticated/` route layout gates the app.

### Routes
- `/` — Splash → Welcome (public landing)
- `/auth` — Login + Register tabs
- `/reset-password`
- `/onboarding` — 5 screens (intro to features)
- `/_authenticated/dashboard` — Home: welcome, today's mood, wellness score, stability index, AI recommendations, daily motivation, recent activity, mood trend chart, quick actions
- `/_authenticated/detect` — AI Emotion Detection (text input → emotion + confidence + emoji + explanation; saves to `emotion_results`; compares to user-selected mood for match %)
- `/_authenticated/chat` — AI Chat Assistant (streaming, supportive companion with system prompt for wellness/motivation; threaded UI optional, one conversation by default)
- `/_authenticated/mood` — Log mood (picker + intensity slider + notes); mood history + calendar heatmap
- `/_authenticated/journal` — List + new entry (rich textarea); "Analyze with AI" → sentiment, keywords, summary stored on entry
- `/_authenticated/analytics` — Recharts: mood line chart, emotion distribution pie, weekly bar
- `/_authenticated/wellness` — Static curated content: guided breathing (animated breathing circle), meditation prompts, affirmations, gratitude exercise
- `/_authenticated/profile` — User info, stats, theme toggle, sign out

### AI Integration (Gemini)
- Server function `detectEmotion(text)` → Gemini structured output (emotion enum, confidence, intensity, emoji, explanation).
- Server function `chatWithAssistant(messages)` → Gemini streaming response with wellness system prompt.
- Server function `analyzeJournal(content)` → sentiment, keywords[], summary.
- All calls read `process.env.GEMINI_API_KEY` inside handlers.

### Out of scope for v1 (can add later)
Goals, habits, gamification (XP shown but minimal), community, admin dashboard, notifications, PDF reports, mood prediction/burnout detection, achievements module.

### Build order
1. Enable Lovable Cloud + request `GEMINI_API_KEY` secret.
2. Design system (`styles.css`), fonts, shadcn variants.
3. DB migration (tables + RLS + profile trigger).
4. Auth pages + `_authenticated` gate.
5. Dashboard shell + sidebar nav.
6. Mood logging + journal.
7. Gemini server functions + Emotion Detection page + Chat page.
8. Analytics (Recharts) + Wellness center.
9. Profile + theme toggle.
10. Splash/Welcome/Onboarding polish.

I'll ask for the Gemini API key right before wiring the AI features (step 7).