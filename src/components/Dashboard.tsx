/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Brain, BookOpen, Clock, Heart, Smile, Search } from 'lucide-react';
import { Mood, MoodType, User } from '../types';

interface DashboardProps {
  user: User;
  todayMood: Mood | null;
  onRecordMood: (moodType: MoodType, intensity: number, note: string) => Promise<void>;
  onNavigate: (tab: 'dashboard' | 'chat' | 'journal' | 'analytics' | 'profile' | 'meditation' | 'community' | 'notifications' | 'wellness') => void;
  token: string;
}

export default function Dashboard({ user, todayMood, onRecordMood, onNavigate, token }: DashboardProps) {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [intensity, setIntensity] = useState<number>(3);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search local states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ journals: any[]; moods: any[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Daily Habits Checklist
  const [checklist, setChecklist] = useState(() => {
    const saved = localStorage.getItem('daily_checklist');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          logMood: todayMood ? true : parsed.logMood,
          doBreathing: parsed.doBreathing || false,
          chatAI: parsed.chatAI || false,
          writeJournal: parsed.writeJournal || false
        };
      } catch (e) {}
    }
    return {
      logMood: todayMood ? true : false,
      doBreathing: false,
      chatAI: false,
      writeJournal: false
    };
  });

  // Keep logMood state synced with todayMood props
  React.useEffect(() => {
    if (todayMood) {
      setChecklist(prev => {
        const updated = { ...prev, logMood: true };
        localStorage.setItem('daily_checklist', JSON.stringify(updated));
        return updated;
      });
    }
  }, [todayMood]);

  const toggleChecklistItem = (key: 'logMood' | 'doBreathing' | 'chatAI' | 'writeJournal') => {
    if (key === 'logMood' && todayMood) return; // Prevent toggling off if mood logged
    setChecklist((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('daily_checklist', JSON.stringify(updated));
      return updated;
    });
  };

  // Rotating wellness affirmations
  const quotesList = [
    { text: "Owning our story and loving ourselves through that process is the bravest thing that we will ever do.", author: "Brené Brown" },
    { text: "You don't have to control your thoughts. You just have to stop letting them control you.", author: "Dan Millman" },
    { text: "Breathe in deeply to bring your mind home to your body.", author: "Thich Nhat Hanh" },
    { text: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.", author: "Thich Nhat Hanh" },
    { text: "Self-care is how you take your power back.", author: "Lalah Delia" },
    { text: "Quiet the mind and the soul will speak.", author: "Ma Jaya Sati Bhagavati" }
  ];

  const [dailyQuote] = useState(() => {
    const day = new Date().getDate();
    return quotesList[day % quotesList.length];
  });
  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  // Determine dynamic greeting berdasarkan jam local
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) return;
    setIsSubmitting(true);
    try {
      await onRecordMood(selectedMood, intensity, note);
      setSelectedMood(null);
      setNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const moodConfig: { [key in MoodType]: { emoji: string; label: string; color: string; bg: string; text: string; description: string } } = {
    happy: { emoji: '😄', label: 'Happy', color: 'from-amber-400 to-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700', description: 'Energetic, optimistic and balanced' },
    neutral: { emoji: '😐', label: 'Neutral', color: 'from-slate-400 to-slate-500', bg: 'bg-slate-50', text: 'text-slate-700', description: 'Calm, passive and grounded' },
    sad: { emoji: '😔', label: 'Sad', color: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50', text: 'text-blue-700', description: 'Reflective, heavy or contemplative' },
    angry: { emoji: '😡', label: 'Angry', color: 'from-rose-500 to-orange-600', bg: 'bg-rose-50', text: 'text-rose-700', description: 'Irritated, tensed or reactive' },
    tired: { emoji: '😴', label: 'Tired', color: 'from-purple-400 to-violet-500', bg: 'bg-purple-50', text: 'text-purple-700', description: 'Exhausted, low battery or sleepy' },
  };

  return (
    <div className="space-y-8" id="dashboard-tab">
      {/* Dynamic Greetings Panel */}
      <div 
        className="p-8 rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 text-white relative overflow-hidden shadow-lg shadow-violet-100"
        id="greeting-panel"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-400/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 right-20 w-44 h-44 bg-teal-400/15 rounded-full blur-2xl"></div>
        
        <div className="relative z-5">
          <span className="text-xs font-sans font-bold bg-white/20 text-white px-3 py-1 rounded-full uppercase tracking-wider">
            Mental Wellness Space
          </span>
          <h1 className="font-sans font-extrabold text-3xl md:text-4xl tracking-tight mt-3">
            {getGreeting()}, {user.name} 👋
          </h1>
          <p className="font-sans text-violet-100 mt-2 max-w-xl text-sm leading-relaxed">
            Your current consecutive mood tracking streak of <strong className="text-amber-300 font-bold">{user.moodStreak || 0} active days</strong> represents remarkable perseverance. Inhale peace, exhale tension.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-6">
            <button
              onClick={() => onNavigate('meditation')}
              id="dash-breath-btn"
              className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-slate-50 rounded-xl font-sans font-semibold text-xs tracking-wide shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-4 h-4" /> Start Breathing Guide
            </button>
            <button
              onClick={() => onNavigate('chat')}
              id="dash-chat-btn"
              className="px-5 py-2.5 bg-indigo-500/30 text-white hover:bg-indigo-500/50 border border-white/20 rounded-xl font-sans font-medium text-xs tracking-wide transition flex items-center gap-1.5 cursor-pointer"
            >
              <Brain className="w-4 h-4" /> Speak with AI Guide
            </button>
          </div>
        </div>
      </div>

      {/* Main Column Layout */}
      <div className="grid lg:grid-cols-12 gap-8" id="dashboard-contents">
        
        {/* Inside: Mood logger & Fuzzy search option on the left */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* DYNAMIC FUZZY SEARCH OPTION */}
          <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs" id="dashboard-search-container">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-indigo-605" />
              <h2 className="font-sans font-bold text-[#111827] text-md">Search Past Reflections & Mood Notes</h2>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Type keywords (e.g. 'coffee', 'meditation', 'happy') to search history..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl font-sans text-xs focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
              />
              <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
            </div>

            {searchQuery.trim() && (
              <div className="mt-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/90 divide-y divide-slate-100 max-h-60 overflow-y-auto shadow-inner" id="search-results-viewport">
                {isSearching ? (
                  <span className="block text-center text-xs text-slate-400 py-3 font-sans">Scanning emotional records...</span>
                ) : (!searchResults || (searchResults.journals.length === 0 && searchResults.moods.length === 0)) ? (
                  <span className="block text-center text-xs text-slate-400 py-3 font-sans">No matching entries found. Try a different keyword.</span>
                ) : (
                  <div className="space-y-4 pt-1">
                    {/* Journals Section */}
                    {searchResults.journals.length > 0 && (
                      <div className="space-y-2 animate-fade-in">
                        <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-widest">Journal Entries ({searchResults.journals.length})</span>
                        {searchResults.journals.map((j, idx) => (
                          <div key={idx} className="p-3 bg-white rounded-xl border border-slate-100 flex flex-col space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-405">
                              <span className="font-bold text-indigo-500">Tag: {j.moodTag}</span>
                              <span>{new Date(j.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-[#334155] leading-relaxed font-sans">{j.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Moods Section */}
                    {searchResults.moods.length > 0 && (
                      <div className="space-y-2 pt-2 animate-fade-in">
                        <span className="text-[9px] font-mono font-bold text-amber-600 uppercase tracking-widest">Mood Triggers ({searchResults.moods.length})</span>
                        {searchResults.moods.map((m, idx) => (
                          <div key={idx} className="p-3 bg-white rounded-xl border border-slate-100 flex flex-col space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-405">
                              <span className="font-bold text-amber-500 capitalize">{m.moodType} (Intensity: {m.intensity}/5)</span>
                              <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                            </div>
                            {m.note && <p className="text-xs text-[#334155] leading-relaxed font-sans">{m.note}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs" id="mood-selector-container">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-sans font-bold text-lg text-slate-800">
                  How are you feeling right now?
                </h2>
                <p className="text-xs font-sans text-slate-400">Record to receive instant supportive AI validation</p>
              </div>
              <Smile className="w-6 h-6 text-violet-600" />
            </div>

            {todayMood ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center" id="mood-logged-today">
                <span className="text-5xl block animate-bounce" role="img" aria-label={todayMood.moodType}>
                  {moodConfig[todayMood.moodType]?.emoji || '🔮'}
                </span>
                <h3 className="font-sans font-bold text-lg text-slate-800 mt-3 capitalize">
                  Today's mood is set to {todayMood.moodType}!
                </h3>
                <span className="inline-block mt-2 text-xs font-mono font-semibold bg-violet-100 text-violet-700 px-3 py-1 rounded-full">
                  Mood Intensity Level: {todayMood.intensity}/5
                </span>
                {todayMood.note ? (
                  <p className="font-sans text-sm text-slate-500 italic mt-3 bg-white p-3 rounded-xl border border-slate-100/80">
                    &ldquo;{todayMood.note}&rdquo;
                  </p>
                ) : (
                  <p className="font-sans text-xs text-slate-400 mt-2">No personal note provided for today.</p>
                )}
                
                <p className="text-xs font-sans text-slate-400 mt-4 leading-relaxed">
                  Excellent work recording your emotional state! You can add further specific notes via the daily text journal workspace.
                </p>
              </div>
            ) : (
              <form onSubmit={handleMoodSubmit} className="space-y-6" id="mood-selector-form">
                {/* 5 Emojis Circle */}
                <div className="grid grid-cols-5 gap-3" id="emoji-group-selectors">
                  {(Object.keys(moodConfig) as MoodType[]).map((mtype) => {
                    const cfg = moodConfig[mtype];
                    const isSelected = selectedMood === mtype;
                    return (
                      <button
                        key={mtype}
                        type="button"
                        onClick={() => setSelectedMood(mtype)}
                        id={`btn-mood-${mtype}`}
                        className={`flex flex-col items-center p-3 rounded-2xl border transition duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-violet-600 bg-violet-50/70 scale-105 shadow-xs'
                            : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-3xl" role="img" aria-label={mtype}>
                          {cfg.emoji}
                        </span>
                        <span className="text-xs font-sans font-bold text-slate-700 mt-1.5 block">
                          {cfg.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedMood && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wider block">
                          Intensity Scale
                        </span>
                        <span className="text-xs font-sans font-bold text-violet-700">
                          {intensity === 1 ? 'Very Subdued' : intensity === 2 ? 'Subtle' : intensity === 3 ? 'Moderate' : intensity === 4 ? 'Intense' : 'Overbearing'} ({intensity}/5)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={intensity}
                        onChange={(e) => setIntensity(Number(e.target.value))}
                        id="intensity-range"
                        className="w-full accent-violet-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        What trigger explains this feeling? (Optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Cleared my morning checklist, had hot tea, enjoyed quiet meditation..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        id="mood-trigger-note-input"
                        className="w-full p-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl text-slate-700 text-sm focus:outline-hidden focus:border-violet-500 focus:bg-white transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      id="save-mood-log-btn"
                      className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 text-xs font-sans font-bold rounded-xl tracking-wider uppercase shadow-xs transition"
                    >
                      {isSubmitting ? 'Recording...' : 'Update Daily Mood State'}
                    </button>
                  </motion.div>
                )}
              </form>
            )}
          </div>

          {/* Daily Checklist */}
          <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs animate-fade-in" id="daily-checklist-container">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-sans font-bold text-lg text-slate-800">Daily Wellness Checklist</h2>
                <p className="text-xs font-sans text-slate-400">Complete tasks to establish micro-habit loops</p>
              </div>
              <span className="text-xs font-mono font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
                {Object.values(checklist).filter(Boolean).length}/4 Done
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
              <div 
                className="bg-gradient-to-r from-violet-500 to-indigo-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(Object.values(checklist).filter(Boolean).length / 4) * 100}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="checklist-items-grid">
              <button
                type="button"
                onClick={() => toggleChecklistItem('logMood')}
                id="chk-item-mood"
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                  checklist.logMood ? 'bg-violet-50/40 border-violet-200 text-violet-800' : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={checklist.logMood} 
                  readOnly 
                  className="rounded-xs accent-violet-600 cursor-pointer pointer-events-none"
                />
                <span className="text-xs font-sans font-semibold">Log Daily Mood State</span>
              </button>

              <button
                type="button"
                onClick={() => toggleChecklistItem('doBreathing')}
                id="chk-item-breathing"
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                  checklist.doBreathing ? 'bg-violet-50/40 border-violet-200 text-violet-800' : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={checklist.doBreathing} 
                  readOnly 
                  className="rounded-xs accent-violet-600 cursor-pointer pointer-events-none"
                />
                <span className="text-xs font-sans font-semibold">Complete Breathing Cycle</span>
              </button>

              <button
                type="button"
                onClick={() => toggleChecklistItem('chatAI')}
                id="chk-item-chatai"
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                  checklist.chatAI ? 'bg-violet-50/40 border-violet-200 text-violet-800' : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={checklist.chatAI} 
                  readOnly 
                  className="rounded-xs accent-violet-600 cursor-pointer pointer-events-none"
                />
                <span className="text-xs font-sans font-semibold">Chat with AI Guide</span>
              </button>

              <button
                type="button"
                onClick={() => toggleChecklistItem('writeJournal')}
                id="chk-item-journal"
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                  checklist.writeJournal ? 'bg-violet-50/40 border-violet-200 text-violet-800' : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={checklist.writeJournal} 
                  readOnly 
                  className="rounded-xs accent-violet-600 cursor-pointer pointer-events-none"
                />
                <span className="text-xs font-sans font-semibold">Write Self-Reflection</span>
              </button>
            </div>
          </div>
          {/* Quick Actions Panel */}
          <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs" id="quick-actions-panel">
            <h2 className="font-sans font-bold text-lg text-slate-800 mb-4">Wellness Core Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="dashboard-actions-grid">
              
              <button
                onClick={() => onNavigate('chat')}
                id="qa-btn-chat"
                className="p-4 bg-violet-50/50 hover:bg-violet-50 border border-violet-100/50 text-left rounded-2xl group transition cursor-pointer"
              >
                <div className="w-10 h-10 bg-violet-100 text-violet-700 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="font-sans font-bold text-slate-800 text-sm">Empathetic Chat</h3>
                <p className="text-[11px] font-sans text-slate-400 mt-1 group-hover:text-slate-600 transition">Speak feelings with Mind Mood AI companion</p>
                <span className="text-xs text-violet-600 font-bold group-hover:translate-x-1 inline-flex items-center gap-0.5 mt-3 transition-transform">
                  Reflect →
                </span>
              </button>

              <button
                onClick={() => onNavigate('journal')}
                id="qa-btn-journal"
                className="p-4 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/50 text-left rounded-2xl group transition cursor-pointer"
              >
                <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-sans font-bold text-slate-800 text-sm">Write Journal</h3>
                <p className="text-[11px] font-sans text-slate-400 mt-1 group-hover:text-slate-600 transition">Reflect on events and extract sentiment tags</p>
                <span className="text-xs text-indigo-600 font-bold group-hover:translate-x-1 inline-flex items-center gap-0.5 mt-3 transition-transform">
                  Explore →
                </span>
              </button>

              <button
                onClick={() => onNavigate('meditation')}
                id="qa-btn-meditate"
                className="p-4 bg-teal-50/50 hover:bg-teal-50 border border-teal-100/50 text-left rounded-2xl group transition cursor-pointer"
              >
                <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center mb-4">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="font-sans font-bold text-slate-800 text-sm">Mindful Breath</h3>
                <p className="text-[11px] font-sans text-slate-400 mt-1 group-hover:text-slate-600 transition">Interactive loops to quickly reduce daily anxiety</p>
                <span className="text-xs text-teal-600 font-bold group-hover:translate-x-1 inline-flex items-center gap-0.5 mt-3 transition-transform">
                  Inhale →
                </span>
              </button>

            </div>
          </div>
        </div>

        {/* AI Insight Summary Panel on the right */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl relative overflow-hidden shadow-md" id="ai-mood-summary-card">
            {/* Visual background star */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-600/30 rounded-full blur-2xl"></div>
            
            <div className="relative">
              <div className="flex items-center gap-2 text-violet-300 font-sans font-semibold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-violet-300 animate-pulse" />
                Gemini State Synthesizer
              </div>

              <h3 className="font-sans font-extrabold text-xl text-white mt-4">
                Today's Emotional Analysis
              </h3>

              {todayMood ? (
                <div className="mt-4 space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[11px] font-mono text-violet-300 font-semibold block uppercase">AI Observation</span>
                    <p className="font-sans text-sm text-slate-200 mt-1.5 leading-relaxed">
                      {todayMood.moodType === 'happy' && "You are carrying a supportive, radiant energy today. Utilizing this moment for high-priority productivity is recommended!"}
                      {todayMood.moodType === 'neutral' && "You seem emotionally objective and in stable equilibrium. This is an ideal state to explore creative studies and read quietly."}
                      {todayMood.moodType === 'sad' && "You are carrying a reflective, heavy emotional frequency today. Treat yourself with soft kindness. Inhale peace."}
                      {todayMood.moodType === 'angry' && "Emotional tension levels are elevated. Try to practice our structured 2-minute breathing meditation to re-center."}
                      {todayMood.moodType === 'tired' && "Your nervous system requires deep, uninterrupted recovery. Avoid screens tonight and aim for gentle rest."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-mono text-violet-300 font-semibold block uppercase">Supportive Recommendation</span>
                    <ul className="text-xs font-sans text-slate-300 space-y-1.5 list-disc pl-4">
                      {todayMood.moodType === 'happy' && (
                        <>
                          <li>Share your optimism with a friend or write it down.</li>
                          <li>Engage in tasks requiring critical planning.</li>
                        </>
                      )}
                      {todayMood.moodType === 'neutral' && (
                        <>
                          <li>Engage in reading or logic-focused projects.</li>
                          <li>Take a gentle walk around silent environments.</li>
                        </>
                      )}
                      {todayMood.moodType === 'sad' && (
                        <>
                          <li>Wrap yourself in physical comfort or grab hot tea.</li>
                          <li>Play soft ambient or therapeutic acoustic waves.</li>
                        </>
                      )}
                      {todayMood.moodType === 'angry' && (
                        <>
                          <li>Perform a slow 4-7-8 breathing loop immediately.</li>
                          <li>Write down key angry thoughts on paper and shred them.</li>
                        </>
                      )}
                      {todayMood.moodType === 'tired' && (
                        <>
                          <li>Stay hydrated and restrict task volume today.</li>
                          <li>Rest your eyes 10 minutes in absolute dark.</li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Recorded using Mind Mood logs</span>
                    <button
                      onClick={() => onNavigate('analytics')}
                      id="view-report-dash-btn"
                      className="text-violet-300 font-bold hover:underline"
                    >
                      View Trend Insights →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 text-center py-6">
                  <p className="font-sans text-sm text-slate-300 leading-relaxed">
                    "Emotions represent messengers of the mind."
                  </p>
                  <p className="font-sans text-xs text-indigo-300 mt-2">
                    Please log your active mood today to generate a custom psychological evaluation and tangible coping exercises.
                  </p>
                  <div className="h-0.5 bg-white/10 my-6"></div>
                  <span className="text-xs font-mono text-[#9bb0ff]">WAITING ON USER MOOD INPUT</span>
                </div>
              )}
            </div>
          </div>

          {/* Inspirational Prompt Card */}
          <div className="p-6 bg-rose-50/50 border border-rose-100 rounded-3xl" id="daily-inspirational-card">
            <span className="text-[10px] font-mono font-bold text-rose-500 uppercase tracking-wider block">Empathetic Affirmation</span>
            <p className="font-sans text-sm text-rose-800 italic mt-2 leading-relaxed">
              &ldquo;{dailyQuote.text}&rdquo;
            </p>
            <span className="block mt-2 text-xs font-sans text-rose-500 font-semibold">— {dailyQuote.author}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
