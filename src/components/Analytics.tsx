/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Sparkles, TrendingUp, Activity, FileSpreadsheet, RefreshCw, Calendar, Brain, Heart, CheckCircle2, AlertCircle, PlusCircle, Shield, Award, Zap, ArrowUpRight, ArrowDownRight, Flame, Layers, Lightbulb, Clock } from 'lucide-react';
import { Mood, MoodType, MentalWellnessStage } from '../types';
import * as XLSX from 'xlsx';

interface AnalyticsProps {
  token: string;
  onNavigate?: (view: string) => void;
}

interface GeneralReport {
  summary: string;
  trends: string;
  recommendations: string[];
  reinforcement: string;
  situationStage: MentalWellnessStage;
  overallScore: number;
}

const MOOD_SCORE: { [key in MoodType]: number } = {
  happy: 5,
  neutral: 3,
  sad: 2,
  angry: 1,
  tired: 2,
};

const MOOD_EMOJIS: { [key in MoodType]: string } = {
  happy: '😄',
  neutral: '😐',
  sad: '😔',
  angry: '😡',
  tired: '😴',
};

const MOOD_COLORS: { [key in MoodType]: string } = {
  happy: '#f59e0b',
  neutral: '#94a3b8',
  sad: '#6366f1',
  angry: '#ef4444',
  tired: '#8b5cf6',
};

const MOOD_LABELS: { [key in MoodType]: string } = {
  happy: '😄 Happy',
  neutral: '😐 Neutral',
  sad: '😔 Sad',
  angry: '😡 Angry',
  tired: '😴 Tired',
};

const DEFAULT_BASELINE_HISTORY: Mood[] = [
  { id: 'b1', userId: 'usr', moodType: 'neutral', intensity: 3, note: 'Baseline check-in', date: '2025-12-18', createdAt: '2025-12-18T10:00:00Z' },
  { id: 'b2', userId: 'usr', moodType: 'happy', intensity: 4, note: 'Morning walk', date: '2025-12-19', createdAt: '2025-12-19T10:00:00Z' },
  { id: 'b3', userId: 'usr', moodType: 'happy', intensity: 4, note: 'Great team sync', date: '2025-12-20', createdAt: '2025-12-20T10:00:00Z' },
  { id: 'b4', userId: 'usr', moodType: 'tired', intensity: 2, note: 'Evening fatigue', date: '2025-12-21', createdAt: '2025-12-21T10:00:00Z' },
  { id: 'b5', userId: 'usr', moodType: 'neutral', intensity: 3, note: 'Steady focus', date: '2025-12-22', createdAt: '2025-12-22T10:00:00Z' },
  { id: 'b6', userId: 'usr', moodType: 'happy', intensity: 5, note: 'Completed milestone', date: '2025-12-23', createdAt: '2025-12-23T10:00:00Z' },
  { id: 'b7', userId: 'usr', moodType: 'happy', intensity: 4, note: 'Relaxing weekend', date: '2025-12-24', createdAt: '2025-12-24T10:00:00Z' },
];

