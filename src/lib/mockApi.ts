/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Mood, JournalEntry, ChatMessage, CommunityItem, NotificationItem, MoodType, WellnessScore } from '../types';

interface ClientDatabase {
  users: { [id: string]: User & { passwordHash: string } };
  moods: Mood[];
  journals: JournalEntry[];
  chats: { [userId: string]: ChatMessage[] };
  community: CommunityItem[];
  notifications: NotificationItem[];
}

const STORAGE_KEY = 'mind_mood_data_store';

function loadDb(): ClientDatabase {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (!parsed.users) parsed.users = {};
      if (!parsed.moods) parsed.moods = [];
      if (!parsed.journals) parsed.journals = [];
      if (!parsed.chats) parsed.chats = {};
      if (!parsed.community) parsed.community = [];
      if (!parsed.notifications) parsed.notifications = [];
      return parsed as ClientDatabase;
    } catch {
      // Ignore and recreate
    }
  }

  const initial: ClientDatabase = {
    users: {},
    moods: [],
    journals: [],
    chats: {},
    community: [
      {
        id: 'mock-comm-1',
        userId: 'system',
        authorName: 'Alex Mercer (Guide)',
        text: 'Remember, deep breathing does not just relax the mind, it physically changes your brain chemistry to help you focus. You possess immense peace within. ✨',
        likes: [],
        bgGradient: 'from-[#6366f1] to-[#a855f7]',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mock-comm-2',
        userId: 'system',
        authorName: 'Clara Oswald',
        text: 'Sharing a cup of dry green tea and mapping my feelings changed my morning routine. I feel more centered now! 🍵💜',
        likes: [],
        bgGradient: 'from-[#14b8a6] to-[#0ea5e9]',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    notifications: []
  };
  saveDb(initial);
  return initial;
}

function saveDb(db: ClientDatabase) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// Generate random UUID
function uuid(): string {
  return 'client-' + Math.random().toString(36).substring(2, 11) + '-' + Math.random().toString(36).substring(2, 11);
}

// Helper to check and update daily mood streaks
function calculateAndUpdateStreak(db: ClientDatabase, userId: string): User {
  const user = db.users[userId];
  if (!user) throw new Error('User not found');

  const userMoods = db.moods
    .filter((m) => m.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (userMoods.length === 0) {
    user.moodStreak = 0;
    saveDb(db);
    return user;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let streak = 0;
  let matchesTodayOrYesterday = false;
  let testDate = todayStr;

  // Simple streak calculator checking backwards
  const uniqueDates = Array.from(new Set(userMoods.map((m) => m.date)));
  
  if (uniqueDates.includes(todayStr)) {
    matchesTodayOrYesterday = true;
  } else if (uniqueDates.includes(yesterdayStr)) {
    matchesTodayOrYesterday = true;
    testDate = yesterdayStr;
  }

  if (matchesTodayOrYesterday) {
    streak = 1;
    let keepChecking = true;
    let checkOffset = 1;
    while (keepChecking) {
      const prevDateStr = new Date(new Date(testDate).getTime() - checkOffset * 86400000).toISOString().split('T')[0];
      if (uniqueDates.includes(prevDateStr)) {
        streak++;
        checkOffset++;
      } else {
        keepChecking = false;
      }
    }
  } else {
    streak = 0;
  }

  user.moodStreak = streak;
  user.lastActiveDate = todayStr;
  saveDb(db);
  return user;
}

export async function handleMockRequest(url: string, options?: RequestInit): Promise<Response> {
  const method = (options?.method || 'GET').toUpperCase();
  const parsedUrl = new URL(url, window.location.origin);
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  const db = loadDb();

  // Try to extract authorization token
  const authHeader = options?.headers ? 
    (options.headers as any)['Authorization'] || (options.headers as any)['authorization'] : null;
  let authUserId: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token.startsWith('mock-token-')) {
      authUserId = token.replace('mock-token-', '');
    }
  }

  // Parse Body if present
  let body: any = {};
  if (options?.body) {
    try {
      body = JSON.parse(options.body as string);
    } catch {
      // ignore
    }
  }

  const jsonResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const errorResponse = (msg: string, status = 400) => {
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  // ==================== ROUTE HANDLING ====================

  // POST: /api/auth/register
  if (pathname === '/api/auth/register' && method === 'POST') {
    const { name, email, password } = body;
    if (!name || !email || !password) {
      return errorResponse('All fields (name, email, password) are required.');
    }
    const emailNorm = email.toLowerCase().trim();
    const existing = Object.values(db.users).find((u) => u.email === emailNorm);
    if (existing) {
      return errorResponse('An account with this email already exists.');
    }

    const userId = uuid();
    const newUser: User & { passwordHash: string } = {
      id: userId,
      name,
      email: emailNorm,
      moodStreak: 0,
      createdAt: new Date().toISOString(),
      passwordHash: password // Mock hashing simple storage
    };

    db.users[userId] = newUser;
    
    // Welcome Notification
    const welcomeNotif: NotificationItem = {
      id: uuid(),
      userId,
      title: 'Welcome to Mind Mood AI 💜',
      message: 'Your resilient client-side safe space matches your authentic goals. Inhale deeply and focus on your wellness.',
      type: 'system',
      read: false,
      createdAt: new Date().toISOString()
    };
    db.notifications.push(welcomeNotif);

    saveDb(db);

    return jsonResponse({
      token: `mock-token-${userId}`,
      user: {
        id: userId,
        name,
        email: emailNorm,
        moodStreak: 0,
        createdAt: newUser.createdAt
      }
    });
  }

  // POST: /api/auth/login
  if (pathname === '/api/auth/login' && method === 'POST') {
    const { email, password } = body;
    if (!email || !password) {
      return errorResponse('Email and password are required.');
    }
    const emailNorm = email.toLowerCase().trim();
    const user = Object.values(db.users).find((u) => u.email === emailNorm && u.passwordHash === password);
    if (!user) {
      return errorResponse('Invalid email or password.', 401);
    }

    return jsonResponse({
      token: `mock-token-${user.id}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        moodStreak: user.moodStreak,
        createdAt: user.createdAt
      }
    });
  }

  // POST: /api/auth/forgot-password
  if (pathname === '/api/auth/forgot-password' && method === 'POST') {
    const { email } = body;
    if (!email) return errorResponse('Email address is required.');

    const emailNorm = email.toLowerCase().trim();
    const user = Object.values(db.users).find((u) => u.email === emailNorm);
    if (!user) {
      return errorResponse('No registered account found with this email.', 404);
    }

    return jsonResponse({
      success: true,
      message: 'A secure offline verification code has been generated.',
      code: 'OFFLINE_PASS_77'
    });
  }

  // POST: /api/auth/reset-password
  if (pathname === '/api/auth/reset-password' && method === 'POST') {
    const { email, code, newPassword } = body;
    if (!email || !code || !newPassword) {
      return errorResponse('Email, verification code, and new password are required.');
    }
    const emailNorm = email.toLowerCase().trim();
    const user = Object.values(db.users).find((u) => u.email === emailNorm);
    if (!user) {
      return errorResponse('Could not resets password. User not found.');
    }

    user.passwordHash = newPassword;
    db.users[user.id] = user;
    
    db.notifications.push({
      id: uuid(),
      userId: user.id,
      title: 'Security Alert: Password Changed 🔑',
      message: 'Your account password was successfully updated locally in secure sandbox storage.',
      type: 'system',
      read: false,
      createdAt: new Date().toISOString()
    });

    saveDb(db);

    return jsonResponse({ success: true, message: 'Password updated. Please sign in.' });
  }

  // Authed Gates
  if (!authUserId) {
    return errorResponse('Unauthorized: Invalid or missing token', 401);
  }

  // GET: /api/auth/profile
  if (pathname === '/api/auth/profile' && method === 'GET') {
    const user = db.users[authUserId];
    if (!user) return errorResponse('User not found', 404);
    return jsonResponse({ user });
  }

  // POST: /api/mood/add
  if (pathname === '/api/mood/add' && method === 'POST') {
    const { moodType, intensity, note } = body;
    if (!moodType || intensity === undefined) {
      return errorResponse('Mood type and intensity are required.');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newMood: Mood = {
      id: uuid(),
      userId: authUserId,
      moodType: moodType as MoodType,
      intensity: Number(intensity),
      note: note || '',
      date: todayStr,
      createdAt: new Date().toISOString()
    };

    db.moods.push(newMood);
    saveDb(db);

    const updatedUser = calculateAndUpdateStreak(db, authUserId);

    db.notifications.push({
      id: uuid(),
      userId: authUserId,
      title: 'Mood Tracked 📊',
      message: `Successfully logged the custom ${moodType} state. Your daily streak is now ${updatedUser.moodStreak}!`,
      type: 'support',
      read: false,
      createdAt: new Date().toISOString()
    });
    saveDb(db);

    return jsonResponse({ mood: newMood, user: updatedUser });
  }

  // GET: /api/mood/today
  if (pathname === '/api/mood/today' && method === 'GET') {
    const todayStr = new Date().toISOString().split('T')[0];
    const mood = db.moods.find((m) => m.userId === authUserId && m.date === todayStr);
    return jsonResponse({ mood: mood || null });
  }

  // GET: /api/mood/history
  if (pathname === '/api/mood/history' && method === 'GET') {
    const history = db.moods
      .filter((m) => m.userId === authUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return jsonResponse({ history });
  }

  // POST: /api/journal/add
  if (pathname === '/api/journal/add' && method === 'POST') {
    const { text, moodTag } = body;
    if (!text || !moodTag) return errorResponse('Text and mood tag are required.');

    const newJournal: JournalEntry = {
      id: uuid(),
      userId: authUserId,
      text,
      moodTag: moodTag as MoodType,
      createdAt: new Date().toISOString()
    };

    db.journals.push(newJournal);
    saveDb(db);

    db.notifications.push({
      id: uuid(),
      userId: authUserId,
      title: 'Reflection Recorded 📝',
      message: `Successfully structured and saved your confidential review under tag '${moodTag}'.`,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString()
    });
    saveDb(db);

    return jsonResponse({ journal: newJournal });
  }

  // GET: /api/journal/all
  if (pathname === '/api/journal/all' && method === 'GET') {
    const journals = db.journals
      .filter((j) => j.userId === authUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return jsonResponse({ journals });
  }

  // DELETE: /api/journal/:id
  if (pathname.startsWith('/api/journal/') && method === 'DELETE') {
    const parts = pathname.split('/');
    const journalId = parts[parts.length - 1];

    const idx = db.journals.findIndex((j) => j.id === journalId && j.userId === authUserId);
    if (idx === -1) {
      return errorResponse('Journal not found or unauthorized deletion', 404);
    }

    db.journals.splice(idx, 1);
    saveDb(db);
    return jsonResponse({ success: true, message: 'Journal entry removed.' });
  }

  // POST: /api/ai/analyze-mood
  if (pathname === '/api/ai/analyze-mood' && method === 'POST') {
    const { text } = body;
    if (!text) return errorResponse('Text content is required.');

    // Heuristics based analysis
    const lower = text.toLowerCase();
    let emotion = 'Neutral';
    let summary = 'Your reflection is valuable and sincere. Expressing your feelings in writing is a wonderful practice of self-observation.';
    let suggestions = [
      'Take 5 conscious, slow and deep breathing cycles.',
      'Sip warm fluid (herbal tea, cocoa) to calm stress sensors.',
      'Establish a cozy offline pocket for 15 minutes of quietude.'
    ];
    let quote = 'The quiet mind is the richest sanctuary of self-discovery. — Lao Tzu';

    if (lower.includes('sad') || lower.includes('depress') || lower.includes('cry') || lower.includes('alone')) {
      emotion = 'Negative';
      summary = 'I hear high echoes of emotional dampening or loneliness. Your mind is indicating a desire for safe respite and sweet recovery.';
      suggestions = [
        'Place a gentle hand on your heart and breathe slowly to soothe adrenaline.',
        'Reach out to one trusted friend or look at a beloved happy memory photograph.',
        'Step outside for exactly 5 minutes to feel sunlight or breeze on your skin.'
      ];
      quote = 'There is hope, even when your brain tells you there isn’t. — John Green';
    } else if (lower.includes('anxious') || lower.includes('worry') || lower.includes('fear') || lower.includes('scared') || lower.includes('panic')) {
      emotion = 'Anxiety';
      summary = 'A state of flight-or-fight anxiety is currently hovering. It represents high nervous system excitation. Let’s bring you slowly back to center.';
      suggestions = [
        'Practice the 5-4-3-2-1 sensory grounding exercise (name 5 sights, 4 sounds, 3 touch sensations, 2 smells, 1 taste).',
        'Inhale slowly for 4 seconds, hold for 4 seconds, exhale for 4 seconds, and repeat.',
        'Wiggle your toes and roll your shoulders back to let tension slip away.'
      ];
      quote = 'Anxiety is a thin stream of fear trickling through the mind. If encouraged, it cuts a channel into which all other thoughts are drained. — Arthur Somers Roche';
    } else if (lower.includes('stress') || lower.includes('busy') || lower.includes('work') || lower.includes('overwhelm') || lower.includes('tired')) {
      emotion = 'Stress';
      summary = 'High overload levels detected. Your cognitive system is handling massive inputs and signals a need for a battery replenishment split.';
      suggestions = [
        'Turn off all glowing digital displays for 10 minutes right now.',
        'Do a gentle spinal twist stretch to release muscular constriction around the thoracic cage.',
        'Commit to doing only one small task and letting go of the entire remaining list for today.'
      ];
      quote = 'Within you, there is a stillness and a sanctuary to which you can retreat at any time. — Hermann Hesse';
    } else if (lower.includes('angry') || lower.includes('mad') || lower.includes('rage') || lower.includes('hate') || lower.includes('fume')) {
      emotion = 'Angry';
      summary = 'Intense emotional energy is pulsing. Anger is a constructive messenger showing a crossed boundary, but it deserves careful, calm releasing.';
      suggestions = [
        'Write down all the triggering, raw feelings on sheet paper and tear it safely into tiny shreds.',
        'Listen to heavy, active music or take quick, stamping, active walks to discharge cortisol.',
        'Wait 10 seconds before replying, breathing deep into your belly.'
      ];
      quote = 'For every minute you are angry you lose sixty seconds of happiness. — Ralph Waldo Emerson';
    } else if (lower.includes('happy') || lower.includes('joy') || lower.includes('glad') || lower.includes('excite') || lower.includes('good') || lower.includes('love')) {
      emotion = 'Positive';
      summary = 'Magnificent vibrational frequency! You are flowing with harmonious clarity and radiating peaceful self-stability.';
      suggestions = [
        'Savor this delightful moment deeply by repeating what went well in your head.',
        'Write a tiny note of appreciate to someone you respect or love.',
        'Store this warm journal memory safely to look back on when overcast clouds arrive.'
      ];
      quote = 'Joy is not in things; it is in us. — Richard Wagner';
    }

    return jsonResponse({
      analysis: { emotion, summary, suggestions, quote }
    });
  }

  // POST: /api/ai/chat
  if (pathname === '/api/ai/chat' && method === 'POST') {
    const { feeling } = body;
    if (!feeling) return errorResponse('A feeling message is required.');

    if (!db.chats[authUserId]) db.chats[authUserId] = [];
    
    // Save User Chat Message
    const userMsg: ChatMessage = {
      id: uuid(),
      sender: 'user',
      text: feeling,
      timestamp: new Date().toISOString()
    };
    db.chats[authUserId].push(userMsg);

    // AI Simulated Reply
    const lower = feeling.toLowerCase();
    let responseText = "I hear you, and I am here with you. Take a slow, sweet breath. It takes courage to look inward and express how we feel. What is on your mind?";
    let emotionDetected = 'Neutral';
    let copingTips = [
      'Inhale deep (4s), hold air (4s), and let go (4s).',
      'Record this reflection in your private journal for safe keeping.'
    ];

    if (lower.includes('sad') || lower.includes('lonely') || lower.includes('depress') || lower.includes('unhappy')) {
      emotionDetected = 'Sad';
      responseText = "I feel your sadness, and it's perfectly okay to feel this way. Please remember that you don't have to carry this weight completely alone. I am here to hold a safe space for you. Let's start with a gentle, slow breath together.";
      copingTips = [
        'Focus on touching three real physical textures around you.',
        'Pour a glass of fresh cool water and drink it in small, deliberate sips.'
      ];
    } else if (lower.includes('anxi') || lower.includes('panic') || lower.includes('scared') || lower.includes('nervous')) {
      emotionDetected = 'Anxious';
      responseText = "Your nervous system is sending warning signals, and that feeling of tension is fully real. Let's return your breathing to a calm rhythm. Inhale slowly... and let it drift away. You are safe in this current moment.";
      copingTips = [
        'Ground yourself by finding 4 blue objects in your room.',
        'Squeeze your fists tight for 5 seconds, then let them go fully slack.'
      ];
    } else if (lower.includes('stress') || lower.includes('tired') || lower.includes('exhaust') || lower.includes('overwhelm')) {
      emotionDetected = 'Stressed';
      responseText = "It sounds like you have been carrying so much weight, and your mental battery is asking for soft, safe recharging. Please grant yourself permission to drop all pressure, and simply rest for a brief moment.";
      copingTips = [
        'Close your eyelids for exactly three minutes. Let the world operate without you.',
        'Roll your neck gently side to side to disperse muscular tension.'
      ];
    } else if (lower.includes('happy') || lower.includes('excited') || lower.includes('great') || lower.includes('good')) {
      emotionDetected = 'Happy';
      responseText = "What a gorgeous current of joy! I am absolutely delighted to share in your bright state of mind. Savor this wonderful warmth, and let it nourish your emotional baseline!";
      copingTips = [
        'Log this cheerful state in your calendar to map your happy triggers.',
        'Send a quick positive vibe note to someone you are grateful for.'
      ];
    }

    const aiMsg: ChatMessage = {
      id: uuid(),
      sender: 'ai',
      text: responseText,
      timestamp: new Date().toISOString()
    };
    db.chats[authUserId].push(aiMsg);
    saveDb(db);

    return jsonResponse({
      message: aiMsg,
      analysis: {
        emotion: emotionDetected,
        copingTips
      }
    });
  }

  // GET: /api/ai/chat-history
  if (pathname === '/api/ai/chat-history' && method === 'GET') {
    const history = db.chats[authUserId] || [];
    return jsonResponse({ history });
  }

  // DELETE: /api/ai/chat-history
  if (pathname === '/api/ai/chat-history' && method === 'DELETE') {
    db.chats[authUserId] = [];
    saveDb(db);
    return jsonResponse({ success: true, message: 'Chat history cleared.' });
  }

  // GET: /api/ai/weekly-report
  if (pathname === '/api/ai/weekly-report' && method === 'GET') {
    const moods = db.moods.filter((m) => m.userId === authUserId);
    if (moods.length === 0) {
      return errorResponse('You need to record at least one mood entry to generate a weekly report!', 400);
    }

    const user = db.users[authUserId];
    return jsonResponse({
      report: {
        summary: 'Your emotional logging shows remarkable commitment and authenticity. You are successfully creating a safe space for reflective self-discovery.',
        trends: `Your primary checked moods reflect solid patterns of self-reassurance. Daily streak reached ${user?.moodStreak || 0}.`,
        recommendations: [
          'Maintain stable, comfortable sleep intervals and allocate 10 minutes of silence.',
          'Consider doing light physical yoga to encourage balanced mental currents.',
          'Speak freely with Mind Mood AI companion when feelings run dense.'
        ],
        reinforcement: 'Self-awareness is highly brave. Tracking your emotional status establishes incredible baseline resilience.'
      }
    });
  }

  // GET: /api/community
  if (pathname === '/api/community' && method === 'GET') {
    const posts = db.community;
    return jsonResponse({ posts });
  }

  // POST: /api/community/add
  if (pathname === '/api/community/add' && method === 'POST') {
    const { authorName, text, bgGradient } = body;
    if (!text) return errorResponse('Post text is required.');

    const newPost: CommunityItem = {
      id: uuid(),
      userId: authUserId,
      authorName: authorName || 'Anonymous Companion',
      text,
      bgGradient: bgGradient || 'from-[#1e293b] to-[#0f172a]',
      likes: [],
      createdAt: new Date().toISOString()
    };

    db.community.unshift(newPost);
    
    db.notifications.push({
      id: uuid(),
      userId: authUserId,
      title: 'Gratitude Shared! 🌟',
      message: 'You have published a cards of warm, encouraging affirmations to the Community Plaza.',
      type: 'support',
      read: false,
      createdAt: new Date().toISOString()
    });

    saveDb(db);

    return jsonResponse({ post: newPost });
  }

  // POST: /api/community/like/:id
  if (pathname.startsWith('/api/community/like/') && method === 'POST') {
    const parts = pathname.split('/');
    const postId = parts[parts.length - 1];

    const post = db.community.find((p) => p.id === postId);
    if (!post) return errorResponse('Post not found', 404);

    const hasLiked = post.likes.includes(authUserId);
    if (hasLiked) {
      post.likes = post.likes.filter((id) => id !== authUserId);
    } else {
      post.likes.push(authUserId);
      if (post.userId !== authUserId) {
        db.notifications.push({
          id: uuid(),
          userId: post.userId,
          title: 'Affirmation appreciated ❤️',
          message: 'Someone liked and felt supported by your community words card!',
          type: 'support',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    saveDb(db);
    return jsonResponse({ post });
  }

  // GET: /api/notifications
  if (pathname === '/api/notifications' && method === 'GET') {
    const notifications = db.notifications
      .filter((n) => n.userId === authUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return jsonResponse({ notifications });
  }

  // POST: /api/notifications/read/:id
  if (pathname.startsWith('/api/notifications/read/') && method === 'POST') {
    const parts = pathname.split('/');
    const id = parts[parts.length - 1];

    const notif = db.notifications.find((n) => n.id === id && n.userId === authUserId);
    if (notif) {
      notif.read = true;
      saveDb(db);
    }
    return jsonResponse({ success: true });
  }

  // POST: /api/notifications/clear
  if (pathname === '/api/notifications/clear' && method === 'POST') {
    db.notifications = db.notifications.filter((n) => n.userId !== authUserId);
    saveDb(db);
    return jsonResponse({ success: true });
  }

  // GET: /api/wellness/score
  if (pathname === '/api/wellness/score' && method === 'GET') {
    const uMoods = db.moods.filter((m) => m.userId === authUserId);
    const uJournals = db.journals.filter((j) => j.userId === authUserId);
    const user = db.users[authUserId];

    const consecutiveDays = user?.moodStreak || 0;
    const streakScore = Math.min(consecutiveDays * 8, 40);
    const loggingScore = Math.min(uMoods.length * 6, 30);

    let activeMoodCount = 0;
    const recentTen = uMoods.slice(-10);
    recentTen.forEach((m) => {
      if (m.moodType === 'happy' || m.moodType === 'neutral') activeMoodCount++;
    });
    const positivityRate = recentTen.length > 0 ? activeMoodCount / recentTen.length : 0.5;
    const positivityScore = Math.round(positivityRate * 20);

    const journalScore = Math.min(uJournals.length * 5, 10);
    const score = Math.min(10 + streakScore + loggingScore + positivityScore + journalScore, 100);

    let evaluationName = 'Mindful Emerging';
    let summary = 'A solid foundation is laid. Take incremental steps daily: logging emotions and drinking tea can promote awareness.';

    if (score >= 90) {
      evaluationName = 'Sovereign Serenity';
      summary = 'Your wellness activities display masterful, balanced introspection! The nervous system is heavily validated by consistent tracking and mindful processing.';
    } else if (score >= 75) {
      evaluationName = 'Balanced Horizon';
      summary = 'Admirable steady progress. You are successfully maintaining streaks and reflecting deeply. Keep engaging with daily meditations for absolute balance.';
    } else if (score >= 50) {
      evaluationName = 'Reflective Orbit';
      summary = 'You are steadily observing your mind. Increase reflection exercises and track daily moods to build stronger self-reassurance streaks.';
    } else {
      evaluationName = 'Needs Gentle Rest';
      summary = 'Nervous system signals suggest elevated stress or lower activity loops. Consider speaking to our custom AI Support helper or taking a silent breathing break.';
    }

    const wellness: WellnessScore = {
      score,
      breakdown: { streakScore, loggingScore, positivityScore, journalScore },
      evaluationName,
      summary
    };

    return jsonResponse(wellness);
  }

  // GET: /api/search
  if (pathname === '/api/search' && method === 'GET') {
    const query = (searchParams.get('q') || '').toLowerCase().trim();
    const journals = db.journals.filter((j) => j.userId === authUserId);
    const moods = db.moods.filter((m) => m.userId === authUserId);

    if (!query) {
      return jsonResponse({
        journals,
        moods: moods.filter((m) => m.note)
      });
    }

    const fJournals = journals.filter((j) => j.text.toLowerCase().includes(query) || j.moodTag.toLowerCase().includes(query));
    const fMoods = moods.filter((m) => (m.note && m.note.toLowerCase().includes(query)) || m.moodType.toLowerCase().includes(query));

    return jsonResponse({ journals: fJournals, moods: fMoods });
  }

  // POST: /api/meditation/complete
  if (pathname === '/api/meditation/complete' && method === 'POST') {
    const { seconds } = body;
    db.notifications.push({
      id: uuid(),
      userId: authUserId,
      title: 'Breathing Loop Mastered 🧘',
      message: `Splendid job! You completed a mindful breathing cycle of ${seconds || 60} seconds. This strengthens neuro-calm centers!`,
      type: 'milestone',
      read: false,
      createdAt: new Date().toISOString()
    });
    saveDb(db);
    return jsonResponse({ success: true });
  }

  return errorResponse('API Not Found', 404);
}
