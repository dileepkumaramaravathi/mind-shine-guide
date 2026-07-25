/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Sparkles, TrendingUp, Activity, FileSpreadsheet, RefreshCw, ArrowRight, Calendar, Brain } from 'lucide-react';
import { Mood, MoodType } from '../types';
import * as XLSX from 'xlsx';

interface AnalyticsProps {
  token: string;
  onNavigate?: (view: string) => void;
}

interface WeeklyReport {
  summary: string;
  trends: string;
  recommendations: string[];
  reinforcement: string;
}

const MOOD_SCORE: { [key in MoodType]: number } = {
  happy: 5,
  neutral: 3,
  sad: 2,
  angry: 1,
  tired: 1,
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

export default function Analytics({ token, onNavigate }: AnalyticsProps) {
  const [history, setHistory] = useState<Mood[]>([]);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [reportError, setReportError] = useState('');

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
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (history.length === 0) {
      setReportError('Please log at least one mood entry first, then generate your AI report.');
      setTimeout(() => setReportError(''), 5000);
      return;
    }
    setGeneratingReport(true);
    setReport(null);
    setReportError('');
    try {
      const res = await fetch('/api/ai/weekly-report', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.report) {
        setReport(data.report);
      } else if (data.fallback) {
        // Use fallback report if Gemini API key not set
        setReport(data.fallback);
      } else {
        setReportError(data.error || 'AI report generation failed. Please try again.');
        setTimeout(() => setReportError(''), 6000);
      }
    } catch (err) {
      setReportError('Network error generating report. Please try again.');
      setTimeout(() => setReportError(''), 5000);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Full mood history (even if empty, write headers)
    const moodHeaders = ['Date', 'Mood Type', 'Intensity (1-5)', 'Note'];
    const moodRows = history.map(m => [
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

    // Sheet 3: Summary stats
    const summaryData = [
      ['Statistic', 'Value'],
      ['Total Mood Logs', history.length],
      ['Most Common Mood', history.length > 0 ? getMostCommonMood() : 'N/A'],
      ['Average Intensity', history.length > 0 ? getAvgIntensity() : 'N/A'],
      ['Report Generated', new Date().toLocaleString()],
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(summaryData);
    ws3['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Summary Stats');

    XLSX.writeFile(wb, `MindMoodAI_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Helper calculations
  const counts: { [key in MoodType]: number } = {
    happy: 0, neutral: 0, sad: 0, angry: 0, tired: 0,
  };
  history.forEach(m => { if (counts[m.moodType] !== undefined) counts[m.moodType]++; });
  const totalCounts = Object.values(counts).reduce((a, b) => a + b, 0);

  const getMostCommonMood = (): string => {
    let max = 0, best: MoodType = 'neutral';
    (Object.keys(counts) as MoodType[]).forEach(k => { if (counts[k] > max) { max = counts[k]; best = k; } });
    return best;
  };

  const getAvgIntensity = (): string => {
    const withIntensity = history.filter(m => m.intensity);
    if (withIntensity.length === 0) return 'N/A';
    const avg = withIntensity.reduce((a, m) => a + (m.intensity || 0), 0) / withIntensity.length;
    return avg.toFixed(1) + ' / 5';
  };

  // Chart data — last 7 mood entries
  const last7Moods = [...history].slice(0, 7).reverse();
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

  // Stats cards data
  const statsCards = [
    {
      label: 'Total Logs',
      value: history.length,
      icon: Calendar,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
    },
    {
      label: 'Most Common',
      value: history.length > 0 ? getMostCommonMood() : '—',
      icon: Brain,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      label: 'Avg Intensity',
      value: history.length > 0 ? getAvgIntensity() : '—',
      icon: Activity,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Happy Rate',
      value: totalCounts > 0 ? `${Math.round((counts.happy / totalCounts) * 100)}%` : '—',
      icon: Sparkles,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
  ];

  const getAverageScore = (): number => {
    if (history.length === 0) return 0;
    const total = history.reduce((sum, m) => sum + (MOOD_SCORE[m.moodType] || 3), 0);
    return Number((total / history.length).toFixed(1));
  };

  const getMentalStage = () => {
    const avg = getAverageScore();
    if (history.length === 0) {
      return {
        stage: 'Stage 0 — Baseline Evaluation',
        name: 'Awaiting Mood Logs',
        score: '—',
        description: 'Log your mood on the Dashboard to calculate your current mental health stage and average score.',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        progressBar: 'w-0 bg-slate-300',
        color: 'slate',
      };
    }
    if (avg >= 4.0) {
      return {
        stage: 'Stage 4 — Thriving & Flourishing 🌟',
        name: 'High Emotional Positivity & Mental Resilience',
        score: `${avg} / 5.0`,
        description: 'Your mood trajectory reflects high positivity, emotional stability, and strong coping mechanisms.',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        progressBar: 'w-full bg-emerald-500',
        color: 'emerald',
      };
    } else if (avg >= 3.0) {
      return {
        stage: 'Stage 3 — Stable & Balanced ⚖️',
        name: 'Equilibrium & Healthy Self-Awareness',
        score: `${avg} / 5.0`,
        description: 'Your emotional state is steady. Regular mindfulness and journaling sustain your current balance.',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        progressBar: 'w-3/4 bg-indigo-500',
        color: 'indigo',
      };
    } else if (avg >= 2.0) {
      return {
        stage: 'Stage 2 — Processing & Healing 🌿',
        name: 'Active Self-Reflection & Recovery',
        score: `${avg} / 5.0`,
        description: 'You are working through feelings of tiredness or tension. Daily 4-4-4 Box Breathing will help restore energy.',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        progressBar: 'w-1/2 bg-amber-500',
        color: 'amber',
      };
    } else {
      return {
        stage: 'Stage 1 — Vulnerable & Needs Support 🫂',
        name: 'High Stress or Exhaustion',
        score: `${avg} / 5.0`,
        description: 'You are experiencing elevated emotional strain. We encourage chatting with our AI therapist companion.',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        progressBar: 'w-1/4 bg-rose-500',
        color: 'rose',
      };
    }
  };

  const stage = getMentalStage();

  return (
    <div className="space-y-8 animate-fade-in" id="analytics-tab">

      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-indigo-900 via-violet-900 to-slate-900 text-white rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-5 flex items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-indigo-600/50 border border-indigo-400/30 text-white text-[10px] font-sans font-bold uppercase tracking-wider rounded-full">
              Emotional Intelligence Engine
            </span>
            <h1 className="font-sans font-extrabold text-2xl mt-3 tracking-tight">Analytics & Insights 📊</h1>
            <p className="text-slate-300 text-xs mt-1 leading-relaxed">
              User stage analysis, average score evaluation, visual trend charts, and AI-powered weekly wellness reports.
            </p>
          </div>
          <button
            onClick={fetchHistory}
            title="Refresh data"
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* User Mental Health Stage & Average Score Card */}
      <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4" id="user-mental-stage-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Personalized Stage Analysis
            </span>
            <h2 className="font-sans font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-600" />
              {stage.stage}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Average Score</span>
              <span className="font-sans font-black text-xl text-violet-700">{stage.score}</span>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold border ${stage.badgeClass}`}>
              {stage.name}
            </span>
          </div>
        </div>

        <p className="text-xs font-sans text-slate-600 leading-relaxed">
          {stage.description}
        </p>

        {/* Stage Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Stage 1 (Vulnerable)</span>
            <span>Stage 2 (Healing)</span>
            <span>Stage 3 (Stable)</span>
            <span>Stage 4 (Thriving)</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${stage.progressBar} transition-all duration-700`} />
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats-cards-row">
        {statsCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`p-4 bg-white rounded-2xl border ${s.border} shadow-xs flex items-center gap-3`} id={`stat-card-${i}`}>
              <div className={`p-2.5 ${s.bg} rounded-xl shrink-0`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">{s.label}</span>
                <span className={`block font-sans font-black text-lg mt-0.5 ${s.color}`}>{s.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* No data CTA */}
      {!isLoading && history.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-8 bg-amber-50 border border-amber-100 rounded-3xl flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left"
          id="no-data-cta"
        >
          <div className="text-5xl">📊</div>
          <div className="flex-1">
            <h3 className="font-sans font-bold text-slate-800 text-base">No Mood Logs Yet</h3>
            <p className="text-xs font-sans text-slate-500 mt-1">Log your first mood from the Dashboard to see your trend charts and emotion breakdown here.</p>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-5 py-2.5 bg-amber-500 text-white font-sans font-bold text-xs rounded-xl hover:bg-amber-600 transition cursor-pointer flex items-center gap-2 shrink-0"
              id="go-log-mood-btn"
            >
              Log a Mood <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-12 gap-6" id="graphs-grid">

        {/* Mood Trend Line (8 cols) */}
        <div className="lg:col-span-8 p-6 bg-white rounded-3xl border border-slate-100 shadow-xs" id="trend-line-component">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-sans font-bold text-slate-800 text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                Mood Trend Timeline
              </h2>
              <p className="text-xs font-sans text-slate-400 mt-0.5">Last {Math.min(history.length, 7)} recorded mood states</p>
            </div>
            <span className="text-xs font-sans font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              {history.length} total logs
            </span>
          </div>

          {isLoading ? (
            <div className="h-[220px] flex items-center justify-center">
              <span className="w-7 h-7 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin"></span>
            </div>
          ) : last7Moods.length === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-slate-300 gap-2">
              <BarChart3 className="w-12 h-12 opacity-30" />
              <p className="text-xs font-sans text-center">No mood logs yet.<br />Start tracking to see your trend line appear here.</p>
            </div>
          ) : last7Moods.length === 1 ? (
            <div className="h-[220px] flex flex-col items-center justify-center gap-3">
              <div className="text-5xl">{MOOD_EMOJIS[last7Moods[0].moodType]}</div>
              <p className="text-sm font-sans font-bold text-slate-700 capitalize">{last7Moods[0].moodType}</p>
              <p className="text-xs text-slate-400">Logged: {last7Moods[0].date}</p>
              <p className="text-[10px] text-slate-300">Log 2+ moods to see a trend line</p>
            </div>
          ) : (
            <div className="relative" id="trend-canvas-container">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[9px] font-mono text-slate-300 py-1" style={{ width: 28 }}>
                {['😄', '😊', '😐', '😔', '😡'].map((e, i) => (
                  <span key={i}>{e}</span>
                ))}
              </div>

              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto overflow-visible ml-7">
                {/* Grid lines */}
                {[1, 2, 3, 4, 5].map(val => {
                  const y = chartH - chartP - ((val - 1) * (chartH - chartP * 2)) / 4;
                  return (
                    <line key={val} x1={chartP} y1={y} x2={chartW - chartP} y2={y}
                      stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4,4" />
                  );
                })}

                {/* Gradient fill under line */}
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
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

                {/* Trend line */}
                <polyline
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={getChartCoords()}
                />

                {/* Interactive dots with emoji */}
                {last7Moods.map((m, i) => {
                  const x = chartP + (i * (chartW - chartP * 2)) / (last7Moods.length - 1);
                  const score = MOOD_SCORE[m.moodType] || 3;
                  const y = chartH - chartP - ((score - 1) * (chartH - chartP * 2)) / 4;
                  const isHovered = hoveredPoint === i;

                  return (
                    <g key={m.id || i} onMouseEnter={() => setHoveredPoint(i)} onMouseLeave={() => setHoveredPoint(null)} className="cursor-pointer">
                      <circle cx={x} cy={y} r={isHovered ? 10 : 6}
                        fill={MOOD_COLORS[m.moodType]} stroke="#fff" strokeWidth="2.5"
                        className="transition-all duration-150" />
                      {isHovered && (
                        <text x={x} y={y - 14} textAnchor="middle" fontSize="14">{MOOD_EMOJIS[m.moodType]}</text>
                      )}
                    </g>
                  );
                })}

                {/* X-axis date labels */}
                {last7Moods.map((m, i) => {
                  const x = chartP + (i * (chartW - chartP * 2)) / (last7Moods.length - 1);
                  return (
                    <text key={i} x={x} y={chartH - 4} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                      {(m.date || '').slice(5)}
                    </text>
                  );
                })}
              </svg>

              {/* Tooltip */}
              {hoveredPoint !== null && last7Moods[hoveredPoint] && (
                <div
                  className="absolute bg-slate-900 text-white p-3 rounded-xl text-xs font-sans space-y-1 z-10 shadow-lg pointer-events-none"
                  style={{
                    left: `${Math.min(85, (hoveredPoint / Math.max(1, last7Moods.length - 1)) * 80 + 10)}%`,
                    bottom: '60%',
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
          )}
        </div>

        {/* Emotion Distribution (4 cols) */}
        <div className="lg:col-span-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col" id="distribution-pie-component">
          <div className="mb-4">
            <h2 className="font-sans font-bold text-slate-800 text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-600" />
              Emotional Shares
            </h2>
            <p className="text-xs font-sans text-slate-400 mt-0.5">Distribution of your logged emotions</p>
          </div>

          <div className="flex-1 space-y-3" id="share-progress-lines">
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

          <div className="mt-4 p-3 bg-slate-50 rounded-2xl text-[11px] font-sans text-slate-500 text-center border border-slate-100">
            Total: <strong>{totalCounts}</strong> emotional evaluations tracked
          </div>
        </div>
      </div>

      {/* AI Weekly Report Section */}
      <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs" id="weekly-report-container">

        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-sans font-bold text-slate-800 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              Empathetic AI Weekly Wellness Report
            </h2>
            <p className="text-xs font-sans text-slate-400 mt-0.5">AI-powered insights, recommendations, and clinical lifestyle summaries</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadExcel}
              id="download-analytics-excel-btn"
              className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-sans font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Excel
            </button>
            <button
              onClick={handleGenerateReport}
              disabled={generatingReport}
              id="generate-weekly-report-btn"
              className="px-5 py-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:opacity-95 disabled:opacity-60 text-white rounded-xl text-xs font-sans font-bold tracking-wider uppercase transition shadow-sm cursor-pointer flex items-center gap-2"
            >
              {generatingReport ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Synthesizing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate AI Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Report Error */}
        <AnimatePresence>
          {reportError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-sans text-rose-700"
            >
              {reportError}
            </motion.div>
          )}
        </AnimatePresence>

        {report ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-100 space-y-6"
            id="report-body"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 block uppercase tracking-wider mb-2">📋 State Analysis</span>
                  <p className="text-sm font-sans text-slate-600 leading-relaxed">{report.summary}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 block uppercase tracking-wider mb-2">📈 Mood Trends Observed</span>
                  <p className="text-sm font-sans text-slate-600 leading-relaxed">{report.trends}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 block uppercase tracking-wider mb-2">🎯 Professional Strategies</span>
                  <ul className="text-xs font-sans text-slate-600 space-y-2">
                    {report.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2" id={`rec-${i}`}>
                        <span className="text-violet-500 font-bold mt-0.5">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-violet-50 border border-violet-100 rounded-2xl">
                  <span className="text-[10px] font-mono font-bold text-violet-600 block uppercase tracking-wider mb-1.5">💜 Positive Reinforcement</span>
                  <p className="text-sm font-sans text-violet-800 leading-relaxed">{report.reinforcement}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="p-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl" id="report-empty">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="font-sans font-bold text-slate-700 text-sm">No Report Generated Yet</h3>
            <p className="mt-2 text-xs font-sans text-slate-400 max-w-sm mx-auto">
              {history.length === 0
                ? 'Log at least one mood first, then click "Generate AI Report" for personalized insights.'
                : 'Click "Generate AI Report" to get your personalized weekly wellness analysis powered by Google Gemini.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