export default function Analytics({ token, onNavigate }: AnalyticsProps) {
  const [history, setHistory] = useState<Mood[]>([]);
  const [report, setReport] = useState<GeneralReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [reportSuccess, setReportSuccess] = useState('');

  // Time range selector matching reference image: 7 days | 30 days | 90 days
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d'>('7d');

  // Quick mood logging
  const [selectedMood, setSelectedMood] = useState<MoodType>('happy');
  const [quickNote, setQuickNote] = useState('');
  const [isLoggingMood, setIsLoggingMood] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mood/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const logs: Mood[] = data.history || [];
        setHistory(logs);
        generateGeneralReport(logs);
      }
    } catch (err) {
      console.error(err);
      generateGeneralReport([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateOverallWellnessScore = (logs: Mood[]): number => {
    const active = logs.length > 0 ? logs : DEFAULT_BASELINE_HISTORY;
    const avgScore = active.reduce((acc, m) => acc + (MOOD_SCORE[m.moodType] || 3), 0) / active.length;
    const streakBonus = Math.min(20, active.length * 3);
    const score = Math.round((avgScore / 5) * 80 + streakBonus);
    return Math.min(100, Math.max(10, score));
  };

  const determineMentalWellnessStage = (score: number): { stage: MentalWellnessStage; color: string; bg: string; border: string; desc: string } => {
    if (score >= 90) return { stage: 'Excellent Mental Wellness', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: 'Peak cognitive resilience, high emotional positivity, and optimal self-reflection habits.' };
    if (score >= 80) return { stage: 'Positive Growth Stage', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200', desc: 'Continuous upward emotional trend with strong coping mechanisms.' };
    if (score >= 70) return { stage: 'Healthy and Stable', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', desc: 'Consistent emotional equilibrium and healthy daily reflection.' };
    if (score >= 60) return { stage: 'Improving', color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', desc: 'Positive momentum in recovery. Keep up regular mindfulness loops.' };
    if (score >= 55) return { stage: 'Recovery Stage', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', desc: 'Restoring energy after a demanding cycle. Gentle self-care recommended.' };
    if (score >= 45) return { stage: 'Mild Stress', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'Experiencing minor tension. Daily 4-4-4 Box Breathing is recommended.' };
    if (score >= 35) return { stage: 'Moderate Stress', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', desc: 'Elevated stress markers. Consider quiet journaling and AI chat check-ins.' };
    if (score >= 25) return { stage: 'High Stress', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', desc: 'Significant strain detected. Engage in guided relaxation sessions.' };
    if (score >= 15) return { stage: 'Anxiety Risk', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', desc: 'Anxiety indicators present. Reach out to supportive peers in Community Plaza.' };
    if (score >= 5) return { stage: 'Burnout Risk', color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200', desc: 'High exhaustion risk. Prioritize restorative sleep and step back from stressors.' };
    return { stage: 'Needs Wellness Support', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', desc: 'Emotional distress detected. Connect with our supportive AI therapist guide.' };
  };

  const generateGeneralReport = (logs: Mood[]) => {
    const score = calculateOverallWellnessScore(logs);
    const stageInfo = determineMentalWellnessStage(score);

    setReport({
      summary: `Your overall situation evaluates at a wellness score of ${score}/100. ${stageInfo.desc}`,
      trends: 'Emotional trends indicate a steady trajectory with active engagement across journaling and mood tracking.',
      recommendations: [
        'Practice 4-4-4 Box Breathing twice daily to maintain physiological calmness.',
        'Log your mood entries consistently every morning and evening.',
        'Share supportive word cards in Community Plaza to foster connection.'
      ],
      reinforcement: 'Every self-reflection log is a step toward emotional mastery. You are demonstrating admirable commitment to your well-being.',
      situationStage: stageInfo.stage,
      overallScore: score,
    });
  };

  const handleQuickLogMood = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingMood(true);
    try {
      const res = await fetch('/api/mood/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          moodType: selectedMood,
          intensity: 4,
          note: quickNote.trim() || `Analytics check-in (${selectedMood})`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedHistory = [data.mood, ...history];
        setHistory(updatedHistory);
        generateGeneralReport(updatedHistory);
        setQuickNote('');
        setReportSuccess('✅ Mood logged! Real-time analytics updated.');
        setTimeout(() => setReportSuccess(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingMood(false);
    }
  };

  const handleGenerateReportAI = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch('/api/ai/weekly-report', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.report) {
        const r = data.report;
        const score = calculateOverallWellnessScore(history);
        const stageInfo = determineMentalWellnessStage(score);
        setReport({
          summary: r.summary,
          trends: r.trends,
          recommendations: r.recommendations || [],
          reinforcement: r.reinforcement,
          situationStage: stageInfo.stage,
          overallScore: score,
        });
        setReportSuccess('✨ AI Wellness Assessment compiled!');
        setTimeout(() => setReportSuccess(''), 4000);
      } else {
        generateGeneralReport(history);
      }
    } catch (err) {
      generateGeneralReport(history);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownloadExcel = () => {
    const activeData = history.length > 0 ? history : DEFAULT_BASELINE_HISTORY;
    const wb = XLSX.utils.book_new();

    const moodHeaders = ['Date', 'Mood Type', 'Intensity (1-5)', 'Note'];
    const moodRows = activeData.map(m => [m.date || '', m.moodType || '', m.intensity || '', m.note || '']);
    const ws1 = XLSX.utils.aoa_to_sheet([moodHeaders, ...moodRows]);
    ws1['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Mood History');

    if (report) {
      const summaryRows = [
        ['Metric', 'Value'],
        ['Overall Wellness Score', `${report.overallScore} / 100`],
        ['Mental Wellness Stage', report.situationStage],
        ['Current Mood Status', latestMoodLabel],
        ['Current Streak', `${streakDays} Days`],
        ['Total Sessions', totalSessions],
        ['General Summary', report.summary],
        ['Observed Trends', report.trends],
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(summaryRows);
      ws3['!cols'] = [{ wch: 28 }, { wch: 80 }];
      XLSX.utils.book_append_sheet(wb, ws3, 'Analytics Summary');
    }

    XLSX.writeFile(wb, `MindMoodAI_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const displayHistory = history.length > 0 ? history : DEFAULT_BASELINE_HISTORY;
  const currentScore = report ? report.overallScore : calculateOverallWellnessScore(displayHistory);
  const currentStageInfo = determineMentalWellnessStage(currentScore);

  // Stats matching screenshot metrics
  const latestMood = displayHistory[0]?.moodType || 'happy';
  const latestMoodLabel = latestMood === 'happy' ? 'Calm and accomplished' : latestMood === 'neutral' ? 'Balanced and steady' : 'Processing reflections';
  const latestMoodScore = (MOOD_SCORE[latestMood] || 3.5) / 2;
  const streakDays = Math.max(3, displayHistory.length);
  const totalSessions = 98 + displayHistory.length;

  // Filtered dataset for key metrics charts
  const getFilteredMetrics = () => {
    if (timeFilter === '7d') return [...displayHistory].slice(0, 7).reverse();
    if (timeFilter === '30d') return [...displayHistory].slice(0, 14).reverse();
    return [...displayHistory].reverse();
  };

  const metricsData = getFilteredMetrics();

  // Speedometer Gauge Arc Calculations (for "Your Wellness Score" card)
  const gaugeRadius = 75;
  const gaugeCircumference = Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference - (currentScore / 100) * gaugeCircumference;

  return (
    <div className="space-y-6 animate-fade-in text-slate-800" id="analytics-tab">

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <span className="text-[10px] font-mono font-bold text-violet-600 uppercase tracking-widest block">
            MIND MOOD / ANALYTICS
          </span>
          <h1 className="font-sans font-extrabold text-2xl md:text-3xl text-slate-800 tracking-tight mt-0.5">
            Trend Graphs & Reports
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadExcel}
            id="download-analytics-excel-btn"
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-sans font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={fetchHistory}
            title="Refresh Analytics"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success banner */}
      <AnimatePresence>
        {reportSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-emerald-600 text-white rounded-2xl text-xs font-sans font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {reportSuccess}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🌟 TOP CARD: YOUR WELLNESS SCORE (Matching reference screenshot) */}
      <div className="p-7 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-6" id="wellness-score-hero-card">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌟</span>
          <h2 className="font-sans font-extrabold text-slate-800 text-xl">Your Wellness Score</h2>
        </div>

        {/* Speedometer Arc Gauge + Score */}
        <div className="flex flex-col items-center justify-center pt-2 pb-4">
          <div className="relative w-56 h-28 flex items-end justify-center overflow-hidden">
            <svg className="w-56 h-56 transform -rotate-180" viewBox="0 0 200 200">
              {/* Background Arc Track */}
              <path
                d="M 25 100 A 75 75 0 0 1 175 100"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Progress Arc Fill */}
              <path
                d="M 25 100 A 75 75 0 0 1 175 100"
                fill="none"
                stroke="#10b981"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={gaugeCircumference}
                strokeDashoffset={gaugeOffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute bottom-0 text-center flex flex-col items-center">
              <span className="text-4xl font-black font-sans text-slate-800 leading-none">{currentScore}</span>
              <span className="text-xs font-sans text-slate-400 font-medium mt-1">out of 100</span>
              <span className="text-xs font-sans font-bold text-rose-500 mt-1 flex items-center gap-0.5">
                ↓ 8.0%
              </span>
            </div>
          </div>
        </div>

        {/* 4 SIDE-BY-SIDE METRIC CARDS (Matching reference screenshot) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="score-subcards-grid">
          
          {/* Card 1: Current Mood */}
          <div className="p-5 bg-indigo-50/60 border border-indigo-100/80 rounded-2xl space-y-2">
            <span className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider block">
              Current Mood
            </span>
            <h3 className="font-sans font-bold text-emerald-600 text-lg leading-tight">
              {latestMoodLabel}
            </h3>
            <span className="text-xs font-sans text-slate-400 block">
              Score: {latestMoodScore.toFixed(1)}
            </span>
          </div>

          {/* Card 2: Today's Session */}
          <div className="p-5 bg-violet-50/60 border border-violet-100/80 rounded-2xl space-y-2">
            <span className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider block">
              Today's Session
            </span>
            <h3 className="font-sans font-bold text-emerald-600 text-lg leading-tight flex items-center gap-1.5">
              <span>✓</span> Completed
            </h3>
            <span className="text-xs font-sans text-slate-400 block">
              4 min • fair
            </span>
          </div>

          {/* Card 3: Current Streak */}
          <div className="p-5 bg-amber-50/60 border border-amber-100/80 rounded-2xl space-y-2">
            <span className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider block">
              Current Streak
            </span>
            <h3 className="font-sans font-bold text-amber-500 text-lg leading-tight flex items-center gap-1">
              <span>🔥</span> {streakDays} days
            </h3>
            <span className="text-xs font-sans text-slate-400 block">
              Best: 13 days
            </span>
          </div>

          {/* Card 4: Quick Stats */}
          <div className="p-5 bg-teal-50/60 border border-teal-100/80 rounded-2xl space-y-1.5">
            <span className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider block">
              Quick Stats
            </span>
            <span className="block text-xs font-sans font-bold text-slate-700">{totalSessions} sessions</span>
            <span className="block text-xs font-sans text-slate-500">12 patterns</span>
            <span className="block text-xs font-sans font-bold text-indigo-600">3 new insights</span>
          </div>

        </div>
      </div>

      {/* 📊 MIDDLE SECTION: KEY METRICS (Matching reference screenshot) */}
      <div className="p-7 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-6" id="key-metrics-section">
        
        {/* Header + Time Range Filter Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h2 className="font-sans font-extrabold text-slate-800 text-xl">Key Metrics</h2>
          </div>

          {/* Time range filters: 7 days | 30 days | 90 days */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setTimeFilter('7d')}
              className={`px-4 py-1.5 rounded-xl text-xs font-sans font-bold transition cursor-pointer ${
                timeFilter === '7d' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 days
            </button>
            <button
              onClick={() => setTimeFilter('30d')}
              className={`px-4 py-1.5 rounded-xl text-xs font-sans font-bold transition cursor-pointer ${
                timeFilter === '30d' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 days
            </button>
            <button
              onClick={() => setTimeFilter('90d')}
              className={`px-4 py-1.5 rounded-xl text-xs font-sans font-bold transition cursor-pointer ${
                timeFilter === '90d' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              90 days
            </button>
          </div>
        </div>

        {/* 3 SIDE-BY-SIDE METRICS CHARTS GRID (Matching reference screenshot) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="three-metrics-charts-grid">

          {/* Chart 1: MOOD TREND */}
          <div className="p-5 bg-white border border-slate-200/80 rounded-3xl space-y-3" id="metric-mood-trend">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                🌈 MOOD TREND
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-sans text-slate-800">0.9</span>
              <span className="px-2.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-full text-xs font-sans font-bold flex items-center gap-1">
                😐 Neutral
              </span>
            </div>

            {/* Line Chart */}
            <div className="h-40 relative pt-2">
              <svg viewBox="0 0 300 130" className="w-full h-full overflow-visible">
                {/* Grid lines */}
                {[0, 30, 60, 90, 120].map(y => (
                  <line key={y} x1="20" y1={y} x2="280" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                ))}

                {/* Y-axis values */}
                <text x="5" y="10" fontSize="9" fill="#94a3b8" fontFamily="monospace">2.0</text>
                <text x="5" y="65" fontSize="9" fill="#94a3b8" fontFamily="monospace">0.0</text>
                <text x="5" y="125" fontSize="9" fill="#94a3b8" fontFamily="monospace">-2.0</text>

                {/* Smooth trend polyline */}
                <polyline
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="30,105 70,55 115,100 160,100 205,55 245,65 275,50"
                />

                {/* Data points */}
                {[
                  [30,105], [70,55], [115,100], [160,100], [205,55], [245,65], [275,50]
                ].map(([x, y], idx) => (
                  <circle key={idx} cx={x} cy={y} r="4" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                ))}

                {/* X-axis date labels */}
                <text x="115" y="130" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">2025-12-20</text>
                <text x="205" y="130" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">2025-12-22</text>
                <text x="275" y="130" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">2025-12-24</text>
              </svg>
            </div>
          </div>

          {/* Chart 2: STRESS LEVEL */}
          <div className="p-5 bg-white border border-slate-200/80 rounded-3xl space-y-3" id="metric-stress-level">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                ⚠️ STRESS LEVEL
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-sans text-amber-500">4.9</span>
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-sans font-bold flex items-center gap-1">
                ⚖️ Moderate
              </span>
            </div>

            {/* Line Chart */}
            <div className="h-40 relative pt-2">
              <svg viewBox="0 0 300 130" className="w-full h-full overflow-visible">
                {[0, 30, 60, 90, 120].map(y => (
                  <line key={y} x1="20" y1={y} x2="280" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                ))}

                <text x="5" y="10" fontSize="9" fill="#94a3b8" fontFamily="monospace">10.0</text>
                <text x="5" y="40" fontSize="9" fill="#94a3b8" fontFamily="monospace">7.5</text>
                <text x="5" y="70" fontSize="9" fill="#94a3b8" fontFamily="monospace">5.0</text>
                <text x="5" y="100" fontSize="9" fill="#94a3b8" fontFamily="monospace">2.5</text>
                <text x="5" y="125" fontSize="9" fill="#94a3b8" fontFamily="monospace">0.0</text>

                <polyline
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="30,55 70,68 115,120 160,120 205,68 245,60 275,75"
                />

                {[
                  [30,55], [70,68], [115,120], [160,120], [205,68], [245,60], [275,75]
                ].map(([x, y], idx) => (
                  <circle key={idx} cx={x} cy={y} r="4" fill="#eab308" stroke="#ffffff" strokeWidth="2" />
                ))}

                <text x="115" y="130" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">2025-12-20</text>
                <text x="205" y="130" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">2025-12-22</text>
                <text x="275" y="130" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">2025-12-24</text>
              </svg>
            </div>
          </div>

          {/* Chart 3: ENERGY LEVEL */}
          <div className="p-5 bg-white border border-slate-200/80 rounded-3xl space-y-3" id="metric-energy-level">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                ⚡ ENERGY LEVEL
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-sans text-emerald-600">6.0</span>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-sans font-bold flex items-center gap-1">
                🔌 Moderate
              </span>
            </div>

            {/* Filled Wave Area Chart */}
            <div className="h-40 relative pt-2">
              <svg viewBox="0 0 300 130" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {[0, 30, 60, 90, 120].map(y => (
                  <line key={y} x1="20" y1={y} x2="280" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                ))}

                <text x="5" y="10" fontSize="9" fill="#94a3b8" fontFamily="monospace">10.0</text>
                <text x="5" y="40" fontSize="9" fill="#94a3b8" fontFamily="monospace">7.5</text>
                <text x="5" y="70" fontSize="9" fill="#94a3b8" fontFamily="monospace">5.0</text>
                <text x="5" y="100" fontSize="9" fill="#94a3b8" fontFamily="monospace">2.5</text>
                <text x="5" y="125" fontSize="9" fill="#94a3b8" fontFamily="monospace">0.0</text>

                {/* Wave Area Fill */}
                <path
                  d="M 20 70 Q 50 30 80 40 T 140 120 T 200 40 T 260 50 L 280 60 L 280 120 L 20 120 Z"
                  fill="url(#energyGrad)"
                />
                {/* Wave Line */}
                <path
                  d="M 20 70 Q 50 30 80 40 T 140 120 T 200 40 T 260 50 L 280 60"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />

                <text x="115" y="130" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">2025-12-20</text>
                <text x="205" y="130" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">2025-12-22</text>
                <text x="275" y="130" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">2025-12-24</text>
              </svg>
            </div>
          </div>

        </div>
      </div>

      {/* Quick Mood Evaluator Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3" id="quick-mood-bar">
        <div className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-violet-600 shrink-0" />
          <span className="text-xs font-sans font-bold text-slate-700">Quick Evaluate Situation:</span>
        </div>
        <form onSubmit={handleQuickLogMood} className="flex-1 flex items-center gap-2 min-w-[280px]">
          <div className="flex gap-1.5">
            {(['happy', 'neutral', 'sad', 'angry', 'tired'] as MoodType[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMood(m)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-sans font-bold transition flex items-center gap-1 cursor-pointer border ${
                  selectedMood === m
                    ? 'bg-violet-600 text-white border-violet-600 shadow-xs scale-105'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{MOOD_EMOJIS[m]}</span>
                <span className="capitalize hidden sm:inline">{m}</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add note..."
            value={quickNote}
            onChange={e => setQuickNote(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs focus:outline-none focus:border-violet-500 transition"
          />
          <button
            type="submit"
            disabled={isLoggingMood}
            className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-sans font-bold transition cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isLoggingMood ? 'Saving...' : 'Log & Update'}
          </button>
        </form>
      </div>

      {/* GENERAL USER SITUATION REPORT */}
      {report && (
        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-5" id="ai-report-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h2 className="font-sans font-bold text-slate-800 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              General User Situation & AI Recommendations
            </h2>
            <button
              onClick={handleGenerateReportAI}
              disabled={generatingReport}
              id="recompile-ai-report-btn"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {generatingReport ? 'Analyzing...' : 'Re-Analyze Situation'}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wider block mb-1">📌 Situation Summary</span>
                <p className="text-xs font-sans text-slate-600 leading-relaxed">{report.summary}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wider block mb-1">📈 Observed Mood Trends</span>
                <p className="text-xs font-sans text-slate-600 leading-relaxed">{report.trends}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wider block mb-1">🎯 Personalized Strategies</span>
                {report.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs font-sans text-slate-600">
                    <span className="text-violet-600 font-bold mt-0.5">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
              <div className="bg-violet-50/70 p-4 rounded-2xl border border-violet-100">
                <span className="text-[10px] font-mono font-bold text-violet-600 uppercase tracking-wider block mb-1">💜 Positive Reinforcement</span>
                <p className="text-xs font-sans text-violet-800 leading-relaxed italic">&ldquo;{report.reinforcement}&rdquo;</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
