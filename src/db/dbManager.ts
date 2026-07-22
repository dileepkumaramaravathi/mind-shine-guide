/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Mood, JournalEntry, MoodType, ChatMessage, CommunityItem, NotificationItem } from '../types';

const DB_FILE = path.join(process.cwd(), 'data_store.json');

interface UserRecord extends User {
  passwordHash: string;
  passwordSalt: string;
}

interface DatabaseSchema {
  users: { [id: string]: UserRecord };
  moods: Mood[];
  journals: JournalEntry[];
  chats: { [userId: string]: ChatMessage[] };
  community: CommunityItem[];
  notifications: NotificationItem[];
}

class DBManager {
  private data: DatabaseSchema = {
    users: {},
    moods: [],
    journals: [],
    chats: {},
    community: [],
    notifications: [],
  };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const contents = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(contents);
        
        // Ensure new features arrays exist to prevent runtime errors with older assets
        if (!this.data.community) this.data.community = [];
        if (!this.data.notifications) this.data.notifications = [];
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Failed to load database, using empty schema', e);
      this.data = {
        users: {},
        moods: [],
        journals: [],
        chats: {},
        community: [],
        notifications: [],
      };
    }
  }


  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save database', e);
    }
  }

  // Password Utility using Native Crypto
  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  }

  // --- Auth Methods ---
  public register(name: string, email: string, password: string): { user: User; token: string } | null {
    const emailLower = email.toLowerCase().trim();
    
    // Check if user exists
    const exists = Object.values(this.data.users).some((u) => u.email === emailLower);
    if (exists) return null;

    const id = crypto.randomUUID();
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(password, salt);

    const userRecord: UserRecord = {
      id,
      name: name.trim(),
      email: emailLower,
      moodStreak: 0,
      createdAt: new Date().toISOString(),
      passwordHash,
      passwordSalt: salt,
    };

    this.data.users[id] = userRecord;
    this.save();

    // Generate simple token string (User ID serves as simple persistent token)
    return {
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        moodStreak: userRecord.moodStreak,
        lastActiveDate: userRecord.lastActiveDate,
        createdAt: userRecord.createdAt,
      },
      token: userRecord.id,
    };
  }

  public login(email: string, password: string): { user: User; token: string } | null {
    const emailLower = email.toLowerCase().trim();
    const userRecord = Object.values(this.data.users).find((u) => u.email === emailLower);
    
    if (!userRecord) return null;

    const hash = this.hashPassword(password, userRecord.passwordSalt);
    if (hash !== userRecord.passwordHash) return null;

    // Return user with token
    return {
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        moodStreak: userRecord.moodStreak,
        lastActiveDate: userRecord.lastActiveDate,
        createdAt: userRecord.createdAt,
      },
      token: userRecord.id,
    };
  }

  public getUser(id: string): User | null {
    const record = this.data.users[id];
    if (!record) return null;
    return {
      id: record.id,
      name: record.name,
      email: record.email,
      moodStreak: record.moodStreak,
      lastActiveDate: record.lastActiveDate,
      createdAt: record.createdAt,
    };
  }

  // --- Password Reset Helper Methods ---
  private resetCodes: { [email: string]: string } = {};

  public generateResetCode(email: string): string | null {
    const emailLower = email.toLowerCase().trim();
    const exists = Object.values(this.data.users).some((u) => u.email === emailLower);
    if (!exists) return null;

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    this.resetCodes[emailLower] = code;
    return code;
  }

  public verifyResetCode(email: string, code: string): boolean {
    const emailLower = email.toLowerCase().trim();
    return this.resetCodes[emailLower] === code;
  }

  public clearResetCode(email: string): void {
    const emailLower = email.toLowerCase().trim();
    delete this.resetCodes[emailLower];
  }

  public resetPasswordByEmail(email: string, newPassword: string): boolean {
    const emailLower = email.toLowerCase().trim();
    const userRecord = Object.values(this.data.users).find((u) => u.email === emailLower);
    if (!userRecord) return false;

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(newPassword, salt);

    userRecord.passwordSalt = salt;
    userRecord.passwordHash = passwordHash;
    this.save();
    return true;
  }

  // --- Mood Methods ---
  public addMood(userId: string, moodType: MoodType, intensity: number, note: string): Mood {
    const id = crypto.randomUUID();
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD in local/server time

    const newMood: Mood = {
      id,
      userId,
      moodType,
      intensity,
      note: note.trim(),
      date: todayStr,
      createdAt: new Date().toISOString(),
    };

    this.data.moods.push(newMood);

    // Update streak logic
    const user = this.data.users[userId];
    if (user) {
      const yesterdayStr = this.getYesterdayString();
      const lastActive = user.lastActiveDate;

      if (!lastActive) {
        // First mood ever
        user.moodStreak = 1;
      } else if (lastActive === yesterdayStr) {
        // Continued from yesterday
        user.moodStreak += 1;
      } else if (lastActive === todayStr) {
        // Already recorded mood today, streak stays the same
      } else {
        // Break in streak, reset to 1
        user.moodStreak = 1;
      }
      user.lastActiveDate = todayStr;
    }

    this.save();
    return newMood;
  }

  private getYesterdayString(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  public getTodayMood(userId: string): Mood | null {
    const todayStr = new Date().toISOString().split('T')[0];
    const found = this.data.moods.find((m) => m.userId === userId && m.date === todayStr);
    return found || null;
  }

  public getMoodHistory(userId: string): Mood[] {
    return this.data.moods
      .filter((m) => m.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- Journal Methods ---
  public addJournal(userId: string, text: string, moodTag: MoodType): JournalEntry {
    const id = crypto.randomUUID();
    const newEntry: JournalEntry = {
      id,
      userId,
      text: text.trim(),
      moodTag,
      createdAt: new Date().toISOString(),
    };

    this.data.journals.push(newEntry);
    this.save();
    return newEntry;
  }

  public getAllJournals(userId: string): JournalEntry[] {
    return this.data.journals
      .filter((j) => j.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public deleteJournal(userId: string, journalId: string): boolean {
    const initialLen = this.data.journals.length;
    this.data.journals = this.data.journals.filter((j) => !(j.id === journalId && j.userId === userId));
    const deleted = this.data.journals.length < initialLen;
    if (deleted) {
      this.save();
    }
    return deleted;
  }

  // --- Chat Helper Memory ---
  public getChatHistory(userId: string): ChatMessage[] {
    return this.data.chats[userId] || [];
  }

  public saveChatMessage(userId: string, sender: 'user' | 'ai', text: string): ChatMessage {
    if (!this.data.chats[userId]) {
      this.data.chats[userId] = [];
    }
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender,
      text,
      timestamp: new Date().toISOString(),
    };
    
    // Store last 40 messages to avoid over-filling file, while keeping great memory
    this.data.chats[userId].push(newMessage);
    if (this.data.chats[userId].length > 40) {
      this.data.chats[userId] = this.data.chats[userId].slice(-40);
    }
    
    this.save();
    return newMessage;
  }

  public clearChatHistory(userId: string): void {
    this.data.chats[userId] = [];
    this.save();
  }

  // --- Community Affirmation Methods ---
  public getCommunityPosts(): CommunityItem[] {
    return (this.data.community || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public addCommunityPost(userId: string, authorName: string, text: string, bgGradient: string): CommunityItem {
    const id = crypto.randomUUID();
    const newPost: CommunityItem = {
      id,
      userId,
      authorName: authorName.trim() || 'Anonymous Companion',
      text: text.trim(),
      bgGradient: bgGradient || 'from-violet-600 to-indigo-600',
      likes: [],
      createdAt: new Date().toISOString(),
    };

    if (!this.data.community) {
      this.data.community = [];
    }
    this.data.community.push(newPost);
    this.save();
    return newPost;
  }

  public toggleLikePost(userId: string, postId: string): CommunityItem | null {
    if (!this.data.community) this.data.community = [];
    const post = this.data.community.find((p) => p.id === postId);
    if (!post) return null;

    if (!post.likes) post.likes = [];
    const idx = post.likes.indexOf(userId);
    if (idx !== -1) {
      // Unlike
      post.likes.splice(idx, 1);
    } else {
      // Like
      post.likes.push(userId);
    }
    this.save();
    return post;
  }

  // --- Notification Methods ---
  public getNotifications(userId: string): NotificationItem[] {
    if (!this.data.notifications) this.data.notifications = [];
    return this.data.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addNotification(
    userId: string,
    title: string,
    message: string,
    type: 'system' | 'milestone' | 'support' | 'report'
  ): NotificationItem {
    const id = crypto.randomUUID();
    const newNotif: NotificationItem = {
      id,
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };

    if (!this.data.notifications) {
      this.data.notifications = [];
    }
    this.data.notifications.push(newNotif);
    this.save();
    return newNotif;
  }

  public markNotificationRead(userId: string, id: string): boolean {
    if (!this.data.notifications) this.data.notifications = [];
    const notif = this.data.notifications.find((n) => n.id === id && n.userId === userId);
    if (notif) {
      notif.read = true;
      this.save();
      return true;
    }
    return false;
  }

  public clearAllNotifications(userId: string): void {
    if (!this.data.notifications) this.data.notifications = [];
    this.data.notifications = this.data.notifications.filter((n) => n.userId !== userId);
    this.save();
  }
}

export const db = new DBManager();
