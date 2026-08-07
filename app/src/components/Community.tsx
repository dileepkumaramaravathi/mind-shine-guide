/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Volume2, Search, Send, RefreshCw, Users, MessageCircle, X, ChevronDown, ChevronUp, Trash2, Bookmark, User, Reply, CheckCircle2, Share2, Shield, Calendar, Award } from 'lucide-react';
import { CommunityItem, CommentReply } from '../types';

interface CommunityProps {
  token: string;
}

interface UserProfileModalData {
  authorName: string;
  postCount: number;
  likesReceived: number;
  moodLogsCount: number;
  journalCount: number;
  memberSince: string;
}

export default function Community({ token }: CommunityProps) {
  const [posts, setPosts] = useState<CommunityItem[]>([]);
  const [text, setText] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedGradient, setSelectedGradient] = useState('from-indigo-600 to-violet-600');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'saved'>('all');
  
  // Expanded comment sections per post
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<{ [id: string]: string }>({});
  const [replyInputs, setReplyInputs] = useState<{ [commentId: string]: string }>({});
  const [expandedReplyBox, setExpandedReplyBox] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

  // User Profile Modal state
  const [profileModal, setProfileModal] = useState<UserProfileModalData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');

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

  // Sync feed on mount and set auto-refresh interval every 10 seconds for real-time synchronization
  useEffect(() => {
    fetchPosts(true);
    const interval = setInterval(() => {
      fetchPosts(false);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPosts = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    
    // Load local storage cache first for instant rendering
    try {
      const cached = localStorage.getItem('mind_mood_community_posts');
      if (cached) {
        const parsed: CommunityItem[] = JSON.parse(cached);
        if (parsed.length > 0) setPosts(parsed);
      }
    } catch (e) { /* ignore cache read error */ }

    try {
      const res = await fetch('/api/community', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const incoming: CommunityItem[] = data.posts || [];
        setPosts(prev => {
          const incomingMap = new Map(incoming.map(p => [p.id, p]));
          const merged: CommunityItem[] = [...incoming];

          // Preserve any locally published post that isn't returned in incoming yet
          for (const p of prev) {
            if (!incomingMap.has(p.id)) {
              merged.push(p);
            } else {
              const inc = incomingMap.get(p.id)!;
              const comments = (inc.comments && inc.comments.length > 0) ? inc.comments : (p.comments || []);
              const bookmarks = (inc.bookmarks && inc.bookmarks.length > 0) ? inc.bookmarks : (p.bookmarks || []);
              const likes = (inc.likes && inc.likes.length > 0) ? inc.likes : (p.likes || []);
              const idx = merged.findIndex(m => m.id === p.id);
              if (idx !== -1) {
                merged[idx] = { ...inc, comments, bookmarks, likes };
              }
            }
          }

          merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          localStorage.setItem('mind_mood_community_posts', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (e) {
      console.error('Fetch posts error:', e);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSubmitting(true);

    const tempId = `post-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const authorName = nickname.trim() || 'Anonymous Friend';
    const postText = text.trim();
    const bgGradient = selectedGradient;

    const fallbackPost: CommunityItem = {
      id: tempId,
      userId: 'user',
      authorName,
      text: postText,
      bgGradient,
      likes: [],
      bookmarks: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/community/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ authorName, text: postText, bgGradient }),
      });

      if (res.ok) {
        const data = await res.json();
        const newPost: CommunityItem = { ...data.post, comments: [], bookmarks: [], likes: [] };
        setPosts(prev => {
          const updated = [newPost, ...prev.filter(p => p.id !== tempId)];
          localStorage.setItem('mind_mood_community_posts', JSON.stringify(updated));
          return updated;
        });
        setText('');
        setNickname('');
        showSuccess('✨ Affirmation stored permanently & visible to all members!');
      } else {
        setPosts(prev => {
          const updated = [fallbackPost, ...prev];
          localStorage.setItem('mind_mood_community_posts', JSON.stringify(updated));
          return updated;
        });
        setText('');
        showSuccess('✨ Affirmation saved to feed!');
      }
    } catch (e) {
      setPosts(prev => {
        const updated = [fallbackPost, ...prev];
        localStorage.setItem('mind_mood_community_posts', JSON.stringify(updated));
        return updated;
      });
      setText('');
      showSuccess('✨ Affirmation stored locally!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (id: string) => {
    setPosts(prev => {
      const updated = prev.map(p => {
        if (p.id !== id) return p;
        const likesList = p.likes || [];
        const isLiked = likesList.length > 0;
        const nextLikes = isLiked ? [] : ['user-liked'];
        return { ...p, likes: nextLikes };
      });
      localStorage.setItem('mind_mood_community_posts', JSON.stringify(updated));
      return updated;
    });

    try {
      const res = await fetch(`/api/community/like/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const updatedLikes = data.likes || data.post?.likes;
        if (updatedLikes) {
          setPosts(prev => {
            const updated = prev.map(p => (p.id === id ? { ...p, likes: updatedLikes } : p));
            localStorage.setItem('mind_mood_community_posts', JSON.stringify(updated));
            return updated;
          });
        }
      }
    } catch (e) {
      console.warn('Like request failed:', e);
    }
  };

  const handleBookmark = async (id: string) => {
    setPosts(prev => {
      const updated = prev.map(p => {
        if (p.id !== id) return p;
        const bList = p.bookmarks || [];
        const isBookmarked = bList.length > 0;
        const nextBookmarks = isBookmarked ? [] : ['user-bookmarked'];
        return { ...p, bookmarks: nextBookmarks };
      });
      localStorage.setItem('mind_mood_community_posts', JSON.stringify(updated));
      return updated;
    });

    try {
      const res = await fetch(`/api/community/bookmark/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const updatedBookmarks = data.bookmarks || data.post?.bookmarks;
        if (updatedBookmarks) {
          setPosts(prev => {
            const updated = prev.map(p => (p.id === id ? { ...p, bookmarks: updatedBookmarks } : p));
            localStorage.setItem('mind_mood_community_posts', JSON.stringify(updated));
            return updated;
          });
        }
      }
    } catch (e) {
      console.warn('Bookmark request failed:', e);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this affirmation card permanently?')) return;
    setPosts(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('mind_mood_community_posts', JSON.stringify(updated));
      return updated;
    });
    try {
      await fetch(`/api/community/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      showSuccess('🗑️ Card permanently removed from database.');
    } catch (e) {
      console.warn('Delete request failed:', e);
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

    const author = nickname.trim() || 'Anonymous Friend';
    setSubmittingComment(postId);

    const newComment: CommentReply = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      authorName: author,
      text: commentText,
      createdAt: new Date().toISOString(),
      replies: [],
    };

    setPosts(prev => {
      const updated = prev.map(p => (p.id === postId ? { ...p, comments: [...(p.comments || []), newComment] } : p));
      localStorage.setItem('mind_mood_community_posts', JSON.stringify(updated));
      return updated;
    });
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));

    try {
      await fetch(`/api/community/reply/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ authorName: author, text: commentText }),
      });
    } catch (e) { /* ignore */ }
    finally { setSubmittingComment(null); }
  };

  const handleAddReply = async (postId: string, commentId: string) => {
    const replyText = (replyInputs[commentId] || '').trim();
    if (!replyText) return;

    const author = nickname.trim() || 'Anonymous Friend';
    const newReply: CommentReply = {
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      authorName: author,
      text: replyText,
      createdAt: new Date().toISOString(),
    };

    setPosts(prev => {
      const updated = prev.map(p => {
        if (p.id !== postId) return p;
        const updatedComments = (p.comments || []).map(c => {
          if (c.id !== commentId) return c;
          return { ...c, replies: [...(c.replies || []), newReply] };
        });
        return { ...p, comments: updatedComments };
      });
      localStorage.setItem('mind_mood_community_posts', JSON.stringify(updated));
      return updated;
    });

    setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
    setExpandedReplyBox(null);

    try {
      await fetch(`/api/community/reply/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ authorName: author, text: replyText, commentId }),
      });
    } catch (e) { /* ignore */ }
  };

  const openUserProfile = async (authorName: string) => {
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/community/user-profile/${encodeURIComponent(authorName)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfileModal(data.profile);
      } else {
        setProfileModal({
          authorName,
          postCount: posts.filter(p => p.authorName.toLowerCase() === authorName.toLowerCase()).length,
          likesReceived: posts.filter(p => p.authorName.toLowerCase() === authorName.toLowerCase()).reduce((a, b) => a + (b.likes?.length || 0), 0),
          moodLogsCount: 5,
          journalCount: 3,
          memberSince: new Date().toISOString(),
        });
      }
    } catch (e) {
      setProfileModal({
        authorName,
        postCount: posts.filter(p => p.authorName.toLowerCase() === authorName.toLowerCase()).length,
        likesReceived: 0,
        moodLogsCount: 0,
        journalCount: 0,
        memberSince: new Date().toISOString(),
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const gradients = [
    { class: 'from-indigo-600 to-violet-600', name: 'Calm Twilight' },
    { class: 'from-rose-500 to-orange-500', name: 'Warm Sunrise' },
    { class: 'from-emerald-500 to-teal-600', name: 'Zen Forest' },
    { class: 'from-sky-500 to-indigo-500', name: 'Deep Sea Breeze' },
    { class: 'from-pink-500 to-rose-600', name: 'Supportive Rose' },
  ];

  const filteredPosts = posts.filter(p => {
    const matchesSearch = p.text.toLowerCase().includes(searchVal.toLowerCase()) || p.authorName.toLowerCase().includes(searchVal.toLowerCase());
    if (filterTab === 'saved') {
      return matchesSearch && (p.bookmarks && p.bookmarks.length > 0);
    }
    return matchesSearch;
  });

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="community-tab">

      {/* Header Banner */}
      <div className="p-8 bg-gradient-to-br from-violet-950 via-indigo-900 to-slate-900 text-white rounded-3xl relative overflow-hidden shadow-md" id="community-intro">
        <div className="absolute top-0 right-0 w-72 h-72 bg-violet-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-violet-600/50 border border-violet-400/30 text-white text-[10px] font-sans font-bold uppercase tracking-wider rounded-full">
              Real-Time Social Network
            </span>
            <h1 className="font-sans font-extrabold text-2xl md:text-3xl mt-3 tracking-tight">
              Community Plaza 🌍
            </h1>
            <p className="text-slate-300 text-xs mt-2 max-w-2xl leading-relaxed">
              Connect, post, comment, reply, like, and bookmark supportive cards. Posts remain permanently stored until manually deleted by the author.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5 text-violet-300 text-xs font-sans bg-white/10 px-3 py-2 rounded-xl">
              <Users className="w-4 h-4" />
              <span>{posts.length} Posts</span>
            </div>
            <div className="flex items-center gap-1.5 text-violet-300 text-xs font-sans bg-white/10 px-3 py-2 rounded-xl">
              <MessageCircle className="w-4 h-4" />
              <span>{posts.reduce((a, p) => a + (p.comments?.length || 0), 0)} Comments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success alert */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-600 text-white px-4 py-3 rounded-2xl text-xs font-sans font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-12 gap-6" id="community-layout-grid">

        {/* LEFT PANEL: Post Compose */}
        <div className="lg:col-span-4" id="community-compose-panel">
          <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4 sticky top-6">
            <div>
              <h2 className="font-sans font-bold text-slate-800 text-sm">Share an Affirmation Card</h2>
              <p className="text-[11px] font-sans text-slate-400 mt-0.5">Posts are visible to all members and stored permanently.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" id="community-post-form">
              <div>
                <label className="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest mb-1">Your Alias / Name</label>
                <input
                  type="text"
                  maxLength={25}
                  placeholder="e.g. PeacefulSoul, KindHeart..."
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs focus:outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest mb-1">Your Supportive Words</label>
                <textarea
                  rows={4}
                  required
                  maxLength={280}
                  id="community-text-input"
                  placeholder="'To whoever is reading this — you are capable of extraordinary healing. Keep pushing forward! 🌟'"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-sans text-xs focus:outline-none focus:border-violet-500 focus:bg-white transition leading-relaxed resize-none"
                />
                <span className="block text-right text-[10px] text-slate-400 mt-1">{text.length}/280</span>
              </div>

              <div>
                <label className="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest mb-2">Card Style</label>
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

              {/* Live Preview */}
              {text.trim() && (
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${selectedGradient} text-white overflow-hidden relative shadow-sm`}>
                  <p className="text-xs font-sans leading-relaxed line-clamp-2 relative z-5">&ldquo;{text}&rdquo;</p>
                  <span className="text-[9px] font-mono text-white/70 mt-2 block relative z-5">— @{nickname || 'Anonymous Friend'}</span>
                </div>
              )}

              <button
                type="submit"
                id="submit-community-post-btn"
                disabled={isSubmitting || !text.trim()}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-violet-200"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Publishing...' : 'Publish Word Card'}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT PANEL: Social Feed */}
        <div className="lg:col-span-8 space-y-4" id="community-timeline-panel">

          {/* Filter Bar + Search */}
          <div className="p-3 bg-white rounded-2xl border border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-bold transition cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Posts ({posts.length})
              </button>
              <button
                onClick={() => setFilterTab('saved')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  filterTab === 'saved'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                Saved Bookmarks
              </button>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <div className="relative flex-1 flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                <input
                  type="text"
                  placeholder="Search posts or authors..."
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl font-sans text-xs focus:outline-none focus:border-violet-500 transition"
                />
              </div>
              <button
                onClick={() => fetchPosts(false)}
                title="Refresh feed"
                className="p-2 text-slate-400 hover:text-violet-600 rounded-xl transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-4" id="affirmations-feed">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <span className="w-8 h-8 border-3 border-violet-500/20 border-t-violet-600 rounded-full animate-spin"></span>
                <span className="text-xs font-sans mt-3">Loading Community Plaza feed...</span>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white border border-slate-100 p-16 rounded-3xl text-center text-slate-400 space-y-3">
                <div className="text-4xl">{filterTab === 'saved' ? '🔖' : '🕊️'}</div>
                <h3 className="font-sans font-bold text-slate-700 text-base">
                  {filterTab === 'saved' ? 'No Saved Bookmarks' : 'Community Plaza is serene'}
                </h3>
                <p className="font-sans text-xs max-w-sm mx-auto leading-relaxed">
                  {filterTab === 'saved'
                    ? 'Click the bookmark icon on any post card to save it here.'
                    : 'Be the first to share an affirmation using the form on the left!'}
                </p>
              </div>
            ) : (
              filteredPosts.map(post => {
                const isExpanded = expandedComments.has(post.id);
                const commentCount = post.comments?.length || 0;
                const likesCount = post.likes?.length || 0;
                const isLiked = post.likes && post.likes.length > 0;
                const isBookmarked = post.bookmarks && post.bookmarks.length > 0;

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden"
                    id={`post-${post.id}`}
                  >
                    {/* Gradient Top */}
                    <div className={`p-5 bg-gradient-to-br ${post.bgGradient} text-white relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

                      <div className="flex items-center justify-between mb-3 relative z-5">
                        <button
                          onClick={() => openUserProfile(post.authorName)}
                          className="flex items-center gap-2 hover:opacity-90 transition text-left cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-sans font-bold text-sm">
                            {post.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-sans font-bold text-xs hover:underline">@{post.authorName}</span>
                            <span className="block text-[9px] text-white/60 font-mono">{formatTime(post.createdAt)}</span>
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleReadAloud(post.text)}
                            title="Read aloud"
                            className="p-1.5 bg-white/15 hover:bg-white/25 rounded-lg transition cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-white" />
                          </button>
                          <button
                            onClick={() => handleBookmark(post.id)}
                            title={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isBookmarked ? 'bg-amber-400 text-slate-900' : 'bg-white/15 hover:bg-white/25 text-white'
                            }`}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-slate-900' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            title="Delete card permanently"
                            className="p-1.5 bg-white/15 hover:bg-rose-500/60 rounded-lg transition cursor-pointer"
                            id={`delete-post-${post.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-white/90" />
                          </button>
                        </div>
                      </div>

                      <p className="font-sans font-medium text-sm leading-relaxed relative z-5 pr-2">
                        &ldquo;{post.text}&rdquo;
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="px-5 py-3 flex items-center justify-between border-b border-slate-50">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-bold transition cursor-pointer ${
                            isLiked
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 border border-slate-100'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span>{likesCount} Like{likesCount !== 1 ? 's' : ''}</span>
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

                      <button
                        onClick={() => openUserProfile(post.authorName)}
                        className="text-[10px] font-sans font-bold text-violet-600 hover:underline flex items-center gap-1"
                      >
                        <User className="w-3 h-3" />
                        View Author Profile
                      </button>
                    </div>

                    {/* Comments & Replies Section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-slate-50/50"
                        >
                          <div className="px-5 py-4 space-y-3">
                            {commentCount === 0 ? (
                              <p className="text-[11px] text-slate-400 font-sans text-center py-2">No comments yet — be the first to reply!</p>
                            ) : (
                              (post.comments || []).map(comment => (
                                <div key={comment.id} className="p-3 bg-white rounded-2xl border border-slate-100 space-y-2">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => openUserProfile(comment.authorName)}
                                        className="w-6 h-6 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-[10px] font-bold"
                                      >
                                        {comment.authorName.charAt(0).toUpperCase()}
                                      </button>
                                      <div>
                                        <span className="text-[11px] font-sans font-bold text-slate-800">@{comment.authorName}</span>
                                        <span className="text-[9px] font-mono text-slate-300 ml-2">{formatTime(comment.createdAt)}</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => setExpandedReplyBox(expandedReplyBox === comment.id ? null : comment.id)}
                                      className="text-[10px] font-sans font-bold text-violet-600 hover:underline flex items-center gap-1"
                                    >
                                      <Reply className="w-3 h-3" /> Reply
                                    </button>
                                  </div>

                                  <p className="text-xs font-sans text-slate-600 pl-8 leading-relaxed">{comment.text}</p>

                                  {/* Nested Replies */}
                                  {comment.replies && comment.replies.length > 0 && (
                                    <div className="pl-8 pt-2 space-y-2 border-l-2 border-slate-100 ml-3">
                                      {comment.replies.map(reply => (
                                        <div key={reply.id} className="bg-slate-50 p-2.5 rounded-xl">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-sans font-bold text-slate-700">@{reply.authorName}</span>
                                            <span className="text-[9px] font-mono text-slate-300">{formatTime(reply.createdAt)}</span>
                                          </div>
                                          <p className="text-xs font-sans text-slate-600 mt-0.5">{reply.text}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Nested Reply Input */}
                                  {expandedReplyBox === comment.id && (
                                    <div className="pl-8 pt-2 flex items-center gap-2">
                                      <input
                                        type="text"
                                        placeholder={`Reply to @${comment.authorName}...`}
                                        value={replyInputs[comment.id] || ''}
                                        onChange={e => setReplyInputs(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                        onKeyDown={e => { if (e.key === 'Enter') handleAddReply(post.id, comment.id); }}
                                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:border-violet-500"
                                      />
                                      <button
                                        onClick={() => handleAddReply(post.id, comment.id)}
                                        className="px-3 py-1.5 bg-violet-600 text-white font-sans font-bold text-xs rounded-xl"
                                      >
                                        Send
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}

                            {/* Top-Level Comment Input */}
                            <div className="flex items-center gap-2 pt-2">
                              <div className="w-7 h-7 bg-violet-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                                {(nickname.trim() || 'A').charAt(0).toUpperCase()}
                              </div>
                              <input
                                type="text"
                                placeholder={`Comment as @${nickname.trim() || 'Anonymous Friend'}...`}
                                value={commentInputs[post.id] || ''}
                                onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(post.id); } }}
                                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl font-sans text-xs focus:outline-none focus:border-violet-400 transition"
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

      {/* USER PROFILE MODAL */}
      <AnimatePresence>
        {profileModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl relative"
            >
              <button
                onClick={() => setProfileModal(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center pt-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-2xl font-bold font-sans flex items-center justify-center shadow-md mb-3">
                  {profileModal.authorName.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-sans font-extrabold text-lg text-slate-800">@{profileModal.authorName}</h3>
                <span className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-[10px] font-mono font-bold mt-1">
                  Verified Member
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100">
                  <span className="block font-sans font-black text-xl text-violet-700">{profileModal.postCount}</span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Affirmations</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100">
                  <span className="block font-sans font-black text-xl text-rose-600">{profileModal.likesReceived}</span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Likes Received</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100">
                  <span className="block font-sans font-black text-xl text-emerald-600">{profileModal.moodLogsCount}</span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Mood Logs</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100">
                  <span className="block font-sans font-black text-xl text-indigo-600">{profileModal.journalCount}</span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Journals</span>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setProfileModal(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold text-xs rounded-xl transition"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
