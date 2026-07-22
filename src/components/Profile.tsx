/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Bell, Shield, Download, Sun, Moon, Sparkles, Award } from 'lucide-react';
import { User as UserType } from '../types';

interface ProfileProps {
  user: UserType;
  token: string;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export default function Profile({ user, token, onLogout, isDarkMode, onToggleTheme }: ProfileProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Trigger JSON download file containing all their logs
  const handleExportData = async () => {
    setExporting(true);
    try {
      // Fetch entire history and journal logs parallelly
      const [moodRes, journalRes] = await Promise.all([
        fetch('/api/mood/history', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/journal/all', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const moods = moodRes.ok ? (await moodRes.json()).history : [];
      const journals = journalRes.ok ? (await journalRes.json()).journals : [];

      const completePayload = {
        exportedAt: new Date().toISOString(),
        user: {
          name: user.name,
          email: user.email,
          streak: user.moodStreak,
          registeredAt: user.createdAt,
        },
        data: {
          moodLogs: moods,
          journalEntries: journals,
        },
      };

      const blob = new Blob([JSON.stringify(completePayload, null, 2)], { type: 'application/json' });
      const docUrl = URL.createObjectURL(blob);
      const tempElement = document.createElement('a');
      tempElement.href = docUrl;
      tempElement.download = `mind_mood_ai_export_${user.name.toLowerCase().replace(/\s+/g, '_')}.json`;
      document.body.appendChild(tempElement);
      tempElement.click();
      document.body.removeChild(tempElement);
      URL.revokeObjectURL(docUrl);
    } catch (e) {
      console.error(e);
      alert('Failed assembling data export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8" id="profile-tab">
      
      {/* Left column: User credentials with streak badge (5 cols) */}
      <div className="lg:col-span-5 space-y-6" id="profile-card-left">
        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-xs text-center flex flex-col items-center" id="user-info-panel">
          <div className="w-20 h-20 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-3xl shadow-md text-white flex items-center justify-center font-sans font-black text-3xl">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <h2 className="font-sans font-extrabold text-2xl text-slate-800 tracking-tight mt-6">{user.name}</h2>
          <p className="font-sans text-sm text-slate-400 mt-1">{user.email}</p>

          <span className="inline-block mt-4 text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-100 px-3.5 py-1.5 rounded-full">
            Active since {new Date(user.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
          </span>

          <div className="w-full h-px bg-slate-100 my-8"></div>

          {/* Gamification Streak Badge */}
          <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl w-full flex items-center gap-4 text-left" id="streak-gaming-badge">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-sans text-amber-600 font-extrabold block uppercase tracking-wider">
                Mood Streak Badge
              </span>
              <h3 className="font-sans font-bold text-slate-800 text-lg mt-1">
                {user.moodStreak || 0} Consecutive Days
              </h3>
              <p className="text-[11px] font-sans text-amber-800/80 mt-1 leading-normal">
                You are setting a high standard of self-awareness. Excellent work tracking emotions regularly.
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            id="logout-btn"
            className="w-full py-3.5 mt-8 border border-rose-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl font-sans font-bold text-xs tracking-wider uppercase transition cursor-pointer"
          >
            Leave Wellness Space & Sign Out
          </button>
        </div>
      </div>

      {/* Right column: Settings & toggles panel (7 cols) */}
      <div className="lg:col-span-7 space-y-6" id="profile-settings-right">
        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-6" id="user-settings-panel">
          
          <div>
            <h2 className="font-sans font-bold text-slate-800 text-lg">System Settings</h2>
            <p className="text-xs font-sans text-slate-400">Configure layout preferences and secure archives</p>
          </div>

          <div className="space-y-6 pt-4" id="toggles-group">
            {/* Theme Toggle option */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-50">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                  {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-800 text-sm">Contrast Theme</h3>
                  <p className="text-xs font-sans text-slate-400 mt-1">Adjust contrast from default light mode</p>
                </div>
              </div>
              <button
                onClick={onToggleTheme}
                id="toggle-theme-btn"
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition duration-200 outline-hidden ${
                  isDarkMode ? 'bg-violet-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                    isDarkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Notification Reminder Toggle */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-50">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-800 text-sm">Daily Mood Reminders</h3>
                  <p className="text-xs font-sans text-slate-400 mt-1">Receive mock push alerts reminding self-checks</p>
                </div>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                id="toggle-notif-btn"
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition duration-200 outline-hidden ${
                  notificationsEnabled ? 'bg-[#10b981]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Private Vault Info badge */}
            <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-2xl flex items-start gap-3">
              <Shield className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-sans font-bold text-[#1f2937] text-xs">Self-Reflective Sovereignty</h4>
                <p className="font-sans text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Your emotional logs are physically contained inside security-bound application silos. Individual records are never transmitted or evaluated outside specified safe Gemini NLP wrappers.
                </p>
              </div>
            </div>

            {/* Data Export core button */}
            <div className="pt-4 flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-slate-800 text-sm">Export Mind Archives</h3>
                <p className="text-xs font-sans text-slate-400 mt-0.5">Download entire journals and history logs format JSON securely</p>
              </div>
              <button
                onClick={handleExportData}
                disabled={exporting}
                id="export-archive-btn"
                className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 text-xs font-sans font-bold rounded-xl tracking-wide transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Packing...' : 'Download Export'}
              </button>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
