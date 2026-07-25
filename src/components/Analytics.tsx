/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Sparkles, TrendingUp, Activity, FileSpreadsheet, RefreshCw, Calendar, Brain, Heart, CheckCircle2, AlertCircle, PlusCircle } from 'lucide-react';
import { Mood, MoodType } from '../types';
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
  situationStage: string;
  overallStatus: string;
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

// Default baseline history data when user has 0 logs so charts are NEVER blank
const DEFAULT_BASELINE_HISTORY: Mood[] = [
  { id: 'b1', userId: 'usr', moodType: 'neutral', intensity: 3, note: 'Baseline check-in', date: 'Jul 21' },
  { id: 'b2', userId: 'usr', moodType: 'happy', intensity: 4, note: 'Morning walk & sunshine', date: 'Jul 22' },
  { id: 'b3', userId: 'usr', moodType: 'tired', intensity: 2, note: 'Late night study', date: 'Jul 23' },
  { id: 'b4', userId: 'usr', moodType: 'neutral', intensity: 3, note: 'Steady focus day', date: 'Jul 24' },
  { id: 'b5', userId: 'usr', moodType: 'happy', intensity: 5, note: 'Achieved daily wellness goals', date: 'Jul 25' },
];

export default function Analytics({ token, onNavigate }: AnalyticsProps) {
  const [history, setHistory] = useState<Mood[]>([]);
  const [report, setReport] = useState<GeneralReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [reportSuccess, setReportSuccess] = useState('');
  
  // Quick mood logging state directly on Analytics page
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
        // Automatically build general situation report for the user
        generateGeneralReport(logs);
      }
    } catch (err) {
      console.error(err);
      generateGeneralReport([]);
    } fontually();
  };

  const fontually = () => setIsLoading(false);

  const generateGeneralReport = (logs: Mood[]) => {
    const activeData = logs.length > 0 ? logs : DEFAULT_BASELINE_HISTORY;
    const totalLogs = activeData.length;
    
    // Calculate average score
    const totalScore = activeData.reduce((acc, m) => acc + (MOOD_SCORE[m.moodType] || 3), 0);
    const avgScore = Number((totalScore / totalLogs).toFixed(1));

    let situationStage = 'Stage 3: Balanced & Stable ⚖️';
    let overallStatus = 'Healthy Equilibrium';
    let summary = 'Based on your overall situation and emotional logging history, you are maintaining a stable mental baseline. You display good self-awareness and active reflection.';
    let trends = 'Mood patterns indicate steady emotional equilibrium with occasional fluctuations during demanding hours. Evening reflections show positive recovery.';
    let recommendations = [
      'Maintain 10 minutes of daily guided 4-4-4 Box Breathing for continuous focus.',
      'Log your emotional state twice daily (morning & evening) to refine accuracy.',
      'Engage with supportive peers in the Community Plaza to share uplifting affirmations.'
    ];
    let reinforcement = 'Self-awareness is the foundation of mental strength. Your commitment to tracking your emotional state reflects high psychological maturity.';

    if (avgScore >= 4.0) {
      situationStage = 'Stage 4: Thriving & Flourishing 🌟';
      overallStatus = 'Optimal Mental Resilience';
      summary = 'Your current emotional situation is exceptionally positive! You are experiencing high vitality, strong mental resilience, and productive cognitive energy.';
      trends = 'Trajectory shows consistent high-frequency happy logs and low stress markers across recent days.';
    } else if (avgScore < 2.5) {
      situationStage = 'Stage 2: Healing & Self-Care 🌿';
      overallStatus = 'Restorative Care Recommended';
      summary = 'Your recent situation suggests feelings of fatigue or emotional tension. Your mind is requesting restful pauses and restorative self-care.';
      trends = 'Logged entries show periods of fatigue or stress. Daily relaxation loops are strongly advised.';
    }

    setReport({
      summary,
      trends,
      recommendations,
      reinforcement,
      situationStage,
      overallStatus,
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
          note: quickNote.trim() || `Analytics quick check-in (${selectedMood})`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setHistory(prev => [data.mood, ...prev]);
        generateGeneralReport([data.mood, ...history]);
        setQuickNote('');
        setReportSuccess('✅ Mood logged! Analytics updated in real-time.');
        setTimeout(() => setReportSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Quick log failed:', err);
    } finally {
      setIsLoggingMood(false);
    }
  };

  const handleGenerateReportAI = async () => {
    setGeneratingReport(true);
    setReportSuccess('');
    try {
      const res = await fetch('/api/ai/weekly-report', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.report) {
        const r = data.report;
        setReport({
          summary: r.summary,
          trends: r.trends,
          recommendations: r.recommendations || [],
          reinforcement: r.reinforcement,
          situationStage: 'AI Synthesized Assessment 🧠',
          overallStatus: 'Personalized Clinical Analysis',
        });
        setReportSuccess('✨ AI General Situation Report generated successfully!');
        setTimeout(() => setReportSuccess(''), 4000);
      } else {
        // Fallback generator
        generateGeneralReport(history);
        setReportSuccess('✨ General User Situation Report updated!');
        setTimeout(() => setReportSuccess(''), 4000);
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

    // Sheet 1: Full mood history
    const moodHeaders = ['Date', 'Mood Type', 'Intensity (1-5)', 'Note'];
    const moodRows = activeData.map(m => [
      m.date || '',
      m.moodType || '',
      m.intensity || '',
      m.note || '',
    ]);
    const ws1 = XLSX.utils.aoa_to_sheet([moodHeaders, ...moodRows]);
    ws1['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Mood History');

    // Sheet 2: Emotion distribution
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

    // Sheet 3: General User Situation Report
    if (report) {
      const reportRows = [
        ['Field', 'Content'],
        ['Situation Stage', report.situationStage],
        ['Overall Status', report.overallStatus],
        ['General Summary', report.summary],
        ['Observed Trends', report.trends],
        ['Positive Reinforcement', report.reinforcement],
        ['Strategy 1', report.recommendations[0] || ''],
        ['Strategy 2', report.recommendations[1] || ''],
        ['Strategy 3', report.recommendations[2] || ''],
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(reportRows);
      ws3['!cols'] = [{ wch: 25 }, { wch: 80 }];
      XLSX.utils.book_append_sheet(wb, ws3, 'General User Report');
    }

    XLSX.writeFile(wb, `MindMoodAI_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Determine active display data (uses real history or baseline if user has 0 logs)
  const displayHistory = history.length > 0 ? history : DEFAULT_BASELINE_HISTORY;

  // Emotion count calculations
  const counts: { [key in MoodType]: number } = {
    happy: 0, neutral: 0, sad: 0, angry: 0, tired: 0,
  };
  displayHistory.forEach(m => { if (counts[m.moodType] !== undefined) counts[m.moodType]++; });
  const totalCounts = Object.values(counts).reduce((a, b) => a + b, 0);

  // Chart dataset (last 7 points)
  const last7Moods = [...displayHistory].slice(0, 7).reverse();
  const chartW = 500, chartH = 200, chartP = 35;

  const getChartCoords = () => {
    if (last7Moods.length < 2) return '';
    return last7Moods.map((m, i) => {
      const x = chartP + (i * (chartW - chartP * 2)) / (last7Moods.length - 1);
      const score = MOOD_SCORE[m.moodType] || 3;
      const y = chartH - chartP - ((score - 1) * (chartH - chartP * 2)) / 4;
      return `${x},${y}`;
    }).join(' ');
  };

  // Overall average score calculation out of 5
  const avgScoreVal = (displayHistory.reduce((a, b) => a + (MOOD_SCORE[b.moodType] || 3), 0) / displayHistory.length).toFixed(1);

  return (
    <div className="space-y-6 animate-fade-in" id="analytics-tab">

      {/* Main Banner */}
      <div className="p-7 bg-gradient-to-br from-indigo-950 via-violet-900 to-slate-900 text-white rounded-3xl relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-violet-600/60 border border-violet-400/40 text-white text-[10px] font-sans font-bold uppercase tracking-wider rounded-full">
              User Situation & Psychological Engine
            </span>
            <h1 className="font-sans font-extrabold text-2xl md:text-3xl mt-3 tracking-tight">
              Analytics & General Report 📊
            </h1>
            <p className="text-slate-300 text-xs mt-1.5 max-w-xl leading-relaxed">
              Comprehensive psychological overview of your situation, emotional trends, baseline average scores, and personalized wellness strategies.
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

      {/* Success notification */}
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

      {/* Quick Mood Evaluator Bar — Log right inside Analytics! */}
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
            placeholder="Optional note..."
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

      {/* GENERAL MATTER REPORT OF USER SITUATION */}
      {report && (
        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-5" id="general-user-report-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 text-violet-700 rounded-2xl flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-violet-600 uppercase tracking-widest block">
                  General Matter Report of User Situation
                </span>
                <h2 className="font-sans font-extrabold text-slate-800 text-lg">
                  {report.situationStage}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Average Score</span>
                <span className="font-sans font-black text-2xl text-violet-700">{avgScoreVal} / 5.0</span>
              </div>
              <span className="px-3.5 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-full font-sans font-bold text-xs">
                {report.overallStatus}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6" id="report-grid-details">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                  📌 Situation Overview
                </span>
                <p className="text-xs font-sans text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {report.summary}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                  📈 Observed Emotional Trends
                </span>
                <p className="text-xs font-sans text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {report.trends}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                  🎯 Recommended Strategies
                </span>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  {report.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs font-sans text-slate-600">
                      <span className="text-violet-600 font-bold mt-0.5">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold text-violet-600 uppercase tracking-wider block mb-1">
                  💜 Positive Reinforcement
                </span>
                <p className="text-xs font-sans text-violet-800 leading-relaxed bg-violet-50/70 p-4 rounded-2xl border border-violet-100 italic">
                  &ldquo;{report.reinforcement}&rdquo;
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleGenerateReportAI}
              disabled={generatingReport}
              id="recompile-ai-report-btn"
              className="px-5 py-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:opacity-95 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {generatingReport ? 'Re-analyzing with AI...' : 'Re-Analyze Situation with AI'}
            </button>
          </div>
        </div>
      )}

      {/* CHARTS GRID */}
      <div className="grid lg:grid-cols-12 gap-6" id="graphs-grid">

        {/* Mood Trend Line (8 cols) */}
        <div className="lg:col-span-8 p-6 bg-white rounded-3xl border border-slate-100 shadow-xs" id="trend-line-component">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-sans font-bold text-slate-800 text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                Mood Trend Timeline
              </h2>
              <p className="text-xs font-sans text-slate-400 mt-0.5">
                {history.length > 0 ? `Tracking last ${Math.min(history.length, 7)} recorded states` : 'Baseline evaluation tracking'}
              </p>
            </div>
            <span className="text-xs font-sans font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">
              {history.length > 0 ? `${history.length} Logs Saved` : 'Baseline View'}
            </span>
          </div>

          <div className="relative" id="trend-canvas-container">
            {/* SVG Chart */}
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto overflow-visible">
              {/* Grid lines */}
              {[1, 2, 3, 4, 5].map(val => {
                const y = chartH - chartP - ((val - 1) * (chartH - chartP * 2)) / 4;
                return (
                  <line key={val} x1={chartP} y1={y} x2={chartW - chartP} y2={y}
                    stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4,4" />
                );
              })}

              {/* Gradient area under line */}
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Filled area polygon */}
              {last7Moods.length >= 2 && (() => {
                const pts = last7Moods.map((m, i) => {
                  const x = chartP + (i * (chartW - chartP * 2)) / (last7Moods.length - 1);
                  const score = MOOD_SCORE[m.moodType] || 3;
                  const y = chartH - chartP - ((score - 1) * (chartH - chartP * 2)) / 4;
                  return `${x},${y}`;
                });
                const firstX = chartP;
                const lastX = chartP + ((last7Moods.length - 1) * (chartW - chartP * 2)) / (last7Moods.length - 1);
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
              {last7Moods.map((m, i) => {
                const x = chartP + (i * (chartW - chartP * 2)) / (last7Moods.length - 1);
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
              {last7Moods.map((m, i) => {
                const x = chartP + (i * (chartW - chartP * 2)) / (last7Moods.length - 1);
                return (
                  <text key={i} x={x} y={chartH - 4} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                    {m.date || `Entry ${i+1}`}
                  </text>
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint !== null && last7Moods[hoveredPoint] && (
              <div
                className="absolute bg-slate-900 text-white p-3 rounded-xl text-xs font-sans space-y-1 z-10 shadow-lg pointer-events-none"
                style={{
                  left: `${Math.min(85, (hoveredPoint / Math.max(1, last7Moods.length - 1)) * 80 + 10)}%`,
                  bottom: '65%',
                }}
              >
                <div className="font-bold flex items-center gap-1.5 capitalize">
                  <span>{MOOD_EMOJIS[last7Moods[hoveredPoint].moodType]}</span>
                  <span>{last7Moods[hoveredPoint].moodType}</span>
                </div>
                <div className="text-[10px] text-slate-300">{last7Moods[hoveredPoint].date}</div>
                {last7Moods[hoveredPoint].note && (
                  <div className="text-[9px] italic text-violet-300 max-w-[150px] truncate">
                    &ldquo;{last7Moods[hoveredPoint].note}&rdquo;
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
