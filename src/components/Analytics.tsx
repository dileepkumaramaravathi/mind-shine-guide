/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Sparkles, TrendingUp, Activity, FileSpreadsheet, RefreshCw, Calendar, Brain, Heart, CheckCircle2, AlertCircle, PlusCircle, Shield, Award, Zap, ArrowUpRight, ArrowDownRight, Compass } from 'lucide-react';
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
  { id: 'b1', userId: 'usr', moodType: 'neutral', intensity: 3, note: 'Baseline check-in', date: 'Jul 19', createdAt: '2026-07-19T10:00:00Z' },
  { id: 'b2', userId: 'usr', moodType: 'happy', intensity: 4, note: 'Morning walk', date: 'Jul 20', createdAt: '2026-07-20T10:00:00Z' },
  { id: 'b3', userId: 'usr', moodType: 'happy', intensity: 4, note: 'Great team sync', date: 'Jul 21', createdAt: '2026-07-21T10:00:00Z' },
  { id: 'b4', userId: 'usr', moodType: 'tired', intensity: 2, note: 'Evening fatigue', date: 'Jul 22', createdAt: '2026-07-22T10:00:00Z' },
  { id: 'b5', userId: 'usr', moodType: 'neutral', intensity: 3, note: 'Steady focus', date: 'Jul 23', createdAt: '2026-07-23T10:00:00Z' },
  { id: 'b6', userId: 'usr', moodType: 'happy', intensity: 5, note: 'Completed milestone', date: 'Jul 24', createdAt: '2026-07-24T10:00:00Z' },
  { id: 'b7', userId: 'usr', moodType: 'happy', intensity: 4, note: 'Relaxing weekend', date: 'Jul 25', createdAt: '2026-07-25T10:00:00Z' },
];

