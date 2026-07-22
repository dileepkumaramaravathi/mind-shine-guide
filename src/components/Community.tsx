/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Share2, Heart, Sparkles, Smile, Volume2, Search, Send } from 'lucide-react';
import { CommunityItem } from '../types';

interface CommunityProps {
  token: string;
}

export default function Community({ token }: CommunityProps) {
  const [posts, setPosts] = useState<CommunityItem[]>([]);
  const [text, setText] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedGradient, setSelectedGradient] = useState('from-indigo-600 to-violet-600');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  // Audio synthetically generated on simple text affirmation read out loud to relax
  const handleReadAloud = (message: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.pitch = 1.1;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/community', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/community/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          authorName: nickname.trim() || 'Anonymous Friend',
          text: text.trim(),
          bgGradient: selectedGradient,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPosts((prev) => [data.post, ...prev]);
        setText('');
        setNickname('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (id: string) => {
    try {
      const res = await fetch(`/api/community/like/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, likes: data.post.likes } : p))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const gradients = [
    { class: 'from-indigo-600 to-violet-600', name: 'Calm Twilight' },
    { class: 'from-rose-500 to-orange-500', name: 'Warm Sunrise' },
    { class: 'from-emerald-500 to-teal-600', name: 'Zen Forest' },
    { class: 'from-sky-500 to-indigo-500', name: 'Deep Sea Breeze' },
    { class: 'from-pink-500 to-rose-600', name: 'Supportive Rosè' },
  ];

  // Filtering posts by keyword search
  const filteredPosts = posts.filter(
    (p) =>
      p.text.toLowerCase().includes(searchVal.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in" id="community-tab">
      
      {/* Upper info card */}
      <div className="p-8 bg-gradient-to-br from-violet-900 to-slate-900 text-white rounded-3xl relative overflow-hidden" id="community-intro">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full blur-2xl"></div>
        <div className="relative z-5">
          <span className="px-3 py-1 bg-violet-600/50 border border-violet-400/30 text-white text-[10px] font-sans font-bold uppercase tracking-wider rounded-full">
            Human Connection Portal
          </span>
          <h1 className="font-sans font-extrabold text-2xl md:text-3xl mt-3 tracking-tight">
            Community Support Plaza 🌍
          </h1>
          <p className="text-slate-300 text-xs mt-2 max-w-2xl leading-relaxed">
            Welcome to a completely safe and anonymous space. Real people, shares, and affirmations. 
            Write supportive letters, share daily highlights, and read othersout loud. Together, we find calm.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8" id="community-layout-grid">
        
        {/* Left Side: Create an Affirmation (5 cols) */}
        <div className="lg:col-span-5" id="community-compose-panel">
          <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-5">
            <div>
              <h2 className="font-sans font-bold text-slate-800 text-sm">Post a Supportive Affirmation</h2>
              <p className="text-[11px] font-sans text-slate-400">Your note will immediately appear in the safe plaza.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Display Alias / Nickname
                </label>
                <input
                  type="text"
                  maxLength={25}
                  placeholder="e.g. PeacefulMind, KindLotus, or leave blank to stay Anonymous"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/55 border border-slate-200/80 rounded-xl font-sans text-xs focus:outline-hidden focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Your Supportive Words
                </label>
                <textarea
                  rows={4}
                  required
                  maxLength={280}
                  placeholder="e.g. 'To whoever is reading this, remember you have fought through 100% of your hardest days. Take it easy on yourself today...'"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full p-4 bg-slate-50/55 border border-slate-200/80 rounded-2xl font-sans text-xs focus:outline-hidden focus:border-violet-500 focus:bg-white transition leading-relaxed"
                />
                <span className="block text-right text-[10px] text-slate-400 mt-1">
                  {text.length}/280 characters
                </span>
              </div>

              <div>
                <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                  Choose Aesthetic Background Card Style
                </label>
                <div className="grid grid-cols-5 gap-2" id="gradient-picker">
                  {gradients.map((grad, i) => (
                    <button
                      key={i}
                      type="button"
                      title={grad.name}
                      onClick={() => setSelectedGradient(grad.class)}
                      className={`h-8 rounded-xl bg-gradient-to-br ${grad.class} transition relative cursor-pointer border ${
                        selectedGradient === grad.class ? 'border-slate-900 ring-2 ring-violet-500/40 ring-offset-1 scale-105' : 'border-transparent'
                      }`}
                    ></button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !text.trim()}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Sharing safely...' : 'Share Word Card'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Feed of Affirmations (7 cols) */}
        <div className="lg:col-span-7 space-y-4" id="community-timeline-panel">
          
          {/* Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between gap-4 shadow-3xs">
            <div className="flex-1 relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="text"
                placeholder="Search affirmations or member aliases..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50/80 border border-slate-100 rounded-xl font-sans text-xs focus:outline-hidden focus:border-violet-500 focus:bg-white transition"
              />
            </div>
            <div className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider shrink-0 hidden sm:block">
              {filteredPosts.length} posts listed
            </div>
          </div>

          {/* Scrolling Feed layout */}
          <div className="space-y-4 max-h-[calc(100vh-18rem)] overflow-y-auto pr-1" id="affirmations-scroll">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <span className="w-8 h-8 border-3 border-violet-500/20 border-t-violet-600 rounded-full animate-spin"></span>
                <span className="text-xs font-sans mt-3">Connecting to support plaza feeds...</span>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white border border-slate-100 p-12 rounded-3xl text-center text-slate-400 space-y-3 shadow-3xs">
                <div className="text-3xl">🕊️</div>
                <h3 className="font-sans font-bold text-slate-700">Plaza is serene</h3>
                <p className="font-sans text-xs max-w-sm mx-auto leading-relaxed">No matching supportive affirmation cards found. Be the first to share positive energy using the compiler on the left.</p>
              </div>
            ) : (
              filteredPosts.map((post) => {
                const likedByUser = post.likes && post.likes.length > 0;
                return (
                  <motion.div
                    key={post.id}
                    layoutId={`post-${post.id}`}
                    className={`p-6 rounded-3xl bg-gradient-to-br ${post.bgGradient} text-white shadow-sm flex flex-col justify-between h-48 relative overflow-hidden transition hover:-translate-y-0.5 group`}
                    id={`community-card-${post.id}`}
                  >
                    {/* Tiny star sparkle embellishment */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl translate-x-4 -translate-y-4"></div>
                    
                    {/* Top Section Actions: Read-aloud & copy */}
                    <div className="flex items-start justify-between relative z-5">
                      <div className="flex items-center gap-1 text-white/70 font-sans font-medium text-[10px] uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 animate-pulse text-yellow-300" />
                        Card Affirmation
                      </div>
                      
                      <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                        <button
                          onClick={() => handleReadAloud(post.text)}
                          title="Relax and read out loud"
                          className="p-1 hover:bg-white/20 text-white/80 rounded-md transition cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Middle: affirmation message text */}
                    <div className="my-3 relative z-5 pr-4 flex-1 flex items-center">
                      <p className="font-sans font-medium text-xs sm:text-sm tracking-wide leading-relaxed line-clamp-3">
                        &ldquo;{post.text}&rdquo;
                      </p>
                    </div>

                    {/* Bottom panel: Author nickname & Like counters */}
                    <div className="pt-2 border-t border-white/10 flex justify-between items-center relative z-5">
                      <div>
                        <span className="block text-[8px] uppercase font-mono tracking-widest text-white/60">Contributed by</span>
                        <span className="block font-sans font-bold text-xs text-amber-200">
                          @{post.authorName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-sans font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                            likedByUser
                              ? 'bg-rose-500 text-white border-rose-400'
                              : 'bg-white/10 hover:bg-white/25 text-white border-white/10'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${likedByUser ? 'fill-white text-rose-100 animate-pulse' : ''}`} />
                          <span>{post.likes ? post.likes.length : 0}</span>
                        </button>
                      </div>
                    </div>

                  </motion.div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
