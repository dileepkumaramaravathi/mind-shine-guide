/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Mood, JournalEntry, ChatMessage, CommunityItem, NotificationItem, MoodType } from '../types';

function getUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

interface UserRecord extends User {
  passwordHash: string;
}

interface DatabaseSchema {
  users: { [id: string]: UserRecord };
  moods: Mood[];
  journals: JournalEntry[];
  chatHistory: { [userId: string]: ChatMessage[] };
  community: CommunityItem[];
  notifications: NotificationItem[];
}

const STORAGE_KEY = 'mind_mood_local_db';

const INITIAL_DB: DatabaseSchema = {
  users: {
    'sravani-session-token': {
      id: 'sravani-session-token',
      name: 'sravani',
      email: 'jampalasravani12@gmail.com',
      passwordHash: 'Password123',
      moodStreak: 2,
    }
  },
  moods: [
    {
      id: 'm-init-1',
      userId: 'sravani-session-token',
      moodType: 'happy',
      intensity: 8,
      note: 'Started using the mental companion guide app.',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    }
  ],
  journals: [
    {
      id: 'j-init-1',
      userId: 'sravani-session-token',
      text: 'Taking proactive steps towards my emotional wellness feels reassuring. Excited to use the AI chatbot and guided meditation exercises.',
      moodTag: 'Happy',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      aiAnalysis: {
        emotion: 'Positive',
        summary: 'The user is feeling hopeful and positive about starting their wellness journey.',
        suggestions: [
          'Log your mood daily to build tracking streaks.',
          'Try a 5-minute breathing session in the morning.'
        ],
        quote: 'The journey of a thousand miles begins with a single step. — Lao Tzu'
      }
    }
  ],
  chatHistory: {},
  community: [
    {
      id: 'c-init-1',
      author: 'MindfulExplorer',
      text: 'Breathe. Letting go of pressure is a beautiful gift to your nervous system. 🧘',
      likes: 6,
      likedBy: [],
      timestamp: new Date().toISOString(),
    },
    {
      id: 'c-init-2',
      author: 'PeaceFinder',
      text: 'You are resilient, capable, and doing better than you give yourself credit for!',
      likes: 12,
      likedBy: [],
      timestamp: new Date().toISOString(),
    }
  ],
  notifications: [
    {
      id: 'n-init-1',
      userId: 'sravani-session-token',
      title: 'Welcome to Mind Mood AI 💜',
      text: 'Your private space is established. Inhale calm and write down your goals.',
      type: 'system',
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: 'n-init-2',
      userId: 'sravani-session-token',
      title: 'Dynamic Wellness Score active',
      text: 'Track your daily habits and breathing cycle achievements to upgrade your dynamic score metrics.',
      type: 'milestone',
      timestamp: new Date().toISOString(),
      read: false,
    }
  ]
};

