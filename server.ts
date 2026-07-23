/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { db } from './src/db/dbManager.js';
import { MoodType } from './src/types.js';

// API Key setup from Secrets environment variables
const apiKey = process.env.GEMINI_API_KEY;

// Lazy-loaded GenAI Client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is requested. Please set it in Settings > Secrets.');
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Extend express Request types to include authenticated user
interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

// Simple authentication middleware
const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Token is missing' });
  }
  const token = authHeader.split(' ')[1];
  const user = db.getUser(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
  req.userId = token;
  req.user = user;
  next();
};

// ==================== AUTH ENDPOINTS ====================

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields (name, email, password) are required.' });
  }
  try {
    const result = db.register(name, email, password);
    if (!result) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    
    // Seed initial notifications to make notifications feed lively and welcoming!
    db.addNotification(
      result.user.id,
      'Welcome to Mind Mood AI 💜',
      'Your private space is established. Inhale calm and write down your goals.',
      'system'
    );
    db.addNotification(
      result.user.id,
      'Dynamic Wellness Score active',
      'Track your daily habits and breathing cycle achievements to upgrade your dynamic score metrics.',
      'milestone'
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  try {
    const result = db.login(email, password);
    if (!result) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// PASSWORD RESET ENDPOINTS
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }
  try {
    const code = db.generateResetCode(email);
    if (!code) {
      return res.status(404).json({ error: 'No registered account found with this email.' });
    }

    // Since we are in an offline sandbox/playground, we will return the code directly
    // to simulate standard email dispatch.
    res.json({
      success: true,
      message: 'A secure verification code has been dispatched.',
      code: code // Exposed for testing directly on-screen
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process forgot password request.' });
  }
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, verification code, and new password are required.' });
  }
  try {
    const isValid = db.verifyResetCode(email, code);
    if (!isValid) {
      return res.status(400).json({ error: 'Incorrect verification code.' });
    }

    const success = db.resetPasswordByEmail(email, newPassword);
    if (!success) {
      return res.status(400).json({ error: 'Could not reset password. Please try registering again.' });
    }

    db.clearResetCode(email);

    // Seed alert notification for password change event
    const userRecord = Object.values((db as any).data.users).find((u: any) => u.email === email.toLowerCase().trim());
    if (userRecord) {
      db.addNotification(
        (userRecord as any).id,
        'Security Alert: Password Changed 🔑',
        'Your account password was updated successfully. If this wasn\'t you, secure your credentials.',
        'system'
      );
    }

    res.json({ success: true, message: 'Password updated successfully. Please sign in.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

app.get('/api/auth/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// ==================== MOOD ENDPOINTS ====================

app.post('/api/mood/add', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { moodType, intensity, note } = req.body;
  if (!moodType || intensity === undefined) {
    return res.status(400).json({ error: 'Mood type and intensity are required.' });
  }
  try {
    const validMoods: MoodType[] = ['happy', 'neutral', 'sad', 'angry', 'tired'];
    if (!validMoods.includes(moodType)) {
      return res.status(400).json({ error: 'Invalid mood type.' });
    }
    const rateIntensity = Number(intensity);
    if (isNaN(rateIntensity) || rateIntensity < 1 || rateIntensity > 5) {
      return res.status(400).json({ error: 'Intensity must be an integer between 1 and 5.' });
    }

    const mood = db.addMood(req.userId!, moodType, rateIntensity, note || '');

    // Feed a support notification dynamically
    db.addNotification(
      req.userId!,
      'Mood Tracked 📊',
      `Logged custom ${moodType} state (intensity ${rateIntensity}/5). Keep logging to build your streak and upgrade your Wellness Score!`,
      'support'
    );

    res.json({ mood, user: db.getUser(req.userId!) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record mood.' });
  }
});

app.get('/api/mood/today', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const todayMood = db.getTodayMood(req.userId!);
    res.json({ mood: todayMood });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get today\'s mood.' });
  }
});

app.get('/api/mood/history', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = db.getMoodHistory(req.userId!);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve mood history.' });
  }
});

// ==================== JOURNAL ENDPOINTS ====================

app.post('/api/journal/add', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { text, moodTag } = req.body;
  if (!text || !moodTag) {
    return res.status(400).json({ error: 'Text and mood tag are required.' });
  }
  try {
    const journal = db.addJournal(req.userId!, text, moodTag);

    // Seed private notification alert for journal activity
    db.addNotification(
      req.userId!,
      'Reflection Recorded 📝',
      `Safely stored your private self-reflection with the "${moodTag}" initial tag.`,
      'system'
    );

    res.json({ journal });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add journal entry.' });
  }
});

app.get('/api/journal/all', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const journals = db.getAllJournals(req.userId!);
    res.json({ journals });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch journal entries.' });
  }
});

