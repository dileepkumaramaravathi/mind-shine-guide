/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Volume2, Search, Send, RefreshCw, Users, MessageCircle, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { CommunityItem } from '../types';

interface CommunityProps {
  token: string;
}

interface Comment {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
}

interface PostWithComments extends CommunityItem {
  comments?: Comment[];
}

export default function Community({ token }: CommunityProps) {
  const [posts, setPosts] = useState<PostWithComments[]>([]);
  const [text, setText] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedGradient, setSelectedGradient] = useState('from-indigo-600 to-violet-600');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<{ [id: string]: string }>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // In-memory comments store (persists during session, shared via server)
  const commentsRef = useRef<{ [postId: string]: Comment[] }>({});

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleReadAloud = (message: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.pitch = 1.05;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const res = await fetch('/api/community', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const incoming: CommunityItem[] = data.posts || [];
        // Merge with existing comments in memory
        const withComments: PostWithComments[] = incoming.map(p => ({
          ...p,
          comments: commentsRef.current[p.id] || [],
        }));
        setPosts(withComments);
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
        const newPost: PostWithComments = { ...data.post, comments: [] };
        setPosts(prev => [newPost, ...prev]);
        setText('');
        setNickname('');
        showSuccess('✨ Your affirmation is now visible to all members!');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to share. Please try again.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (id: string) => {
    // Optimistic UI update first - never crash on this action
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const liked = (p.likes || []).includes('current-user');
        return {
          ...p,
          likes: liked
            ? (p.likes || []).filter(l => l !== 'current-user')
            : [...(p.likes || []), 'current-user'],
        };
      })
    );

    try {
      const res = await fetch(`/api/community/like/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Accept either data.post.likes or data.likes
        const updatedLikes = data.likes || data.post?.likes || null;
        if (updatedLikes !== null) {
          setPosts(prev =>
            prev.map(p => (p.id === id ? { ...p, likes: updatedLikes } : p))
          );
        }
      }
      // If not ok, the optimistic update stays - that's fine
    } catch (e) {
      console.warn('Like request failed (optimistic update kept):', e);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const handleAddComment = async (postId: string) => {
    const commentText = (commentInputs[postId] || '').trim();
    if (!commentText) return;
    
    const authorName = nickname.trim() || 'Anonymous Friend';
    setSubmittingComment(postId);
    
    // First try server endpoint
    let savedComment: Comment | null = null;
    try {
      const res = await fetch(`/api/community/reply/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ authorName, text: commentText }),
      });
      if (res.ok) {
        const data = await res.json();
        savedComment = data.reply;
      }
    } catch (e) { /* ignore, use local */ }

    // Always add locally as well
    if (!savedComment) {
      savedComment = {
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        authorName,
        text: commentText,
        createdAt: new Date().toISOString(),
      };
    }

    // Store in memory ref
    if (!commentsRef.current[postId]) commentsRef.current[postId] = [];
    commentsRef.current[postId].push(savedComment);

    // Update state
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, comments: [...(p.comments || []), savedComment!] }
          : p
      )
    );
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setSubmittingComment(null);
  };

  const gradients = [
    { class: 'from-indigo-600 to-violet-600', name: 'Calm Twilight' },
    { class: 'from-rose-500 to-orange-500', name: 'Warm Sunrise' },
    { class: 'from-emerald-500 to-teal-600', name: 'Zen Forest' },
    { class: 'from-sky-500 to-indigo-500', name: 'Deep Sea Breeze' },
    { class: 'from-pink-500 to-rose-600', name: 'Supportive Rose' },
  ];

  const filteredPosts = posts.filter(
    p =>
      p.text.toLowerCase().includes(searchVal.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchVal.toLowerCase())
  );

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="community-tab">

      {/* Header */}
      <div className="p-8 bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 text-white rounded-3xl relative overflow-hidden" id="community-intro">
        <div className="absolute top-0 right-0 w-72 h-72 bg-violet-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-8 left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-5">
          <span className="px-3 py-1 bg-violet-600/50 border border-violet-400/30 text-white text-[10px] font-sans font-bold uppercase tracking-wider rounded-full">
            Human Connection Portal
          </span>
          <h1 className="font-sans font-extrabold text-2xl md:text-3xl mt-3 tracking-tight">
            Community Support Plaza 🌍
          </h1>
          <p className="text-slate-300 text-xs mt-2 max-w-2xl leading-relaxed">
            A completely safe and anonymous space. Share affirmations, comment on others' posts, and support each other. All posts are permanent — delete only when you choose.
          </p>
          <div className="flex items-center gap-5 mt-4">
            <div className="flex items-center gap-1.5 text-violet-300 text-xs font-sans">
              <Users className="w-3.5 h-3.5" />
              <span>{posts.length} affirmation{posts.length !== 1 ? 's' : ''} shared</span>
            </div>
            <div className="flex items-center gap-1.5 text-violet-300 text-[10px] font-sans">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{posts.reduce((a, p) => a + (p.comments?.length || 0), 0)} comments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success flash */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-600 text-white px-4 py-3 rounded-2xl text-xs font-sans font-bold flex items-center gap-2"
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-12 gap-6" id="community-layout-grid">

        {/* === LEFT PANEL: Post Compose === */}
        <div className="lg:col-span-4" id="community-compose-panel">
          <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-5 sticky top-6">
            <div>
              <h2 className="font-sans font-bold text-slate-800 text-sm">Share an Affirmation</h2>
              <p className="text-[11px] font-sans text-slate-400 mt-0.5">Your post will be visible to all members instantly.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" id="community-post-form">
              <div>
                <label className="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest mb-1.5">Your Alias / Name</label>
                <input
                  type="text"
                  maxLength={25}
                  placeholder="PeacefulMind, KindSoul, or leave blank"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs focus:outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest mb-1.5">Your Supportive Words</label>
                <textarea
                  rows={5}
                  required
                  maxLength={280}
                  id="community-text-input"
                  placeholder="'To whoever is reading this — you are stronger than you think. Take it one breath at a time...'"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-sans text-xs focus:outline-none focus:border-violet-500 focus:bg-white transition leading-relaxed resize-none"
                />
                <span className="block text-right text-[10px] text-slate-400 mt-1">{text.length}/280</span>
              </div>

              <div>
                <label className="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest mb-2">Card Color</label>
                <div className="flex gap-2">
                  {gradients.map((grad, i) => (
                    <button
                      key={i}
                      type="button"
                      title={grad.name}
                      onClick={() => setSelectedGradient(grad.class)}
                      className={`flex-1 h-7 rounded-lg bg-gradient-to-br ${grad.class} transition border-2 ${selectedGradient === grad.class ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              {text.trim() && (
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${selectedGradient} text-white overflow-hidden relative`}>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
                  <p className="text-xs font-sans leading-relaxed line-clamp-2 relative z-5">"{text}"</p>
                  <span className="text-[9px] font-mono text-white/60 mt-1.5 block relative z-5">— @{nickname || 'Anonymous Friend'}</span>
                </div>
              )}

              <button
                type="submit"
                id="submit-community-post-btn"
                disabled={isSubmitting || !text.trim()}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-violet-200"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Sharing...' : 'Share Word Card'}
              </button>
            </form>
          </div>
        </div>

        {/* === RIGHT PANEL: Social Feed === */}
        <div className="lg:col-span-8 space-y-4" id="community-timeline-panel">

          {/* Search + Refresh bar */}
          <div className="p-3 bg-white rounded-2xl border border-slate-100 flex items-center gap-3">
            <div className="flex-1 relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="text"
                placeholder="Search posts or members..."
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-sans text-xs focus:outline-none focus:border-violet-500 focus:bg-white transition"
              />
            </div>
            <button
              onClick={() => fetchPosts(false)}
              title="Refresh posts"
              className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold shrink-0">
              {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Feed */}
          <div className="space-y-5" id="affirmations-feed">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <span className="w-8 h-8 border-3 border-violet-500/20 border-t-violet-600 rounded-full animate-spin"></span>
                <span className="text-xs font-sans mt-3">Loading community feed...</span>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white border border-slate-100 p-16 rounded-3xl text-center text-slate-400 space-y-3">
                <div className="text-4xl">🕊️</div>
                <h3 className="font-sans font-bold text-slate-700 text-base">Plaza is serene</h3>
                <p className="font-sans text-xs max-w-sm mx-auto leading-relaxed">No affirmations yet. Be the first to share positive energy using the form on the left!</p>
              </div>
            ) : (
              filteredPosts.map(post => {
                const isExpanded = expandedComments.has(post.id);
                const commentCount = post.comments?.length || 0;
                const likedByMe = post.likes && post.likes.length > 0;

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden"
                    id={`post-${post.id}`}
                  >
                    {/* Gradient Card Top */}
                    <div className={`p-5 bg-gradient-to-br ${post.bgGradient} text-white relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-2xl translate-x-6 -translate-y-6 pointer-events-none"></div>

                      {/* Author + time */}
                      <div className="flex items-center justify-between mb-3 relative z-5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-sans font-bold text-sm">
                            {post.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-sans font-bold text-xs">@{post.authorName}</span>
                            <span className="block text-[9px] text-white/60 font-mono">{formatTime(post.createdAt)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleReadAloud(post.text)}
                          title="Read aloud"
                          className="p-1.5 bg-white/15 hover:bg-white/25 rounded-lg transition cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>

                      {/* Post text */}
                      <p className="font-sans font-medium text-sm leading-relaxed relative z-5 pr-2">
                        &ldquo;{post.text}&rdquo;
                      </p>
                    </div>

                    {/* Action bar */}
                    <div className="px-5 py-3 flex items-center justify-between border-b border-slate-50">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-bold transition cursor-pointer ${
                            likedByMe
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 border border-slate-100'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${likedByMe ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span>{post.likes ? post.likes.length : 0} Like{post.likes?.length !== 1 ? 's' : ''}</span>
                        </button>

                        <button
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-slate-50 text-slate-500 hover:bg-violet-50 hover:text-violet-600 border border-slate-100 transition cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{commentCount} Comment{commentCount !== 1 ? 's' : ''}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-slate-300 uppercase tracking-wider">
                          <Sparkles className="w-2.5 h-2.5 inline text-amber-400 mr-0.5" />
                          Affirmation
                        </span>
                      </div>
                    </div>

                    {/* Comments Section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 py-4 space-y-3">
                            {/* Existing comments */}
                            {(post.comments || []).length === 0 ? (
                              <p className="text-[11px] text-slate-400 font-sans text-center py-2">No comments yet — be the first to reply!</p>
                            ) : (
                              (post.comments || []).map(comment => (
                                <div key={comment.id} className="flex items-start gap-2.5 py-2.5 border-b border-slate-50 last:border-0">
                                  <div className="w-7 h-7 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                    {comment.authorName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-sans font-bold text-slate-700">@{comment.authorName}</span>
                                      <span className="text-[9px] font-mono text-slate-300">{formatTime(comment.createdAt)}</span>
                                    </div>
                                    <p className="text-xs font-sans text-slate-600 mt-0.5 leading-relaxed">{comment.text}</p>
                                  </div>
                                </div>
                              ))
                            )}

                            {/* Add comment input */}
                            <div className="flex items-center gap-2 pt-2">
                              <div className="w-7 h-7 bg-violet-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                                {(nickname.trim() || 'A').charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder={`Comment as @${nickname.trim() || 'Anonymous Friend'}...`}
                                  value={commentInputs[post.id] || ''}
                                  onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(post.id); } }}
                                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs focus:outline-none focus:border-violet-400 transition"
                                  id={`comment-input-${post.id}`}
                                />
                                <button
                                  onClick={() => handleAddComment(post.id)}
                                  disabled={!(commentInputs[post.id] || '').trim() || submittingComment === post.id}
                                  className="p-2 bg-violet-600 text-white rounded-xl disabled:opacity-40 cursor-pointer hover:bg-violet-700 transition shrink-0"
                                  id={`comment-submit-${post.id}`}
                                >
                                  {submittingComment === post.id
                                    ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin block"></span>
                                    : <Send className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
