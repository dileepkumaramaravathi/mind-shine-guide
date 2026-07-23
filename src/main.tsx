import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { localDb } from './lib/localDb.ts';

const originalFetch = window.fetch;

window.fetch = async function (input, init) {
  const url = typeof input === 'string' ? input : input.url;
  
  // Intercept all API database requests to process them in localStorage
  if (url.startsWith('/api/') && !url.includes('/api/ai/chat') && !url.includes('/api/ai/analyze-mood')) {
    const method = init?.method?.toUpperCase() || 'GET';
    const headers = (init?.headers as Record<string, string>) || {};
    const bodyRaw = init?.body ? JSON.parse(init.body.toString()) : null;

    let token = '';
    const authHeader = headers['Authorization'] || headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    let responseData: any = null;
    let status = 200;

    try {
      if (url === '/api/auth/register' && method === 'POST') {
        const result = localDb.register(bodyRaw.name, bodyRaw.email, bodyRaw.password);
        if (!result) {
          status = 400;
          responseData = { error: 'An account with this email already exists.' };
        } else {
          responseData = result;
        }
      } else if (url === '/api/auth/login' && method === 'POST') {
        const result = localDb.login(bodyRaw.email, bodyRaw.password);
        if (!result) {
          status = 400;
          responseData = { error: 'Invalid email or password.' };
        } else {
          responseData = result;
        }
      } else if (url === '/api/auth/profile' && method === 'GET') {
        const user = localDb.getUser(token);
        if (!user) {
          status = 401;
          responseData = { error: 'Unauthorized' };
        } else {
          responseData = { user };
        }
      } else if (url === '/api/mood/today' && method === 'GET') {
        responseData = { mood: localDb.getMoodToday(token) };
      } else if (url === '/api/mood/add' && method === 'POST') {
        responseData = localDb.addMood(token, bodyRaw.moodType, bodyRaw.intensity, bodyRaw.note);
      } else if (url === '/api/mood/history' && method === 'GET') {
        responseData = { moods: localDb.getMoodHistory(token) };
      } else if (url === '/api/journal/all' && method === 'GET') {
        responseData = { journals: localDb.getJournals(token) };
      } else if (url === '/api/journal/add' && method === 'POST') {
        responseData = { journal: localDb.addJournal(token, bodyRaw.text, bodyRaw.moodTag, bodyRaw.aiAnalysis) };
      } else if (url.startsWith('/api/journal/') && method === 'DELETE') {
        const id = url.split('/').pop() || '';
        const success = localDb.deleteJournal(token, id);
        responseData = { success };
      } else if (url === '/api/notifications' && method === 'GET') {
        responseData = { notifications: localDb.getNotifications(token) };
      } else if (url.startsWith('/api/notifications/read/') && method === 'POST') {
        const id = url.split('/').pop() || '';
        const success = localDb.markNotificationRead(token, id);
        responseData = { success };
      } else if (url === '/api/community' && method === 'GET') {
        responseData = { items: localDb.getCommunity() };
      } else if (url === '/api/community/share' && method === 'POST') {
        const user = localDb.getUser(token);
        responseData = { item: localDb.addCommunityItem(user?.name || 'Anonymous', bodyRaw.text) };
      } else if (url.startsWith('/api/community/like/') && method === 'POST') {
        const id = url.split('/').pop() || '';
        responseData = { item: localDb.toggleLikeCommunityItem(token, id) };
      } else if (url === '/api/meditation/complete' && method === 'POST') {
        localDb.addNotification(token, 'Breathing Loop Mastered 🧘', `Splendid job! You finished a mindful breathing cycle of ${bodyRaw.seconds || 60} seconds. This strengthens neuro-calm centers!`, 'milestone');
        responseData = { success: true };
      } else if (url === '/api/wellness/score' && method === 'GET') {
        const journals = localDb.getJournals(token);
        const moods = localDb.getMoodHistory(token);
        const user = localDb.getUser(token);
        
        let streakScore = 0;
        if (user && user.moodStreak) {
          streakScore = Math.min(user.moodStreak * 10, 30);
        }
        const loggingScore = Math.min(moods.length * 5, 20);
        
        let adaptiveMoodCount = 0;
        const recentTen = moods.slice(0, 10);
        recentTen.forEach(m => {
          if (m.moodType === 'happy' || m.moodType === 'neutral') {
            adaptiveMoodCount++;
          }
        });
        const positivityRate = recentTen.length > 0 ? (adaptiveMoodCount / recentTen.length) : 0.5;
        const positivityScore = Math.round(positivityRate * 20);
        const journalScore = Math.min(journals.length * 5, 10);
        const score = Math.min(10 + streakScore + loggingScore + positivityScore + journalScore, 100);

        let evaluationName = 'Mindful Emerging';
        let summary = 'A solid foundation is laid. Take incremental steps daily: logging emotions and drinking tea can promote awareness.';
        if (score >= 90) {
          evaluationName = 'Sovereign Serenity';
          summary = 'Your wellness activities display masterful, balanced introspection!';
        } else if (score >= 75) {
          evaluationName = 'Balanced Horizon';
          summary = 'Admirable steady progress. You are successfully maintaining streaks and reflecting deeply.';
        } else if (score >= 50) {
          evaluationName = 'Reflective Orbit';
          summary = 'You are steadily observing your mind. Increase reflection exercises to build stronger streaks.';
        }

        responseData = {
          score,
          breakdown: { streakScore, loggingScore, positivityScore, journalScore },
          evaluationName,
          summary
        };
      } else {
        return originalFetch(input, init);
      }
    } catch (e: any) {
      status = 500;
      responseData = { error: e.message || 'Local DB Error' };
    }

    return new Response(JSON.stringify(responseData), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Pass through AI requests to the serverless function endpoint
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