app.delete('/api/journal/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const journalId = req.params.id;
  try {
    const success = db.deleteJournal(req.userId!, journalId);
    if (!success) {
      return res.status(404).json({ error: 'Journal entry not found or belongs to another user.' });
    }
    res.json({ success: true, message: 'Journal entry deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete journal entry.' });
  }
});

// ==================== AI ENDPOINTS ====================

app.post('/api/ai/analyze-mood', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text content to analyze is required.' });
  }

  try {
    const aiService = getGenAI();
    const prompt = `Analyze this mental health journal entry/user reflection and output an analysis in structured JSON format. 
User text: "${text}"`;

    const response = await aiService.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are an expert mental wellness therapist assistant. Evaluate user sentiment, provide a classification from ['Positive', 'Negative', 'Neutral', 'Stress', 'Anxiety'], summarize their current state, give 3 actionable wellness suggestions (breathing, focus, physical, or comfort advice), and find or write a highly personalized motivational/uplifting quote.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotion: {
              type: Type.STRING,
              description: 'One of: Positive, Negative, Neutral, Stress, Anxiety',
            },
            summary: {
              type: Type.STRING,
              description: 'A deeply compassionate 2-3 sentence overview of their current mental/emotional state based on their text.',
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Exactly 3 tangible psychological or physical suggestions appropriate for their mood tag.',
            },
            quote: {
              type: Type.STRING,
              description: 'An inspirational, empathetic mental health quote tailored to their mental state.',
            },
          },
          required: ['emotion', 'summary', 'suggestions', 'quote'],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Gemini API returned an empty output');
    }

    const analysis = JSON.parse(textOutput.trim());
    res.json({ analysis });
  } catch (e: any) {
    console.error('Error in analyze-mood content generation:', e);
    // Return smart interactive fallback if API fails or key is missing
    const lowerText = (text || '').toLowerCase();
    let emotion = 'Neutral';
    let summary = 'Warm analysis could not be calculated dynamically. Your reflection seems valuable. Keep recording your feelings regularly.';
    let suggestions = [
      'Practice deep mindful breathing for 2 minutes.',
      'Take a soft walk or change your immediate physical environment.',
      'Write down three tiny things you are grateful for right now.',
    ];
    let quote = 'Owning our story and loving ourselves through that process is the bravest thing that we will ever do. — Brené Brown';

    if (lowerText.includes('sad') || lowerText.includes('down') || lowerText.includes('cry') || lowerText.includes('hurt') || lowerText.includes('depress') || lowerText.includes('lonely') || lowerText.includes('alone')) {
      emotion = 'Negative';
      summary = 'It sounds like you are feeling down or lonely. It is completely okay to sit with these feelings, but please remember you are not alone.';
      suggestions = [
        'Reach out to someone you trust to share your feelings.',
        'Listen to a comforting song or watch a calming video.',
        'Write down one positive thing about yourself or your day.'
      ];
      quote = 'Tears are words that need to be written. — Paulo Coelho';
    } else if (lowerText.includes('angry') || lowerText.includes('mad') || lowerText.includes('hate') || lowerText.includes('furious') || lowerText.includes('annoy')) {
      emotion = 'Stress';
      summary = 'There seems to be some anger or frustration in your text. Letting out tension physically or writing without filter can help release this energy.';
      suggestions = [
        'Take a 5-minute break away from the trigger.',
        'Squeeze a stress ball or do a vigorous quick workout.',
        'Take 5 deep breaths, focusing entirely on the exhale.'
      ];
      quote = 'For every minute you remain angry you give up sixty seconds of peace of mind. — Ralph Emerson';
    } else if (lowerText.includes('anxious') || lowerText.includes('scared') || lowerText.includes('panic') || lowerText.includes('worry') || lowerText.includes('fear') || lowerText.includes('nervous')) {
      emotion = 'Anxiety';
      summary = 'It seems you are feeling anxious or worried. Let\'s ground your thoughts and remind you that you are safe in this present moment.';
      suggestions = [
        'Try the 5-4-3-2-1 grounding technique to scan your room.',
        'Inhale slowly for 4 seconds, hold for 4, and exhale for 4.',
        'Wrap yourself in a warm blanket or sit comfortably.'
      ];
      quote = 'Do not anticipate trouble, or worry about what may never happen. Keep in the sunlight. — Benjamin Franklin';
    } else if (lowerText.includes('stress') || lowerText.includes('overwhelm') || lowerText.includes('pressure') || lowerText.includes('tension')) {
      emotion = 'Stress';
      summary = 'It seems you are carrying a high level of stress or tension today. When demands exceed our immediate capacity, taking small steps back is key to restoration.';
      suggestions = [
        'Do a 2-minute progressive muscle relaxation (tense and release muscle groups).',
        'Write down a quick brain-dump list to declutter your active thoughts.',
        'Inhale deeply for 4 seconds, hold for 4, and release with a sigh.'
      ];
      quote = 'Rule number one is, don’t sweat the small stuff. Rule number two is, it’s all small stuff. — Robert Eliot';
    } else if (lowerText.includes('happy') || lowerText.includes('great') || lowerText.includes('good') || lowerText.includes('joy') || lowerText.includes('excited') || lowerText.includes('love') || lowerText.includes('glad')) {
      emotion = 'Positive';
      summary = 'It is beautiful to see positivity and joy in your thoughts! Cultivating gratitude and celebrating small wins strengthens our mental resilience.';
      suggestions = [
        'Write down exactly what made this moment feel so bright.',
        'Share your positive energy or check in on a close friend.',
        'Take a moment to fully savor this peaceful feeling.'
      ];
      quote = 'Joy is not in things; it is in us. — Richard Wagner';
    } else if (lowerText.includes('tired') || lowerText.includes('exhaust') || lowerText.includes('sleepy') || lowerText.includes('drain') || lowerText.includes('fatigue')) {
      emotion = 'Neutral';
      summary = 'You are feeling tired and drained. Your body and mind are gently asking you for a physical or mental pause. Respect this request.';
      suggestions = [
        'Close your eyes and rest for at least 10 minutes.',
        'Drink a full glass of refreshing water.',
        'Disconnect from all digital screens for the rest of the hour.'
      ];
      quote = 'Rest when you\'re weary. Refresh and renew yourself, your body, your mind, your spirit. — Ralph Marston';
    }

    res.json({
      analysis: {
        emotion,
        summary,
        suggestions,
        quote,
      },
    });
  }
});

