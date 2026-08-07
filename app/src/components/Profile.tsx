/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Bell, Shield, Download, Sun, Moon, Sparkles, Award, FileSpreadsheet } from 'lucide-react';
import { User as UserType } from '../types';
import * as XLSX from 'xlsx';

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

  // Trigger Excel download containing all their logs (all stored app data)
  const handleExportData = async () => {
    setExporting(true);
    try {
      // Fetch all data types in parallel
      const [moodRes, journalRes, notifRes, communityRes] = await Promise.all([
        fetch('/api/mood/history', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/journal/all', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/community', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const moods = moodRes.ok ? (await moodRes.json()).history || [] : [];
      const journals = journalRes.ok ? (await journalRes.json()).journals || [] : [];
      const notifications = notifRes.ok ? (await notifRes.json()).notifications || [] : [];
      const communityPosts = communityRes.ok ? (await communityRes.json()).posts || [] : [];

      // Create Excel workbook with multiple sheets
      const wb = XLSX.utils.book_new();

      // Sheet 1: User Profile
      const profileData = [
        ['Field', 'Value'],
        ['Name', user.name],
        ['Email', user.email],
        ['Mood Streak (Days)', user.moodStreak || 0],
        ['Member Since', new Date(user.createdAt).toLocaleDateString()],
        ['Export Date', new Date().toLocaleString()],
      ];
      const wsProfile = XLSX.utils.aoa_to_sheet(profileData);
      wsProfile['!cols'] = [{ wch: 25 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, wsProfile, 'Profile');

      // Sheet 2: Mood Logs
      if (moods.length > 0) {
        const moodHeaders = ['Date', 'Mood Type', 'Intensity (1-5)', 'Note'];
        const moodRows = moods.map((m: any) => [
          m.date || m.createdAt?.split('T')[0] || '',
          m.moodType || '',
          m.intensity || '',
          m.note || '',
        ]);
        const wsMoods = XLSX.utils.aoa_to_sheet([moodHeaders, ...moodRows]);
        wsMoods['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(wb, wsMoods, 'Mood Logs');
      } else {
        const wsEmpty = XLSX.utils.aoa_to_sheet([['No mood logs recorded yet.']]);
        XLSX.utils.book_append_sheet(wb, wsEmpty, 'Mood Logs');
      }

      // Sheet 3: Journal Entries
      if (journals.length > 0) {
        const journalHeaders = ['Date', 'Mood Tag', 'Journal Entry'];
        const journalRows = journals.map((j: any) => [
          j.createdAt ? new Date(j.createdAt).toLocaleDateString() : '',
          j.moodTag || '',
          j.text || '',
        ]);
        const wsJournals = XLSX.utils.aoa_to_sheet([journalHeaders, ...journalRows]);
        wsJournals['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 80 }];
        XLSX.utils.book_append_sheet(wb, wsJournals, 'Journal Entries');
      } else {
        const wsEmpty = XLSX.utils.aoa_to_sheet([['No journal entries recorded yet.']]);
        XLSX.utils.book_append_sheet(wb, wsEmpty, 'Journal Entries');
      }

      // Sheet 4: Community Posts
      if (communityPosts.length > 0) {
        const communityHeaders = ['Date', 'Author', 'Affirmation Text', 'Likes Count'];
        const communityRows = communityPosts.map((p: any) => [
          p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
          p.authorName || '',
          p.text || '',
          p.likes ? p.likes.length : 0,
        ]);
        const wsCommunity = XLSX.utils.aoa_to_sheet([communityHeaders, ...communityRows]);
        wsCommunity['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 80 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, wsCommunity, 'Community Posts');
      } else {
        const wsEmpty = XLSX.utils.aoa_to_sheet([['No community posts yet.']]);
        XLSX.utils.book_append_sheet(wb, wsEmpty, 'Community Posts');
      }

      // Sheet 5: Notifications
      if (notifications.length > 0) {
        const notifHeaders = ['Date', 'Title', 'Message', 'Type', 'Read'];
        const notifRows = notifications.map((n: any) => [
          n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '',
          n.title || '',
          n.message || '',
          n.type || '',
          n.read ? 'Yes' : 'No',
        ]);
        const wsNotifs = XLSX.utils.aoa_to_sheet([notifHeaders, ...notifRows]);
        wsNotifs['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 60 }, { wch: 12 }, { wch: 8 }];
        XLSX.utils.book_append_sheet(wb, wsNotifs, 'Notifications');
      }

      // Download the Excel file
      const fileName = `MindMoodAI_Export_${user.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (e) {
      console.error(e);
      alert('Failed assembling data export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const cardBase = isDarkMode
    ? 'bg-[#1e293b] border-slate-700/60 text-slate-100'
    : 'bg-white border-slate-100 text-slate-800';

  const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-400';
  const inputBg = isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/50 border-slate-100';

  return (
    <div className="grid lg:grid-cols-12 gap-8" id="profile-tab">
      
      {/* Left column: User credentials with streak badge (5 cols) */}
      <div className="lg:col-span-5 space-y-6" id="profile-card-left">
        <div className={`p-8 rounded-3xl border shadow-xs text-center flex flex-col items-center ${cardBase}`} id="user-info-panel">
          <div className="w-20 h-20 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-3xl shadow-md text-white flex items-center justify-center font-sans font-black text-3xl">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <h2 className="font-sans font-extrabold text-2xl tracking-tight mt-6">{user.name}</h2>
          <p className={`font-sans text-sm mt-1 ${textMuted}`}>{user.email}</p>

          <span className={`inline-block mt-4 text-[10px] font-mono font-bold uppercase tracking-wider border px-3.5 py-1.5 rounded-full ${inputBg} ${textMuted}`}>
            Active since {new Date(user.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
          </span>

          <div className={`w-full h-px my-8 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}></div>

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
            Leave Wellness Space &amp; Sign Out
          </button>
        </div>
      </div>

      {/* Right column: Settings & toggles panel (7 cols) */}
      <div className="lg:col-span-7 space-y-6" id="profile-settings-right">
        <div className={`p-8 rounded-3xl border shadow-xs space-y-6 ${cardBase}`} id="user-settings-panel">
          
          <div>
            <h2 className="font-sans font-bold text-lg">System Settings</h2>
            <p className={`text-xs font-sans mt-1 ${textMuted}`}>Configure layout preferences and secure archives</p>
          </div>

          <div className="space-y-6 pt-4" id="toggles-group">
            {/* Theme Toggle option */}
            <div className={`flex items-center justify-between pb-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-50'}`}>
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                  {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-sans font-bold text-sm">Contrast Theme</h3>
                  <p className={`text-xs font-sans mt-1 ${textMuted}`}>Toggle between light and dark contrast mode for the whole app</p>
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
            <div className={`flex items-center justify-between pb-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-50'}`}>
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-sm">Daily Mood Reminders</h3>
                  <p className={`text-xs font-sans mt-1 ${textMuted}`}>Receive mock push alerts reminding self-checks</p>
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

            {/* Data Export core button - Excel format */}
            <div className="pt-4 flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-sm">Export Mind Archives</h3>
                <p className={`text-xs font-sans mt-0.5 ${textMuted}`}>Download all journals, moods, notifications & community posts as Excel (.xlsx)</p>
              </div>
              <button
                onClick={handleExportData}
                disabled={exporting}
                id="export-archive-btn"
                className="px-5 py-2.5 bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40 text-xs font-sans font-bold rounded-xl tracking-wide transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {exporting ? 'Building Excel...' : 'Download Excel'}
              </button>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
