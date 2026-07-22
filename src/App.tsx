/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, Smile, BookOpen, BarChart3, User as UserIcon, Heart, LogOut, Menu, X, Sparkles, Award, Globe, Bell, Trophy
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import AIChat from './components/AIChat';
import MoodJournal from './components/MoodJournal';
import Analytics from './components/Analytics';
import Profile from './components/Profile';
import Meditation from './components/Meditation';
import Community from './components/Community';
import Notifications from './components/Notifications';
import WellnessScoreView from './components/WellnessScoreView';
import { Mood, MoodType, User } from './types';

type ActiveView = 'landing' | 'login' | 'register' | 'dashboard' | 'chat' | 'journal' | 'analytics' | 'profile' | 'meditation' | 'community' | 'notifications' | 'wellness';

export default function App() {
  const [view, setView] = useState<ActiveView>('landing');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [todayMood, setTodayMood] = useState<Mood | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load token + user on launch
  useEffect(() => {
    const savedToken = localStorage.getItem('mind_mood_token');
    if (savedToken) {
      setToken(savedToken);
      fetchProfile(savedToken);
    }
  }, []);

  const fetchProfile = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setView('dashboard');
        fetchTodayMood(authToken);
        fetchUnreadCount(authToken);
      } else {
        // Stale token
        handleClearAuth();
      }
    } catch (e) {
      console.error(e);
      // Fallback offline survival
      handleClearAuth();
    }
  };

  const fetchTodayMood = async (authToken: string) => {
    try {
      const res = await fetch('/api/mood/today', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTodayMood(data.mood);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUnreadCount = async (authToken: string) => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const unreads = (data.notifications || []).filter((n: any) => !n.read).length;
        setUnreadCount(unreads);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthSuccess = (authToken: string, authUser: User) => {
    localStorage.setItem('mind_mood_token', authToken);
    setToken(authToken);
    setUser(authUser);
    setView('dashboard');
    fetchTodayMood(authToken);
    fetchUnreadCount(authToken);
  };

  const handleClearAuth = () => {
    localStorage.removeItem('mind_mood_token');
    setToken(null);
    setUser(null);
    setTodayMood(null);
    setView('landing');
  };

  const recordMood = async (moodType: MoodType, intensity: number, note: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/mood/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ moodType, intensity, note }),
      });
      if (res.ok) {
        const data = await res.json();
        setTodayMood(data.mood);
        if (data.user) {
          setUser(data.user); // Sync consecutive streak metrics
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Safe navigation switch
  const navigateTab = (targetTab: ActiveView) => {
    setView(targetTab);
    setIsMobileMenuOpen(false);
    if (token) {
      fetchUnreadCount(token);
    }
  };

  // Sidebar navigation definitions
  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Smile },
    { id: 'chat' as const, label: 'AI Support Chat', icon: Brain },
    { id: 'journal' as const, label: 'Mood Journal', icon: BookOpen },
    { id: 'analytics' as const, label: 'Analytics & Insights', icon: BarChart3 },
    { id: 'meditation' as const, label: 'Breathing Guide', icon: Heart },
    { id: 'community' as const, label: 'Community Plaza', icon: Globe },
    { id: 'wellness' as const, label: 'Wellness Core', icon: Trophy },
    { id: 'notifications' as const, label: 'Notifications Feed', icon: Bell },
    { id: 'profile' as const, label: 'Profile & Settings', icon: UserIcon },
  ];

  // Render Authentication and Landing page if unauthorized
  if (!token) {
    if (view === 'landing') {
      return (
        <LandingPage 
          onGetStarted={() => setView('register')} 
          onLoginClick={() => setView('login')} 
        />
      );
    }
    return (
      <AuthPage 
        initialMode={view === 'register' ? 'register' : 'login'}
        onAuthSuccess={handleAuthSuccess}
        onBackToLanding={() => setView('landing')}
      />
    );
  }

  // Double guard check
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-400">
        <span className="w-8 h-8 border-3 border-indigo-600/25 border-t-indigo-600 rounded-full animate-spin mr-3"></span>
        <span>Assembling secure emotional records...</span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col md:flex-row transition-colors duration-300 ${
      isDarkMode ? 'bg-[#0f172a] text-[#f1f5f9]' : 'bg-[#f8fafc] text-[#1e293b]'
    }`} id="applet-body-shell">
      
      {/* 1. Large Screen Sidebar */}
      <aside className={`hidden md:flex flex-col w-64 p-6 border-r shrink-0 transition-colors duration-200 ${
        isDarkMode ? 'bg-[#1e293b]/90 border-slate-700/50' : 'bg-white border-slate-200/60'
      }`} id="desktop-sidebar">
        
        {/* Sidebar Header logotype */}
        <div className="flex items-center gap-2 mb-8">
          <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-xl text-white">
            <Brain className="w-5 h-5 animate-pulse-slow" />
          </div>
          <span className="font-sans font-black text-lg tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Mind Mood AI
          </span>
        </div>

        {/* Navigation Link Stack */}
        <nav className="flex-1 space-y-1.5" id="sidebar-nav">
          {tabs.map((tab) => {
            const IconComp = tab.icon;
            const isSelected = view === tab.id;
            const isNotif = tab.id === 'notifications';
            return (
              <button
                key={tab.id}
                onClick={() => navigateTab(tab.id)}
                id={`lnk-${tab.id}`}
                className={`w-full px-4 py-3 rounded-2xl font-sans text-xs font-bold tracking-wide flex items-center justify-between transition cursor-pointer ${
                  isSelected 
                    ? 'bg-violet-600 text-white shadow-xs' 
                    : isDarkMode 
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <IconComp className="w-4.5 h-4.5 shrink-0" />
                  <span>{tab.label}</span>
                </div>
                {isNotif && unreadCount > 0 && (
                  <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Mini Credentials card bottom of sidebar */}
        <div className={`mt-auto p-4 rounded-2xl flex items-center gap-3 border transition-colors ${
          isDarkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50/50 border-slate-100'
        }`} id="user-badge">
          <div className="w-9 h-9 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center font-bold font-sans text-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="truncate flex-1">
            <span id="user-display-name" className="block text-xs font-bold truncate leading-tight">{user.name}</span>
            <span className="text-[9px] text-[#22c55e] font-sans font-bold flex items-center gap-0.5 mt-0.5">
              <Award className="w-3.5 h-3.5 fill-[#22c55e]/15" /> Streak: {user.moodStreak || 0}d
            </span>
          </div>
          <button
            onClick={handleClearAuth}
            id="sidebar-signout-btn"
            title="Leave Wellness Space"
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </aside>

      {/* 2. Mobile Header Bar & Collapse Triggers */}
      <header className={`md:hidden p-4 border-b flex items-center justify-between sticky top-0 z-50 transition-colors ${
        isDarkMode ? 'bg-[#1e293b] border-slate-700/40' : 'bg-white border-slate-150'
      }`} id="mobile-header">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-lg text-white">
            <Brain className="w-4.5 h-4.5" />
          </div>
          <span className="font-sans font-extrabold text-sm tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Mind Mood AI
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            id="mobile-drawer-toggle"
            className="p-2 text-slate-500 hover:text-slate-800 focus:outline-hidden"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer menu list */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`md:hidden fixed top-[57px] left-0 w-full z-40 border-b p-4 shadow-lg space-y-1.5 transition-colors ${
              isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'
            }`}
            id="mobile-navigation-drawer"
          >
            {tabs.map((tab) => {
              const IconComp = tab.icon;
              const isSelected = view === tab.id;
              const isNotif = tab.id === 'notifications';
              return (
                <button
                  key={tab.id}
                  onClick={() => navigateTab(tab.id)}
                  id={`m-lnk-${tab.id}`}
                  className={`w-full px-4 py-3 rounded-xl font-sans text-xs font-bold tracking-wide flex items-center justify-between transition cursor-pointer ${
                    isSelected 
                      ? 'bg-violet-600 text-white' 
                      : isDarkMode 
                        ? 'text-slate-400 hover:bg-slate-800'
                        : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <IconComp className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </div>
                  {isNotif && unreadCount > 0 && (
                    <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[9px] font-mono font-bold mr-1">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
            <div className="h-px bg-slate-100 my-3"></div>
            <button
              onClick={handleClearAuth}
              id="m-signout-btn"
              className="w-full px-4 py-3 rounded-xl font-sans text-xs font-bold text-rose-500 hover:bg-rose-50 flex items-center gap-3.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Wellness Space</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Workspace viewport */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto" id="applet-view-port">
        {/* Header bar stating current local streak status on top of workspace */}
        <div className="pb-6 mb-6 border-b border-slate-250 flex flex-wrap items-center justify-between gap-4" id="view-header">
          <div>
            <span className="text-[10px] font-mono font-bold text-violet-600 block uppercase tracking-wider">
              {view === 'dashboard' ? 'Daily check-in' : `Mind Mood / ${view}`}
            </span>
            <h1 className="font-sans font-black text-2xl text-slate-800 capitalize leading-none mt-1">
              {view === 'dashboard' ? 'Emotional Dashboard' 
                : view === 'chat' ? 'Empathetic Companion Chat' 
                : view === 'journal' ? 'Self-Reflective Journal' 
                : view === 'analytics' ? 'Trend Graphs & Reports' 
                : view === 'meditation' ? 'Guided Relaxation' 
                : view === 'community' ? 'Community Plaza'
                : view === 'wellness' ? 'Wellness Score Index'
                : view === 'notifications' ? 'Notifications Feed'
                : 'Profile Settings'}
            </h1>
          </div>
          
          {/* Calendar or status indicators */}
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xs border border-slate-100/80 px-3.5 py-2 rounded-xl text-xs font-sans font-semibold text-slate-500" id="current-date">
            <span className="w-2.5 h-2.5 bg-[#22c55e] rounded-full animate-pulse"></span>
            <span>{new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Custom Tab rendering */}
        <div id="subview-portal">
          {view === 'dashboard' && (
            <Dashboard 
              user={user} 
              todayMood={todayMood} 
              onRecordMood={recordMood} 
              onNavigate={navigateTab}
              token={token}
            />
          )}
          {view === 'chat' && <AIChat token={token} />}
          {view === 'journal' && <MoodJournal token={token} />}
          {view === 'analytics' && <Analytics token={token} />}
          {view === 'meditation' && <Meditation token={token} />}
          {view === 'community' && <Community token={token} />}
          {view === 'notifications' && <Notifications token={token} />}
          {view === 'wellness' && <WellnessScoreView token={token} onNavigate={navigateTab} />}
          {view === 'profile' && (
            <Profile 
              user={user} 
              token={token} 
              onLogout={handleClearAuth} 
              isDarkMode={isDarkMode} 
              onToggleTheme={handleToggleTheme}
            />
          )}
        </div>
      </main>

      {/* 4. Mobile Bottom Navigation bar */}
      <nav className={`md:hidden fixed bottom-0 left-0 w-full border-t flex items-center justify-around py-2 z-30 transition-colors bg-white border-slate-150`} id="mobile-bottom-bar">
        {tabs.slice(0, 8).map((tab) => {
          const IconComp = tab.icon;
          const isSelected = view === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigateTab(tab.id)}
              id={`bn-${tab.id}`}
              className={`flex flex-col items-center p-1 rounded-xl cursor-pointer ${
                isSelected ? 'text-violet-600 font-extrabold' : 'text-slate-400'
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span className="text-[8px] font-sans font-bold mt-0.5 max-w-[44px] truncate leading-none">
                {tab.id === 'dashboard' ? 'Home' : tab.id === 'chat' ? 'Chat' : tab.id === 'journal' ? 'Journal' : tab.id === 'analytics' ? 'Insights' : tab.id === 'meditation' ? 'Relax' : tab.id === 'community' ? 'Plaza' : tab.id === 'wellness' ? 'Core' : 'Alerts'}
              </span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