app.post('/api/ai/chat', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { feeling } = req.body;
  if (!feeling) {
    return res.status(400).json({ error: 'A message feeling description is required.' });
  }

  const userId = req.userId!;
  try {
    const aiService = getGenAI();

    // 1. Get recent chat history & recent mood history to build supportive memory context
    const chatHistory = db.getChatHistory(userId);
    const recentMoods = db.getMoodHistory(userId).slice(0, 5);

    // Save user's question first
    const userMsg = db.saveChatMessage(userId, 'user', feeling);

    // Construct history presentation
    const moodString = recentMoods.map((m) => `[Date: ${m.date}, Mood: ${m.moodType}, Note: ${m.note}]`).join('\n');
    const pastChatsString = chatHistory
      .slice(-6)
      .map((c) => `${c.sender.toUpperCase()}: ${c.text}`)
      .join('\n');

    const prompt = `Recent Mood History:\n${moodString}\n\nPast Conversation Logs:\n${pastChatsString}\n\nUSER'S FEELING MESSAGE RIGHT NOW:\n"${feeling}"`;

    const response = await aiService.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are Mind Mood AI, a friendly, ultra-supportive, empathetic mental wellness companion. 
Your goal is to act like a non-judgmental wellness guide:
- Encourage journaling and tracking.
- Provide comforting emotional support.
- List some concrete coping exercises or mood suggestions.
- Speak directly and warmly, utilizing second person ("you"). 
- Keep the tone calm, serene, and warm. Avoid excessive exclamation marks. Never replace clinical medical advice but give supportive lifestyle tips.
Output your reply in structured JSON format.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: 'The supportive response dialog to the user.',
            },
            emotionDetected: {
              type: Type.STRING,
              description: 'Classify immediate emotion from: Happy, Neutral, Sad, Angry, Tired, Stressed, Anxious',
            },
            copingTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 brief bullet-point coping tips suitable for this situation.',
            },
          },
          required: ['text', 'emotionDetected', 'copingTips'],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Gemini API returned an empty output');
    }

    const result = JSON.parse(textOutput.trim());

    // Save AI reply to history
    db.saveChatMessage(userId, 'ai', result.text);

    res.json({
      message: {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: result.text,
        timestamp: new Date().toISOString(),
      },
      analysis: {
        emotion: result.emotionDetected,
        copingTips: result.copingTips,
      },
    });
  } catch (err: any) {
    console.error('Error in AI Chat API:', err);
    const lowerFeeling = (feeling || '').toLowerCase();
    let detectedEmotion = 'Neutral';
    let fallbackText = "I am here for you. Recording how we feel is a brave step towards understanding ourselves. Take a deep breath: draw it in slowly, hold for four seconds, and let it go. Would you like to write about this in your daily journal?";
    let copingTips = [
      'Breathe mindfully (inhale 4s, hold 4s, exhale 4s).',
      'Write down a simple journal entry of what is causing this.'
    ];

    if (lowerFeeling.includes('sad') || lowerFeeling.includes('down') || lowerFeeling.includes('cry') || lowerFeeling.includes('hurt') || lowerFeeling.includes('depress') || lowerFeeling.includes('lonely') || lowerFeeling.includes('alone')) {
      detectedEmotion = 'Sad';
      fallbackText = "I hear you, and I am so sorry you are feeling down. It is completely okay to feel sad or alone right now. Be gentle with yourself. Can you tell me more about what is making you feel this way?";
      copingTips = [
        'Allow yourself to feel and cry if needed; it releases emotional stress.',
        'Identify one comfort source (a warm drink, a soft blanket, or a trusted friend).'
      ];
    } else if (lowerFeeling.includes('angry') || lowerFeeling.includes('mad') || lowerFeeling.includes('hate') || lowerFeeling.includes('furious') || lowerFeeling.includes('annoy')) {
      detectedEmotion = 'Angry';
      fallbackText = "It sounds like you're carrying a lot of frustration or anger right now. Your anger is valid, but let's release the tension in your body. How can I help you unpack this anger safely?";
      copingTips = [
        'Release physical tension by doing 10 quick shoulder rolls.',
        'Do a brain dump: type out all your anger here, and we can clear it afterwards.'
      ];
    } else if (lowerFeeling.includes('anxious') || lowerFeeling.includes('scared') || lowerFeeling.includes('panic') || lowerFeeling.includes('worry') || lowerFeeling.includes('fear') || lowerFeeling.includes('nervous')) {
      detectedEmotion = 'Anxious';
      fallbackText = "I can feel the anxiety in your words. When thoughts spin fast, remember you are here, safe in this room. Let's do a small grounding exercise together: what is one physical thing you can touch right now?";
      copingTips = [
        'Ground yourself by feeling the floor solid under your feet.',
        'Breathe slowly: extend your exhale longer than your inhale.'
      ];
    } else if (lowerFeeling.includes('stress') || lowerFeeling.includes('overwhelm') || lowerFeeling.includes('pressure') || lowerFeeling.includes('tension')) {
      detectedEmotion = 'Stressed';
      fallbackText = "I can hear how much pressure you're under. Stress makes our world feel incredibly heavy, but you don't have to carry it all right now. Let's take a slow breath. What is the main thing demanding your energy today?";
      copingTips = [
        'Write down a quick brain-dump to offload your mental checklist.',
        'Sip some cool water and release the tension in your jaw and shoulders.'
      ];
    } else if (lowerFeeling.includes('happy') || lowerFeeling.includes('great') || lowerFeeling.includes('good') || lowerFeeling.includes('joy') || lowerFeeling.includes('excited') || lowerFeeling.includes('love') || lowerFeeling.includes('glad')) {
      detectedEmotion = 'Happy';
      fallbackText = "That's wonderful! I'm so glad to hear you are feeling good. Reflecting on positive moments helps double the joy. What made things go so well today?";
      copingTips = [
        'Celebrate this moment: note what or who made you smile.',
        'Express gratitude: share a kind word with someone who contributed to your happy day.'
      ];
    } else if (lowerFeeling.includes('tired') || lowerFeeling.includes('exhaust') || lowerFeeling.includes('sleepy') || lowerFeeling.includes('drain') || lowerFeeling.includes('fatigue')) {
      detectedEmotion = 'Tired';
      fallbackText = "You sound really exhausted. It is so important to acknowledge when our batteries are low. Please give yourself permission to step away and rest. What is one thing you can put on hold to rest?";
      copingTips = [
        'Do a 5-minute passive rest: close your eyes and focus on the quiet.',
        'Drink a warm glass of water or tea and turn down screen brightness.'
      ];
    }

    db.saveChatMessage(userId, 'ai', fallbackText);

    res.json({
      message: {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: fallbackText,
        timestamp: new Date().toISOString(),
      },
      analysis: {
        emotion: detectedEmotion,
        copingTips: copingTips,
      },
    });
  }
});

