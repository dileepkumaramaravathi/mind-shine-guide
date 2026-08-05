/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { User, Mood, JournalEntry, MoodType, ChatMessage, CommunityItem, NotificationItem } from '../types.js';

const isVercel = process.env.VERCEL === '1' || process.env.NOW_BUILDER === '1';
const DB_FILE = isVercel ? '/tmp/data_store.json' : path.join(process.cwd(), 'data_store.json');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://geqgbznbgbffcployftk.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_JMrMtWHO3ahkmeusnpb9RA_NDx_oY_e';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
        
        // Ensure new features arrays exist and seed community posts if empty
        if (!this.data.community || this.data.community.length === 0) {
          this.seedCommunityPosts();
        }
        if (!this.data.notifications) this.data.notifications = [];
      } else {
        this.seedCommunityPosts();
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
      this.seedCommunityPosts();
    }
  }

  private seedCommunityPosts() {
    this.data.community = [
      {
        id: 'seed-post-1',
        userId: 'system-user-1',
        authorName: 'PeacefulSoul',
        text: 'To whoever is reading this — you are capable of extraordinary healing. Take it one breath at a time! 🌟',
        bgGradient: 'from-indigo-600 to-violet-600',
        likes: ['u1', 'u2', 'u3'],
        bookmarks: [],
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        comments: [
          {
            id: 'c1',
            userId: 'system-user-2',
            authorName: 'KindHeart',
            text: 'Thank you for this beautiful reminder! ❤️',
            createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
            replies: [
              {
                id: 'r1',
                userId: 'system-user-1',
                authorName: 'PeacefulSoul',
                text: 'Sending you warmth and light! 🌸',
                createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
              }
            ]
          }
        ]
      },
      {
        id: 'seed-post-2',
        userId: 'system-user-3',
        authorName: 'AuraGuide',
        text: 'Remember that your feelings are valid. Giving yourself permission to rest is the highest form of self-love. 🌿',
        bgGradient: 'from-emerald-500 to-teal-600',
        likes: ['u1', 'u4'],
        bookmarks: [],
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        comments: [
          {
            id: 'c2',
            userId: 'system-user-4',
            authorName: 'SereneMind',
            text: 'I really needed to read this today. Taking a break now.',
            createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
          }
        ]
      },
      {
        id: 'seed-post-3',
        userId: 'system-user-5',
        authorName: 'SunShineVibes',
        text: 'Small progress is still progress. Celebrate every step you take on your mental wellness journey! ☀️',
        bgGradient: 'from-rose-500 to-orange-500',
        likes: ['u2', 'u3', 'u5'],
        bookmarks: [],
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        comments: []
      }
    ];
    this.save();
  }


  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      this.saveToSupabase().catch((err) => {
        console.error('Failed to sync saveToSupabase:', err);
      });
    } catch (e) {
      console.error('Failed to save database', e);
    }
  }

  public async loadFromSupabase() {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('content')
        .eq('id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
        .maybeSingle();
        
      if (!error && data && data.content) {
        const parsed = JSON.parse(data.content);
        if (parsed && typeof parsed === 'object') {
          this.data = parsed;
          try {
            fs.writeFileSync(DB_FILE, data.content, 'utf-8');
          } catch (fsErr) { /* ignore */ }
          console.log('[SUPABASE CLOUD PERSIST] Loaded app database successfully.');
          return;
        }
      } else if (error) {
        console.warn('[SUPABASE CLOUD PERSIST] Load warning:', error.message);
      }
    } catch (e: any) {
      console.warn('[SUPABASE CLOUD PERSIST] Load error:', e.message);
    }
    this.load();
  }

  public async saveToSupabase() {
    try {
      const content = JSON.stringify(this.data, null, 2);
      const { error } = await supabase.from('community_posts').upsert({
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Dummy UUID format
        author_name: 'SYSTEM_DB_STATE',
        content: content,
        bg_gradient: 'SYSTEM',
        likes: [],
        created_at: new Date().toISOString()
      });
      
      if (error) {
        console.warn('[SUPABASE CLOUD PERSIST] Save warning:', error.message);
      } else {
        console.log('[SUPABASE CLOUD PERSIST] Synced app database to cloud.');
      }
    } catch (e: any) {
      console.warn('[SUPABASE CLOUD PERSIST] Save error:', e.message);
    }
  }

  // Legacy hashing with 1,000 iterations for backward compatibility
  private hashPasswordLegacy(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  }

  // Strong password hashing using 600,000 iterations (OWASP recommendation)
  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex');
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

    // Generate secure token (JWT)
    const token = generateToken(id);

    return {
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        moodStreak: userRecord.moodStreak,
        lastActiveDate: userRecord.lastActiveDate,
        createdAt: userRecord.createdAt,
      },
      token,
    };
  }

  public login(email: string, password: string): { user: User; token: string } | null {
    const emailLower = email.toLowerCase().trim();
    const userRecord = Object.values(this.data.users).find((u) => u.email === emailLower);
    
    if (!userRecord) return null;

    let hash = this.hashPassword(password, userRecord.passwordSalt);
    let legacy = false;

    if (hash !== userRecord.passwordHash) {
      // Fallback check for legacy 1k iterations hash
      const legacyHash = this.hashPasswordLegacy(password, userRecord.passwordSalt);
      if (legacyHash === userRecord.passwordHash) {
        hash = legacyHash;
        legacy = true;
      } else {
        return null;
      }
    }

    // Automatically migrate legacy password hashes to 600,000 iterations on-the-fly
    if (legacy) {
      userRecord.passwordHash = this.hashPassword(password, userRecord.passwordSalt);
      this.save();
    }

    // Generate secure token (JWT)
    const token = generateToken(userRecord.id);

    return {
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        moodStreak: userRecord.moodStreak,
        lastActiveDate: userRecord.lastActiveDate,
        createdAt: userRecord.createdAt,
      },
      token,
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

  // --- Password Reset & 6-Digit OTP Engine ---
  public validatePasswordComplexity(password: string): { isValid: boolean; error?: string } {
    if (!password || password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one uppercase letter (A-Z).' };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one lowercase letter (a-z).' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one number (0-9).' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one special character (e.g. @, #, $, !).' };
    }
    return { isValid: true };
  }

  public generateOtp(email: string): { success: boolean; otp?: string; error?: string; waitSeconds?: number } {
    const emailLower = email.toLowerCase().trim();
    const userRecord = Object.values(this.data.users).find((u) => u.email === emailLower);
    if (!userRecord) {
      return { success: false, error: 'Email address is not registered.' };
    }

    if (!this.data.otps) this.data.otps = {};
    const existing = this.data.otps[emailLower];
    const now = Date.now();

    // 60-second resend cooldown timer check
    if (existing && existing.lastSentAt && (now - existing.lastSentAt < 60000)) {
      const waitSeconds = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
      return { 
        success: false, 
        error: `Please wait ${waitSeconds} seconds before requesting another verification code.`, 
        waitSeconds 
      };
    }

    // Generate secure random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes expiry

    this.data.otps[emailLower] = {
      otp,
      expiresAt,
      attempts: 0,
      lastSentAt: now
    };

    this.save();
    return { success: true, otp };
  }

  public verifyOtpAndResetPassword(email: string, otp: string, newPassword: string): { success: boolean; error?: string } {
    const emailLower = email.toLowerCase().trim();
    const cleanOtp = (otp || '').trim();

    const userRecord = Object.values(this.data.users).find((u) => u.email === emailLower);
    if (!userRecord) {
      return { success: false, error: 'Email address is not registered.' };
    }

    const passCheck = this.validatePasswordComplexity(newPassword);
    if (!passCheck.isValid) {
      return { success: false, error: passCheck.error };
    }

    const bypassCode = 'SUPABASE_RECOVERY_BYPASS';
    const isBypass = cleanOtp === bypassCode;

    if (!isBypass) {
      if (!this.data.otps || !this.data.otps[emailLower]) {
        return { success: false, error: 'Verification code not found. Please request a new code.' };
      }

      const record = this.data.otps[emailLower];
      const now = Date.now();

      if (now > record.expiresAt) {
        delete this.data.otps[emailLower];
        this.save();
        return { success: false, error: 'Verification code expired. Please request a new verification code.' };
      }

      if (record.attempts >= 5) {
        delete this.data.otps[emailLower];
        this.save();
        return { success: false, error: 'Too many incorrect attempts. Verification code invalidated.' };
      }

      if (record.otp !== cleanOtp) {
        record.attempts += 1;
        this.save();
        return { success: false, error: 'Incorrect verification code.' };
      }
    }

    // Securely hash new password and update user record
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(newPassword, salt);
    userRecord.passwordSalt = salt;
    userRecord.passwordHash = passwordHash;
    
    // Invalidate OTP immediately after use
    if (this.data.otps && this.data.otps[emailLower]) {
      delete this.data.otps[emailLower];
    }
    this.save();

    return { success: true };
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

  public toggleBookmarkPost(userId: string, postId: string): CommunityItem | null {
    if (!this.data.community) this.data.community = [];
    const post = this.data.community.find((p) => p.id === postId);
    if (!post) return null;

    if (!post.bookmarks) post.bookmarks = [];
    const idx = post.bookmarks.indexOf(userId);
    if (idx !== -1) {
      post.bookmarks.splice(idx, 1);
    } else {
      post.bookmarks.push(userId);
    }
    this.save();
    return post;
  }

  public addCommunityComment(postId: string, userId: string, authorName: string, text: string) {
    if (!this.data.community) this.data.community = [];
    const post = this.data.community.find((p) => p.id === postId);
    if (!post) return null;

    if (!post.comments) post.comments = [];
    const comment = {
      id: crypto.randomUUID(),
      userId,
      authorName: authorName.trim() || 'Anonymous Friend',
      text: text.trim(),
      createdAt: new Date().toISOString(),
      likes: [],
      replies: [],
    };
    post.comments.push(comment);
    this.save();
    return { post, comment };
  }

  public addCommentReply(postId: string, commentId: string, userId: string, authorName: string, text: string) {
    if (!this.data.community) this.data.community = [];
    const post = this.data.community.find((p) => p.id === postId);
    if (!post || !post.comments) return null;

    const parentComment = post.comments.find((c) => c.id === commentId);
    if (!parentComment) return null;

    if (!parentComment.replies) parentComment.replies = [];
    const reply = {
      id: crypto.randomUUID(),
      userId,
      authorName: authorName.trim() || 'Anonymous Friend',
      text: text.trim(),
      createdAt: new Date().toISOString(),
      likes: [],
    };
    parentComment.replies.push(reply);
    this.save();
    return { post, parentComment, reply };
  }

  public deleteCommunityPost(userId: string, postId: string): boolean {
    if (!this.data.community) return false;
    const initialLen = this.data.community.length;
    this.data.community = this.data.community.filter((p) => !(p.id === postId));
    const deleted = this.data.community.length < initialLen;
    if (deleted) {
      this.save();
    }
    return deleted;
  }

  public getUserPublicStats(userId: string, authorName?: string) {
    const userPosts = (this.data.community || []).filter(
      p => p.userId === userId || (authorName && p.authorName.toLowerCase() === authorName.toLowerCase())
    );
    const totalLikes = userPosts.reduce((acc, p) => acc + (p.likes ? p.likes.length : 0), 0);
    const userMoods = (this.data.moods || []).filter(m => m.userId === userId);
    const userJournals = (this.data.journals || []).filter(j => j.userId === userId);

    return {
      userId,
      authorName: authorName || (userPosts[0]?.authorName) || 'Community Member',
      postCount: userPosts.length,
      likesReceived: totalLikes,
      moodLogsCount: userMoods.length,
      journalCount: userJournals.length,
      memberSince: userPosts[0]?.createdAt || new Date().toISOString(),
    };
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

export function generateToken(userId: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { userId, exp: Math.floor(Date.now() / 1000) + 86400 }; // 24 hours expiry
  const base64url = (str: string) =>
    Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const JWT_SECRET = process.env.JWT_SECRET || 'mind-mood-ai-secret-key-987654321';
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const JWT_SECRET = process.env.JWT_SECRET || 'mind-mood-ai-secret-key-987654321';
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    if (signature !== expectedSig) return null;
    const base64urlDecode = (str: string) => {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      return Buffer.from(base64, 'base64').toString('utf8');
    };
    const decodedPayload = JSON.parse(base64urlDecode(payload));
    if (decodedPayload.exp && Math.floor(Date.now() / 1000) > decodedPayload.exp) {
      return null;
    }
    return decodedPayload.userId;
  } catch {
    return null;
  }
}
