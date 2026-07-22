/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  moodStreak: number;
  lastActiveDate?: string;
  createdAt: string;
}

export type MoodType = 'happy' | 'neutral' | 'sad' | 'angry' | 'tired';

export interface Mood {
  id: string;
  userId: string;
  moodType: MoodType;
  intensity: number; // 1 to 5
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  text: string;
  moodTag: MoodType;
  createdAt: string; // ISO String
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface MoodAnalysis {
  emotion: string; // Positive, Negative, Neutral, Stress, Anxiety
  summary: string;
  suggestions: string[];
  quote: string;
}

export interface WeeklyInsight {
  moodDistribution: { [key in MoodType]?: number };
  weeklyStreak: number;
  reportSummary: string;
  copingAdvice: string[];
}

export interface CommunityItem {
  id: string;
  userId: string;
  authorName: string;
  text: string;
  bgGradient: string;
  likes: string[]; // List of user IDs who liked it
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'system' | 'milestone' | 'support' | 'report';
  read: boolean;
  createdAt: string;
}

export interface WellnessScore {
  score: number;
  breakdown: {
    streakScore: number;
    loggingScore: number;
    positivityScore: number;
    journalScore: number;
  };
  evaluationName: string;
  summary: string;
}