class LocalDatabase {
  private getDb(): DatabaseSchema {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.saveDb(INITIAL_DB);
      return INITIAL_DB;
    }
    try {
      return JSON.parse(raw);
    } catch {
      this.saveDb(INITIAL_DB);
      return INITIAL_DB;
    }
  }

  private saveDb(db: DatabaseSchema) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }

  public register(name: string, email: string, passwordHash: string) {
    const db = this.getDb();
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check duplicate
    const exists = Object.values(db.users).some(u => u.email.toLowerCase() === normalizedEmail);
    if (exists) return null;

    const userId = `token-${getUUID()}`;
    const newUser: UserRecord = {
      id: userId,
      name,
      email: normalizedEmail,
      passwordHash,
      moodStreak: 0
    };

    db.users[userId] = newUser;
    this.saveDb(db);

    this.addNotification(userId, 'Welcome to Mind Mood AI 💜', 'Your private space is established. Inhale calm.', 'system');

    return { token: userId, user: { id: userId, name, email: normalizedEmail, moodStreak: 0 } };
  }

  public login(email: string, passwordHash: string) {
    const db = this.getDb();
    const normalizedEmail = email.toLowerCase().trim();
    const user = Object.values(db.users).find(u => u.email.toLowerCase() === normalizedEmail && u.passwordHash === passwordHash);
    if (!user) return null;

    return { token: user.id, user: { id: user.id, name: user.name, email: user.email, moodStreak: user.moodStreak } };
  }

  public getUser(userId: string): User | null {
    const db = this.getDb();
    const user = db.users[userId];
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email, moodStreak: user.moodStreak };
  }

  public getMoodToday(userId: string): Mood | null {
    const db = this.getDb();
    const today = new Date().toISOString().split('T')[0];
    return db.moods.find(m => m.userId === userId && m.date === today) || null;
  }

  public addMood(userId: string, moodType: MoodType, intensity: number, note: string): { mood: Mood; user: User } {
    const db = this.getDb();
    const today = new Date().toISOString().split('T')[0];

    // Remove existing today mood if logging again
    db.moods = db.moods.filter(m => !(m.userId === userId && m.date === today));

    const newMood: Mood = {
      id: `mood-${getUUID()}`,
      userId,
      moodType,
      intensity,
      note,
      date: today,
      timestamp: new Date().toISOString(),
    };

    db.moods.unshift(newMood);

    // Dynamic Streak Management
    const user = db.users[userId];
    if (user) {
      // Basic simulation check: check yesterday's log to see if we increment streak
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const hadYesterday = db.moods.some(m => m.userId === userId && m.date === yesterday);
      if (hadYesterday) {
        user.moodStreak = (user.moodStreak || 0) + 1;
      } else {
        user.moodStreak = 1;
      }
      db.users[userId] = user;
    }

    this.saveDb(db);
    return { mood: newMood, user: { id: user.id, name: user.name, email: user.email, moodStreak: user.moodStreak } };
  }

  public getMoodHistory(userId: string): Mood[] {
    const db = this.getDb();
    return db.moods.filter(m => m.userId === userId);
  }

  public getJournals(userId: string): JournalEntry[] {
    const db = this.getDb();
    return db.journals.filter(j => j.userId === userId);
  }

  public addJournal(userId: string, text: string, moodTag: string, aiAnalysis?: any): JournalEntry {
    const db = this.getDb();
    const newJournal: JournalEntry = {
      id: `journal-${getUUID()}`,
      userId,
      text,
      moodTag,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      aiAnalysis
    };
    db.journals.unshift(newJournal);
    this.saveDb(db);
    return newJournal;
  }

  public deleteJournal(userId: string, id: string): boolean {
    const db = this.getDb();
    const initialLen = db.journals.length;
    db.journals = db.journals.filter(j => !(j.userId === userId && j.id === id));
    this.saveDb(db);
    return db.journals.length < initialLen;
  }

  public getNotifications(userId: string): NotificationItem[] {
    const db = this.getDb();
    return db.notifications.filter(n => n.userId === userId);
  }

  public addNotification(userId: string, title: string, text: string, type: 'system' | 'milestone' | 'plaza') {
    const db = this.getDb();
    const newNotif: NotificationItem = {
      id: `notif-${getUUID()}`,
      userId,
      title,
      text,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    db.notifications.unshift(newNotif);
    this.saveDb(db);
  }

  public markNotificationRead(userId: string, id: string): boolean {
    const db = this.getDb();
    const notif = db.notifications.find(n => n.userId === userId && n.id === id);
    if (notif) {
      notif.read = true;
      this.saveDb(db);
      return true;
    }
    return false;
  }

  public getCommunity(): CommunityItem[] {
    const db = this.getDb();
    return db.community;
  }

  public addCommunityItem(author: string, text: string): CommunityItem {
    const db = this.getDb();
    const newItem: CommunityItem = {
      id: `comm-${getUUID()}`,
      author,
      text,
      likes: 0,
      likedBy: [],
      timestamp: new Date().toISOString(),
    };
    db.community.unshift(newItem);
    this.saveDb(db);
    return newItem;
  }

  public toggleLikeCommunityItem(userId: string, id: string): CommunityItem | null {
    const db = this.getDb();
    const item = db.community.find(c => c.id === id);
    if (!item) return null;

    if (!item.likedBy) item.likedBy = [];

    const idx = item.likedBy.indexOf(userId);
    if (idx > -1) {
      item.likedBy.splice(idx, 1);
      item.likes = Math.max(0, item.likes - 1);
    } else {
      item.likedBy.push(userId);
      item.likes += 1;
    }

    this.saveDb(db);
    return item;
  }

  public getChatHistory(userId: string): ChatMessage[] {
    const db = this.getDb();
    return db.chatHistory[userId] || [];
  }

  public saveChatMessage(userId: string, sender: 'user' | 'ai', text: string): ChatMessage {
    const db = this.getDb();
    if (!db.chatHistory[userId]) db.chatHistory[userId] = [];
    const newMsg: ChatMessage = {
      id: `msg-${getUUID()}`,
      sender,
      text,
      timestamp: new Date().toISOString()
    };
    db.chatHistory[userId].push(newMsg);
    this.saveDb(db);
    return newMsg;
  }

  public clearChatHistory(userId: string) {
    const db = this.getDb();
    db.chatHistory[userId] = [];
    this.saveDb(db);
  }
}

export const localDb = new LocalDatabase();