export default function Analytics({ token, onNavigate }: AnalyticsProps) {
  const [history, setHistory] = useState<Mood[]>([]);
  const [report, setReport] = useState<GeneralReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [reportSuccess, setReportSuccess] = useState('');

  // Time range selector: 7d | 30d | all
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('7d');
  // Analysis view tab: daily | weekly | monthly
  const [analysisPeriod, setAnalysisPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

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
    if (score >= 90) {
      return {
        stage: 'Excellent Mental Wellness',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        desc: 'Peak cognitive resilience, high emotional positivity, and optimal self-reflection habits.',
      };
    } else if (score >= 80) {
      return {
        stage: 'Positive Growth Stage',
        color: 'text-teal-600',
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        desc: 'Continuous upward emotional trend with strong coping mechanisms.',
      };
    } else if (score >= 70) {
      return {
        stage: 'Healthy and Stable',
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        desc: 'Consistent emotional equilibrium and healthy daily reflection.',
      };
    } else if (score >= 60) {
      return {
        stage: 'Improving',
        color: 'text-sky-600',
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        desc: 'Positive momentum in recovery. Keep up regular mindfulness loops.',
      };
    } else if (score >= 55) {
      return {
        stage: 'Recovery Stage',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        desc: 'Restoring energy after a demanding cycle. Gentle self-care recommended.',
      };
    } else if (score >= 45) {
      return {
        stage: 'Mild Stress',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        desc: 'Experiencing minor tension. Daily 4-4-4 Box Breathing is recommended.',
      };
    } else if (score >= 35) {
      return {
        stage: 'Moderate Stress',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        desc: 'Elevated stress markers. Consider quiet journaling and AI chat check-ins.',
      };
    } else if (score >= 25) {
      return {
        stage: 'High Stress',
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        desc: 'Significant strain detected. Engage in guided relaxation sessions.',
      };
    } else if (score >= 15) {
      return {
        stage: 'Anxiety Risk',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        desc: 'Anxiety indicators present. Reach out to supportive peers in Community Plaza.',
      };
    } else if (score >= 5) {
      return {
        stage: 'Burnout Risk',
        color: 'text-pink-600',
        bg: 'bg-pink-50',
        border: 'border-pink-200',
        desc: 'High exhaustion risk. Prioritize restorative sleep and step back from stressors.',
      };
    } else {
      return {
        stage: 'Needs Wellness Support',
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        desc: 'Emotional distress detected. Connect with our supportive AI therapist guide.',
      };
    }
  };

  const generateGeneralReport = (logs: Mood[]) => {
    const score = calculateOverallWellnessScore(logs);
    const stageInfo = determineMentalWellnessStage(score);

    setReport({
      summary: `Your overall wellness situation evaluates at a score of ${score}/100. ${stageInfo.desc}`,
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

    // Sheet 1: Mood History
    const moodHeaders = ['Date', 'Mood Type', 'Intensity (1-5)', 'Note'];
    const moodRows = activeData.map(m => [m.date || '', m.moodType || '', m.intensity || '', m.note || '']);
    const ws1 = XLSX.utils.aoa_to_sheet([moodHeaders, ...moodRows]);
    ws1['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Mood History');

    // Sheet 2: Emotion Distribution
    const distHeaders = ['Mood Type', 'Count', 'Percentage'];
    const totalCnt = Object.values(counts).reduce((a, b) => a + b, 0);
    const distRows = (Object.keys(counts) as MoodType[]).map(mtype => [
      mtype,
      counts[mtype],
      totalCnt > 0 ? `${Math.round((counts[mtype] / totalCnt) * 100)}%` : '0%',
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([distHeaders, ...distRows]);
    ws2['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Mood Distribution');

    // Sheet 3: Wellness Analytics & Stage
    if (report) {
      const summaryRows = [
        ['Metric', 'Value'],
        ['Overall Wellness Score', `${report.overallScore} / 100`],
        ['Mental Wellness Stage', report.situationStage],
        ['Emotional Stability Index', `${emotionalStability}%`],
        ['Mood Improvement', `${improvementRate}%`],
        ['Weekly Progress', `${weeklyProgress}%`],
        ['Monthly Progress', `${monthlyProgress}%`],
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

  // Emotion count calculations
  const counts: { [key in MoodType]: number } = { happy: 0, neutral: 0, sad: 0, angry: 0, tired: 0 };
  displayHistory.forEach(m => { if (counts[m.moodType] !== undefined) counts[m.moodType]++; });
  const totalCounts = Object.values(counts).reduce((a, b) => a + b, 0);

  // Time-filtered history data for charts
  const getFilteredHistory = () => {
    if (timeFilter === '7d') return [...displayHistory].slice(0, 7).reverse();
    if (timeFilter === '30d') return [...displayHistory].slice(0, 30).reverse();
    return [...displayHistory].reverse();
  };

  const chartData = getFilteredHistory();
  const chartW = 500, chartH = 200, chartP = 35;

  const getChartCoords = () => {
    if (chartData.length < 2) return '';
    return chartData.map((m, i) => {
      const x = chartP + (i * (chartW - chartP * 2)) / (chartData.length - 1);
      const score = MOOD_SCORE[m.moodType] || 3;
      const y = chartH - chartP - ((score - 1) * (chartH - chartP * 2)) / 4;
      return `${x},${y}`;
    }).join(' ');
  };

  // Analytics Metrics Computations
  const currentScore = report ? report.overallScore : calculateOverallWellnessScore(displayHistory);
  const currentStageInfo = determineMentalWellnessStage(currentScore);

  // Emotional stability % based on variance
  const happyRatio = totalCounts > 0 ? (counts.happy + counts.neutral) / totalCounts : 0.8;
  const emotionalStability = Math.round(happyRatio * 100);

  // Improvement % comparing recent half vs older half
  const halfLen = Math.floor(displayHistory.length / 2);
  const recentHalf = displayHistory.slice(0, Math.max(1, halfLen));
  const olderHalf = displayHistory.slice(Math.max(1, halfLen));
  const recentAvg = recentHalf.reduce((a, m) => a + MOOD_SCORE[m.moodType], 0) / Math.max(1, recentHalf.length);
  const olderAvg = olderHalf.reduce((a, m) => a + MOOD_SCORE[m.moodType], 0) / Math.max(1, olderHalf.length);
  const improvementRate = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 12;

  // Weekly & Monthly progress percentages
  const weeklyProgress = Math.min(100, Math.max(30, Math.round(displayHistory.length * 14)));
  const monthlyProgress = Math.min(100, Math.max(25, Math.round(displayHistory.length * 8)));

  return (
    <div className="space-y-6 animate-fade-in" id="analytics-tab">

      {/* Header Banner */}
      <div className="p-7 bg-gradient-to-br from-indigo-950 via-violet-900 to-slate-900 text-white rounded-3xl relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-violet-600/60 border border-violet-400/40 text-white text-[10px] font-sans font-bold uppercase tracking-wider rounded-full">
              Intelligent Mental Wellness Analytics
            </span>
            <h1 className="font-sans font-extrabold text-2xl md:text-3xl mt-3 tracking-tight">
              Analytics & Insights Dashboard 📊
            </h1>
            <p className="text-slate-300 text-xs mt-1.5 max-w-xl leading-relaxed">
              Real-time mood trends, emotional stability index, mental wellness stage analysis, and AI-powered recommendations.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadExcel}
              id="download-analytics-excel-btn"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-sans font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>
            <button
              onClick={fetchHistory}
              title="Refresh Analytics"
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Success Banner */}
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

      {/* OVERALL WELLNESS SCORE & CURRENT STAGE BANNER */}
      <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4" id="wellness-stage-summary-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex flex-col items-center justify-center shadow-md shrink-0">
              <span className="text-[10px] font-mono uppercase font-bold text-white/70">Score</span>
              <span className="text-2xl font-black font-sans">{currentScore}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                Current Mental Wellness Stage
              </span>
              <h2 className="font-sans font-extrabold text-slate-800 text-lg md:text-xl flex items-center gap-2 mt-0.5">
                <Brain className="w-5 h-5 text-violet-600" />
                {currentStageInfo.stage}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-full text-xs font-sans font-bold border ${currentStageInfo.bg} ${currentStageInfo.color} ${currentStageInfo.border}`}>
              {currentStageInfo.stage}
            </span>
          </div>
        </div>

        <p className="text-xs font-sans text-slate-600 leading-relaxed">
          {currentStageInfo.desc}
        </p>

        {/* 4 CORE ANALYTICS METRICS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2" id="core-metrics-row">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Emotional Stability</span>
            <span className="font-sans font-black text-xl text-indigo-600 mt-1 block">{emotionalStability}%</span>
            <span className="text-[10px] text-slate-400 font-sans">Equilibrium Index</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Mood Improvement</span>
            <span className={`font-sans font-black text-xl mt-1 block flex items-center gap-1 ${improvementRate >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {improvementRate >= 0 ? <ArrowUpRight className="w-4 h-4 inline" /> : <ArrowDownRight className="w-4 h-4 inline" />}
              {improvementRate >= 0 ? `+${improvementRate}%` : `${improvementRate}%`}
            </span>
            <span className="text-[10px] text-slate-400 font-sans">vs Previous Cycle</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Weekly Progress</span>
            <span className="font-sans font-black text-xl text-violet-600 mt-1 block">{weeklyProgress}%</span>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-violet-600 rounded-full" style={{ width: `${weeklyProgress}%` }}></div>
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Monthly Progress</span>
            <span className="font-sans font-black text-xl text-teal-600 mt-1 block">{monthlyProgress}%</span>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${monthlyProgress}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* AI GENERAL SITUATION & RECOMMENDATIONS REPORT */}
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

      {/* CHARTS GRID WITH FILTER TABS */}
      <div className="grid lg:grid-cols-12 gap-6" id="graphs-grid">

        {/* Mood Trend Line (8 cols) */}
        <div className="lg:col-span-8 p-6 bg-white rounded-3xl border border-slate-100 shadow-xs" id="trend-line-component">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-sans font-bold text-slate-800 text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                Mood History Timeline
              </h2>
              <p className="text-xs font-sans text-slate-400 mt-0.5">Tracking values across recorded mood states</p>
            </div>

            {/* Time Filter Controls: 7d | 30d | all */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button
                onClick={() => setTimeFilter('7d')}
                className={`px-3 py-1 rounded-lg text-xs font-sans font-bold transition cursor-pointer ${
                  timeFilter === '7d' ? 'bg-white text-violet-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeFilter('30d')}
                className={`px-3 py-1 rounded-lg text-xs font-sans font-bold transition cursor-pointer ${
                  timeFilter === '30d' ? 'bg-white text-violet-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-sans font-bold transition cursor-pointer ${
                  timeFilter === 'all' ? 'bg-white text-violet-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          <div className="relative" id="trend-canvas-container">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto overflow-visible">
              {/* Grid lines */}
              {[1, 2, 3, 4, 5].map(val => {
                const y = chartH - chartP - ((val - 1) * (chartH - chartP * 2)) / 4;
                return (
                  <line key={val} x1={chartP} y1={y} x2={chartW - chartP} y2={y}
                    stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4,4" />
                );
              })}

              {/* Gradient area */}
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Polygon */}
              {chartData.length >= 2 && (() => {
                const pts = chartData.map((m, i) => {
                  const x = chartP + (i * (chartW - chartP * 2)) / (chartData.length - 1);
                  const score = MOOD_SCORE[m.moodType] || 3;
                  const y = chartH - chartP - ((score - 1) * (chartH - chartP * 2)) / 4;
                  return `${x},${y}`;
                });
                const firstX = chartP;
                const lastX = chartP + ((chartData.length - 1) * (chartW - chartP * 2)) / (chartData.length - 1);
                return (
                  <polygon
                    points={`${firstX},${chartH - chartP} ${pts.join(' ')} ${lastX},${chartH - chartP}`}
                    fill="url(#chartGrad)"
                  />
                );
              })()}

              {/* Polyline */}
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={getChartCoords()}
              />

              {/* Interactive dots */}
              {chartData.map((m, i) => {
                const x = chartP + (i * (chartW - chartP * 2)) / (chartData.length - 1);
                const score = MOOD_SCORE[m.moodType] || 3;
                const y = chartH - chartP - ((score - 1) * (chartH - chartP * 2)) / 4;
                const isHovered = hoveredPoint === i;

                return (
                  <g key={m.id || i} onMouseEnter={() => setHoveredPoint(i)} onMouseLeave={() => setHoveredPoint(null)} className="cursor-pointer">
                    <circle cx={x} cy={y} r={isHovered ? 9 : 5.5}
                      fill={MOOD_COLORS[m.moodType]} stroke="#ffffff" strokeWidth="2.5"
                      className="transition-all duration-150" />
                  </g>
                );
              })}

              {/* X-axis labels */}
              {chartData.map((m, i) => {
                const x = chartP + (i * (chartW - chartP * 2)) / (chartData.length - 1);
                return (
                  <text key={i} x={x} y={chartH - 4} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                    {m.date || `P${i+1}`}
                  </text>
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint !== null && chartData[hoveredPoint] && (
              <div
                className="absolute bg-slate-900 text-white p-3 rounded-xl text-xs font-sans space-y-1 z-10 shadow-lg pointer-events-none"
                style={{
                  left: `${Math.min(85, (hoveredPoint / Math.max(1, chartData.length - 1)) * 80 + 10)}%`,
                  bottom: '65%',
                }}
              >
                <div className="font-bold flex items-center gap-1.5 capitalize">
                  <span>{MOOD_EMOJIS[chartData[hoveredPoint].moodType]}</span>
                  <span>{chartData[hoveredPoint].moodType}</span>
                </div>
                <div className="text-[10px] text-slate-300">{chartData[hoveredPoint].date}</div>
                {chartData[hoveredPoint].note && (
                  <div className="text-[9px] italic text-violet-300 max-w-[150px] truncate">
                    &ldquo;{chartData[hoveredPoint].note}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Emotion Distribution (4 cols) */}
        <div className="lg:col-span-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between" id="distribution-pie-component">
          <div>
            <h2 className="font-sans font-bold text-slate-800 text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-600" />
              Emotional Shares
            </h2>
            <p className="text-xs font-sans text-slate-400 mt-0.5">Allocation of logged emotions</p>
          </div>

          <div className="my-4 space-y-3" id="share-progress-lines">
            {(Object.keys(counts) as MoodType[]).map(mtype => {
              const num = counts[mtype];
              const pct = totalCounts > 0 ? Math.round((num / totalCounts) * 100) : 0;
              return (
                <div key={mtype} className="space-y-1" id={`share-${mtype}`}>
                  <div className="flex justify-between text-xs font-sans">
                    <span className="font-medium text-slate-700">{MOOD_LABELS[mtype]}</span>
                    <span className="font-bold text-slate-500">{pct}% <span className="text-slate-300 font-normal">({num})</span></span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: MOOD_COLORS[mtype] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl text-[11px] font-sans text-slate-500 text-center border border-slate-100">
            Total of <strong>{totalCounts}</strong> evaluations tracked
          </div>
        </div>

      </div>

    </div>
  );
}
