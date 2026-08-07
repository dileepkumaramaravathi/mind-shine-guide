/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Calendar, Sparkles, Smile, MessageSquare, Flame } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsProps {
  token: string;
}

export default function Notifications({ token }: NotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/read/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Would you like to securely delete all notifications history?')) return;
    try {
      const res = await fetch('/api/notifications/clear', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications([]);
        setSuccessMsg('Successfully cleared notifications center.');
        setTimeout(() => setSuccessMsg(null), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper styles for different alerts types
  const typeConfig = {
    system: {
      color: 'bg-violet-100 text-violet-700',
      icon: <Bell className="w-5.5 h-5.5" />,
      label: 'System Notification',
    },
    milestone: {
      color: 'bg-amber-100 text-amber-700',
      icon: <Flame className="w-5.5 h-5.5 shrink-0" />,
      label: 'Milestone Unlocked',
    },
    support: {
      color: 'bg-rose-100 text-rose-700',
      icon: <Smile className="w-5.5 h-5.5" />,
      label: 'Emotional Support Notice',
    },
    report: {
      color: 'bg-indigo-100 text-indigo-700',
      icon: <Sparkles className="w-5.5 h-5.5" />,
      label: 'Gemini AI Report Ready',
    },
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in" id="notification-center-panel">
      
      {/* Upper header summary */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100" id="notif-header">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 text-white rounded-2xl relative">
            <Bell className="w-5.5 h-5.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-sans font-bold text-white shrink-0">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-[#111827] text-lg">Notifications Feed</h1>
            <p className="text-[11px] font-sans text-slate-400">Keep close tabs on achievements, recommendations, and supportive events</p>
          </div>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            id="clear-all-notif-btn"
            className="px-4 py-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-150 text-slate-600 text-xs font-sans font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Clear All History
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 bg-teal-50 border border-teal-100 text-teal-700 rounded-2xl text-xs font-sans font-semibold">
          {successMsg}
        </div>
      )}

      {/* Main List canvas */}
      <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-50 overflow-hidden shadow-xs" id="notif-list-card">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-350">
            <span className="w-8 h-8 border-3 border-violet-100 border-t-violet-600 rounded-full animate-spin"></span>
            <span className="text-xs font-sans mt-3">Refining safe inbox cycles...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-24 text-center text-slate-400 space-y-4" id="empty-notif-state">
            <div className="p-4 bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto">
              📭
            </div>
            <div>
              <h3 className="font-sans font-bold text-slate-700">Notifications inbox is tranquil</h3>
              <p className="font-sans text-xs max-w-sm mt-1 mx-auto leading-relaxed">
                As you actively record daily mood states, complete breathing meditations, or share community cards, customized achievements and support feeds will appear here.
              </p>
            </div>
          </div>
        ) : (
          notifications.map((notif) => {
            const cfg = typeConfig[notif.type] || typeConfig.system;
            return (
              <div
                key={notif.id}
                className={`p-6 transition duration-150 flex items-start gap-4 hover:bg-slate-50/50 ${
                  notif.read ? 'opacity-70 bg-white' : 'bg-violet-50/15'
                }`}
                id={`notif-item-${notif.id}`}
              >
                {/* Colored icon wrap */}
                <div className={`p-3 rounded-2xl shrink-0 ${cfg.color}`} id={`notif-icowrap-${notif.id}`}>
                  {cfg.icon}
                </div>

                {/* Text Content block */}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md text-slate-500">
                      {cfg.label}
                    </span>
                    {!notif.read && (
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-rose-100 px-2 py-0.5 rounded-md text-rose-700 animate-pulse">
                        Unread Alert
                      </span>
                    )}
                  </div>

                  <h3 className="font-sans font-bold text-slate-800 text-sm leading-snug">
                    {notif.title}
                  </h3>

                  <p className="font-sans text-xs text-slate-400 leading-relaxed pt-0.5">
                    {notif.message}
                  </p>

                  <div className="flex items-center gap-1.5 pt-2 text-[10px] text-slate-400 font-sans">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(notif.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Rightmost action: Mark as read button */}
                {!notif.read && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    title="Mark secure notification read"
                    id={`notif-read-btn-${notif.id}`}
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 text-indigo-600 rounded-xl transition shrink-0 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