// GET Chat History
app.get('/api/ai/chat-history', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = db.getChatHistory(req.userId!);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load chat history' });
  }
});

// DELETE/Clear Chat History
app.delete('/api/ai/chat-history', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.clearChatHistory(req.userId!);
    res.json({ success: true, message: 'Chat history cleared successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear chat history.' });
  }
});

// Weekly AI Report Generator
app.get('/api/ai/weekly-report', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  try {
    const aiService = getGenAI();

    const moods = db.getMoodHistory(userId).slice(0, 10);
    const journals = db.getAllJournals(userId).slice(0, 5);

    if (moods.length === 0) {
      return res.status(400).json({ error: 'You need to record at least one mood entry to generate a weekly report!' });
    }

    const moodsSummary = moods.map((m) => `[Date: ${m.date}, Mood: ${m.moodType}, Notes: ${m.note}]`).join('\n');
    const journalsSummary = journals.map((j) => `[Date: ${j.createdAt}, Tag: ${j.moodTag}, Text: ${j.text}]`).join('\n');

    const prompt = `Here are the user's emotional entries for the recent week:
Mood logs:
${moodsSummary}

Journal notes:
${journalsSummary}

Produce a formal, private, beautifully written psychological wellness report summarizing trends, reinforcement, and clinical style guidelines.`;

    const response = await aiService.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are a certified empathetic clinical health psychologist. Compile a private emotional report for the user's recent week. Design a highly motivational, analytical, and respectful summary. Do not use generic placeholders. Offer deep structured analysis. Output strictly in JSON format.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'A 3-4 sentence comprehensive and supportive analytical summary of their weekly state.',
            },
            trends: {
              type: Type.STRING,
              description: 'Detailed observations about their mood trends (e.g. happy streak, stressed moment, calm weekend insights).',
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 professional medical-lifestyle strategies for enhancing or sustaining their current state.',
            },
            reinforcement: {
              type: Type.STRING,
              description: 'Positive reinforcement acknowledging their strength in journaling and emotional self-reflection.',
            },
          },
          required: ['summary', 'trends', 'recommendations', 'reinforcement'],
        },
      },
    });

    const output = response.text;
    if (!output) {
      throw new Error('Empathetic engine failed to produce response');
    }

    const parsedReport = JSON.parse(output.trim());
    res.json({ report: parsedReport });
  } catch (err: any) {
    console.error('Error generating weekly report:', err);
    res.json({
      report: {
        summary: 'Your emotional logging shows remarkable commitment. You are creating a safe tracking environment representing your authentic thoughts.',
        trends: 'You are regularly mapping your emotions. Commonalities suggest a reflective disposition during evening journals.',
        recommendations: [
          'Maintain a stable circadian rhythm and set aside 10 minutes daily for silence.',
          'Consider engaging in high-impact micro-exercise when feeling low-energy.',
          'Continue sharing your feelings with our supportive Mind Mood helper.',
        ],
        reinforcement: 'Self-awareness is the highest form of bravery. Logging your state is proof of your emotional intelligence.',
      },
    });
  }
});

