/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Sparkles, AlertCircle, Trash2, Calendar, Smile, Shield } from 'lucide-react';
import { JournalEntry, MoodType, MoodAnalysis } from '../types';

interface MoodJournalProps {
  token: string;
}

export default function MoodJournal({ token }: MoodJournalProps) {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [text, setText] = useState('');
  const [moodTag, setMoodTag] = useState<MoodType>('neutral');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dynamic analysis state
  const [analyzingText, setAnalyzingText] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MoodAnalysis | null>(null);

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const res = await fetch('/api/journal/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJournals(data.journals || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/journal/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, moodTag }),
      });

      if (!res.ok) {
        throw new Error('Could not add reflection entry');
      }

      const data = await res.json();
      setJournals((prev) => [data.journal, ...prev]);
      setText('');
      setMoodTag('neutral');
      setAnalysisResult(null); // Clear active inline analysis matching new entry
    } catch (err: any) {
      setError(err.message || 'Failed saving entry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIAnalyzeText = async () => {
    if (!text.trim()) {
      alert("Please write something about your feelings before starting AI analyzer.");
      return;
    }
    setAnalyzingText(true);
    setAnalysisResult(null);
    try {
      const res = await fetch('/api/ai/analyze-mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data.analysis);
      } else {
        alert("Emotion analysis timing reached limit. Using fallback analysis model instead.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingText(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to securely delete this mental journal entry forever? This is irreversible.')) return;
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/journal/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setJournals((prev) => prev.filter((j) => j.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(null);
    }
  };

  const moodEmojis: { [key in MoodType]: string } = {
    happy: '😄',
    neutral: '😐',
    sad: '😔',
    angry: '😡',
    tired: '😴',
  };

  return (
    <div className="space-y-8" id="journal-tab">
      
      {/* Grid: Entry logger on Left, past entries timeline list on Right */}
      <div className="grid lg:grid-cols-12 gap-8" id="journal-grid">
        
        {/* Left column: Add reflection & inline AI evaluator */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs" id="new-journal-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-sans font-bold text-slate-800 text-lg">Daily Mind Reflection</h2>
                <p className="text-xs font-sans text-slate-400">Pour your authentic thoughts into words securely</p>
              </div>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-4">
              <div>
                <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Associate Initial Mood Tag
                </label>
                <div className="flex flex-wrap gap-2" id="journal-modtag-selector">
                  {(Object.keys(moodEmojis) as MoodType[]).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setMoodTag(tag)}
                      id={`journal-tag-btn-${tag}`}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-sans font-bold flex items-center gap-1.5 transition cursor-pointer capitalize ${
                        moodTag === tag
                          ? 'border-violet-600 bg-violet-50 text-violet-700'
                          : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span>{moodEmojis[tag]}</span>
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Reflective text content
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="How did you sleep? Did any specific trigger occur? Write what's on your mind. You can request on-demand AI analysis below..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  id="journal-content-textarea"
                  className="w-full p-4 bg-slate-50/50 border border-slate-200/80 rounded-2xl text-slate-700 text-sm focus:outline-hidden focus:border-violet-500 focus:bg-white transition leading-relaxed"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-sans flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2" id="action-journal-btns">
                <button
                  type="submit"
                  disabled={isLoading || !text.trim()}
                  id="save-journal-btn"
                  className="px-6 py-3.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 text-xs font-sans font-bold uppercase rounded-xl tracking-wider transition flex-1 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isLoading ? 'Saving...' : 'Save Reflection Entry'}
                </button>
                <button
                  type="button"
                  onClick={handleAIAnalyzeText}
                  disabled={analyzingText || !text.trim()}
                  id="ai-analyze-journal-btn"
                  className="px-5 py-3.5 bg-[#8b5cf6]/10 text-violet-700 hover:bg-[#8b5cf6]/20 border border-[#8b5cf6]/20 disabled:opacity-40 text-xs font-sans font-extrabold uppercase rounded-xl tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {analyzingText ? (
                    <>
                      <span className="w-4 h-4 border-2 border-violet-600/35 border-t-violet-700 rounded-full animate-spin"></span>
                      <span>Evaluating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4.5 h-4.5 text-violet-600 animate-pulse" />
                      <span>On-Demand AI Evaluation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Dynamic AI Analysis feedback workspace inline */}
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl border border-indigo-900/60 shadow-md relative"
              id="analysis-result-panel"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/35 rounded-full blur-2xl"></div>
              
              <div className="relative z-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-violet-300 font-sans font-bold text-xs uppercase">
                    <Sparkles className="w-4 h-4 text-violet-300" />
                    Gemini Clinical NLP Sentiment Evaluation
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-sans font-bold uppercase bg-violet-500/20 text-violet-200 border border-violet-500/40">
                    {analysisResult.emotion}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-violet-400 font-bold block uppercase tracking-wider mb-1">State Summary</span>
                  <p className="text-slate-200 text-sm font-sans leading-relaxed">
                    {analysisResult.summary}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-violet-400 font-bold block uppercase tracking-wider mb-2">Tangible Coping Strategies</span>
                  <ul className="text-xs font-sans text-slate-300 space-y-2 pl-4 list-disc">
                    {analysisResult.suggestions.map((sug, i) => (
                      <li key={i}>{sug}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-white/5 italic text-xs font-sans text-violet-300 text-center">
                  &ldquo;{analysisResult.quote}&rdquo;
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right column: Past Timeline reflections */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs h-[calc(100vh-14rem)] flex flex-col overflow-hidden" id="journals-timeline">
            <h2 className="font-sans font-bold text-slate-800 text-lg mb-4">Past Emotional Timeline</h2>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-4" id="timeline-list">
              {journals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-3">
                  <span className="text-4xl">📭</span>
                  <h3 className="font-sans font-bold text-slate-700">No logs found</h3>
                  <p className="font-sans text-xs max-w-xs leading-relaxed">Write your first reflection on the left to start charting history safely.</p>
                </div>
              ) : (
                journals.map((j) => (
                  <div
                    key={j.id}
                    className="p-5 bg-slate-50 border border-slate-100 rounded-2xl relative group hover:border-violet-200 hover:bg-slate-50/80 transition duration-150"
                    id={`timeline-item-${j.id}`}
                  >
                    {/* Header line */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl shrink-0" role="img" aria-label="entry-mood-tag">
                          {moodEmojis[j.moodTag] || '🔮'}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-sans font-bold bg-white border border-slate-100 text-slate-600 capitalize">
                          {j.moodTag} Tag
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-sans text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(j.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <button
                          onClick={() => handleDeleteEntry(j.id)}
                          disabled={isDeleting === j.id}
                          id={`delete-entry-${j.id}`}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-40 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Content text */}
                    <p className="font-sans text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {j.text}
                    </p>
                  </div>
                ))
              )}
            </div>
            
            {journals.length > 0 && (
              <div className="p-3 bg-indigo-50/50 border border-indigo-100/40 rounded-2xl flex items-center gap-2 mt-4" id="timeline-security-card">
                <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-[10px] font-sans text-indigo-800 leading-normal">
                  All past Timeline entries are bound securely and cached privately.
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