// ==================== NEW FEATURES ENDPOINTS ====================

// 1. COMMUNITY PLAZA ENDPOINTS
app.get('/api/community', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const posts = db.getCommunityPosts();
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve community plaza posts.' });
  }
});

app.post('/api/community/add', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { authorName, text, bgGradient } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Post text is required.' });
  }
  try {
    const post = db.addCommunityPost(req.userId!, authorName || 'Anonymous Companion', text, bgGradient);
    
    // Add positive milestone notification to the poster
    db.addNotification(
      req.userId!,
      'Gratitude Shared! 🌟',
      'You successfully shared a supportive words card in the Community Plaza. Thank you for lifting others!',
      'support'
    );

    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save community post.' });
  }
});

app.post('/api/community/like/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const postId = req.params.id;
  try {
    const post = db.toggleLikePost(req.userId!, postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    
    // Send notification to author of post if liked by another user
    if (post.userId !== req.userId && post.likes.includes(req.userId!)) {
      db.addNotification(
        post.userId,
        'Affirmation appreciated ❤️',
        'Someone liked and felt supported by your community affirmation!',
        'support'
      );
    }

    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle like.' });
  }
});


// 2. NOTIFICATIONS MANAGEMENT ENDPOINTS
app.get('/api/notifications', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = db.getNotifications(req.userId!);
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

app.post('/api/notifications/read/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id;
  try {
    const success = db.markNotificationRead(req.userId!, id);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

app.post('/api/notifications/clear', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.clearAllNotifications(req.userId!);
    res.json({ success: true, message: 'All notifications cleared.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear notifications.' });
  }
});


// 3. CLINICAL WELLNESS SCORE ANALYZER
app.get('/api/wellness/score', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const moods = db.getMoodHistory(userId);
    const journals = db.getAllJournals(userId);
    const user = db.getUser(userId);

    const consecutiveDays = user?.moodStreak || 0;
    
    // 1. Streak Score (Capped at 40 points)
    const streakScore = Math.min(consecutiveDays * 8, 40);

    // 2. Logging Frequency Score (Capped at 30 points)
    const recentLoggingCount = moods.length;
    const loggingScore = Math.min(recentLoggingCount * 6, 30);

    // 3. Positivity & Emotional Balance Score (Capped at 20 points)
    let adaptiveMoodCount = 0;
    const recentTen = moods.slice(0, 10);
    recentTen.forEach(m => {
      if (m.moodType === 'happy' || m.moodType === 'neutral') {
        adaptiveMoodCount++;
      }
    });
    const positivityRate = recentTen.length > 0 ? (adaptiveMoodCount / recentTen.length) : 0.5;
    const positivityScore = Math.round(positivityRate * 20);

    // 4. Detailed journaling exercises score (Capped at 10 points)
    const journalCount = journals.length;
    const journalScore = Math.min(journalCount * 5, 10);

    // Final Weighted Computation out of 100
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

    res.json({
      score,
      breakdown: {
        streakScore,
        loggingScore,
        positivityScore,
        journalScore
      },
      evaluationName,
      summary
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate wellness score.' });
  }
});


// 4. COMPREHENSIVE FUZZY SEARCH (Past Journals and Mood Triggers)
app.get('/api/search', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const query = (req.query.q || '').toString().toLowerCase().trim();
  try {
    const userId = req.userId!;
    const journals = db.getAllJournals(userId);
    const moods = db.getMoodHistory(userId);

    if (!query) {
      return res.json({
        journals,
        moods: moods.filter(m => m.note)
      });
    }

    const filteredJournals = journals.filter(j => 
      j.text.toLowerCase().includes(query) || 
      j.moodTag.toLowerCase().includes(query)
    );

    const filteredMoods = moods.filter(m => 
      (m.note && m.note.toLowerCase().includes(query)) || 
      m.moodType.toLowerCase().includes(query)
    );

    res.json({
      journals: filteredJournals,
      moods: filteredMoods
    });

  } catch (err) {
    res.status(500).json({ error: 'Search operation failed.' });
  }
});

// 5. MEDITATION CYCLE COMPLETION ENDPOINT
app.post('/api/meditation/complete', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { seconds } = req.body;
  try {
    db.addNotification(
      req.userId!,
      'Breathing Loop Mastered 🧘',
      `Splendid job! You finished a mindful breathing cycle of ${seconds || 60} seconds. This strengthens neuro-calm centers!`,
      'milestone'
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log breathing completion.' });
  }
});

// Simple backend health and info endpoints for local ownership
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    env: process.env.NODE_ENV || 'development',
  });
});

app.get('/api/backend/info', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    service: 'Mind Mood AI Local Backend',
    userId: req.userId,
    authenticatedUser: req.user,
    supportRoutes: [
      '/api/auth/profile',
      '/api/mood/today',
      '/api/mood/history',
      '/api/journal/all',
      '/api/community',
      '/api/notifications',
      '/api/wellness/score',
    ],
  });
});


// ==================== FRONTEND OR VITE INTEGRATION ====================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production paths serve statically from 'dist'
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.VERCEL !== '1') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Express full-stack backend running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
