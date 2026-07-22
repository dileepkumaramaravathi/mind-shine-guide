/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Sparkles, TrendingUp, Heart, Calendar, HelpCircle, Activity } from 'lucide-react';
import { Mood, MoodType } from '../types';

interface AnalyticsProps {
  token: string;
}

interface WeeklyReport {
  summary: string;
  trends: string;
  recommendations: string[];
  reinforcement: string;
}

export default function Analytics({ token }: AnalyticsProps) {
  const [history, setHistory] = useState<Mood[]>([]);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
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
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    setReport(null);
    try {
      const res = await fetch('/api/ai/weekly-report', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setReport(data.report);
      } else {
        alert(data.error || 'Please record at least one mood entry to generate an AI weekly summary report!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Convert Mood history into graph datasets
  // Last 7 recorded points
  const last7Moods = [...history].reverse().slice(-7);

  const moodScore: { [key in MoodType]: number } = {
    happy: 5,
    neutral: 3,
    sad: 2,
    angry: 1,
    tired: 1,
  };

  const moodEmojis: { [key in MoodType]: string } = {
    happy: '😄',
    neutral: '😐',
    sad: '😔',
    angry: '😡',
    tired: '😴',
  };

  // Count Distribution
  const counts: { [key in MoodType]: number } = {
    happy: 0,
    neutral: 0,
    sad: 0,
    angry: 0,
    tired: 0,
  };

  history.forEach((m) => {
    if (counts[m.moodType] !== undefined) {
      counts[m.moodType]++;
    }
  });

  const totalCounts = Object.values(counts).reduce((a, b) => a + b, 0);

  // SVG Chart Dimensions & Computations
  const width = 500;
  const height = 200;
  const padding = 30;

  const getCoordinates = () => {
    if (last7Moods.length < 2) return '';
    const points = last7Moods.map((m, index) => {
      const x = padding + (index * (width - padding * 2)) / (last7Moods.length - 1);
      const score = moodScore[m.moodType] || 3;
      const y = height - padding - ((score - 1) * (height - padding * 2)) / 4;
      return `${x},${y}`;
    });
    return points.join(' ');
  };

  return (
    <div className="space-y-8" id="analytics-tab">
      
      {/* Dynamic Graph and Distribution Grid */}
      <div className="grid lg:grid-cols-12 gap-8" id="graphs-grid">
        
        {/* Trend Line (8 columns) */}
        <div className="lg:col-span-8 p-6 bg-white rounded-3xl border border-slate-100 shadow-xs" id="trend-line-component">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-sans font-bold text-slate-800 text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                Mood Trend Timeline
              </h2>
              <p className="text-xs font-sans text-slate-400">Tracking values of your last 7 recorded states</p>
            </div>
            <span className="text-xs font-sans font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md">
              7 Entries Cycle
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            {last7Moods.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-slate-400 text-xs font-sans">
                You have not recorded any mood logs yet. Logs will plot here automatically.
              </div>
            ) : last7Moods.length < 2 ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-slate-400 text-xs font-sans">
                <span>Logged State: {last7Moods[0].moodType} ({last7Moods[0].date})</span>
                <span className="mt-2 text-[10px] text-slate-300">You need to log at least 2 entries to sketch a trend line.</span>
              </div>
            ) : (
              <div className="relative" id="trend-canvas-container">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                  {/* Grid Lines */}
                  {[1, 2, 3, 4, 5].map((val) => {
                    const y = height - padding - ((val - 1) * (height - padding * 2)) / 4;
                    return (
                      <line
                        key={val}
                        x1={padding}
                        y1={y}
                        x2={width - padding}
                        y2={y}
                        stroke="rgba(241, 245, 249, 1)"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {/* Gradient Area under line */}
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Line Connection */}
                  <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    points={getCoordinates()}
                  />

                  {/* Interactive Dot Points */}
                  {last7Moods.map((m, index) => {
                    const x = padding + (index * (width - padding * 2)) / (last7Moods.length - 1);
                    const score = moodScore[m.moodType] || 3;
                    const y = height - padding - ((score - 1) * (height - padding * 2)) / 4;
                    const isHovered = hoveredPoint === index;

                    return (
                      <g 
                        key={m.id}
                        onMouseEnter={() => setHoveredPoint(index)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered ? 8 : 5}
                          fill={isHovered ? '#4f46e5' : '#818cf8'}
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="transition-all duration-150"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Tooltip Overlay */}
                {hoveredPoint !== null && last7Moods[hoveredPoint] && (
                  <div 
                    className="absolute bg-slate-900 text-white p-3 rounded-xl text-xs font-sans space-y-1 z-10 shadow-lg pointer-events-none"
                    style={{
                      left: `${(hoveredPoint / (last7Moods.length - 1)) * 80 + 10}%`,
                      bottom: '70%',
                    }}
                  >
                    <div className="font-bold flex items-center gap-1.5 capitalize">
                      <span>{moodEmojis[last7Moods[hoveredPoint].moodType]}</span>
                      <span>{last7Moods[hoveredPoint].moodType}</span>
                    </div>
                    <div className="text-[10px] text-slate-300">Logged on: {last7Moods[hoveredPoint].date}</div>
                    {last7Moods[hoveredPoint].note && (
                      <div className="text-[9px] italic text-[#fbcfe8] max-w-[150px] truncate">&ldquo;{last7Moods[hoveredPoint].note}&rdquo;</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Axis Labels */}
          {last7Moods.length > 0 && (
            <div className="flex justify-between items-center text-[10px] font-sans font-bold text-slate-400 mt-4 px-2">
              <span>{last7Moods[0].date}</span>
              <span>Timeline Axis</span>
              <span>{last7Moods[last7Moods.length - 1].date}</span>
            </div>
          )}
        </div>

        {/* Emotion Distribution (4 columns) */}
        <div className="lg:col-span-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between" id="distribution-pie-component">
          <div>
            <h2 className="font-sans font-bold text-slate-800 text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-600" />
              Emotional Shares
            </h2>
            <p className="text-xs font-sans text-slate-400">Relative allocation of logged emotions</p>
          </div>

          <div className="my-6 space-y-3.5" id="share-progress-lines">
            {totalCounts === 0 ? (
              <div className="text-center text-xs font-sans text-slate-400 py-12">
                No history to visualize shares.
              </div>
            ) : (
              (Object.keys(counts) as MoodType[]).map((mtype) => {
                const num = counts[mtype];
                const pct = totalCounts > 0 ? Math.round((num / totalCounts) * 100) : 0;
                
                const labels: { [key in MoodType]: string } = {
                  happy: '😄 Happy',
                  neutral: '😐 Neutral',
                  sad: '😔 Sad',
                  angry: '😡 Angry',
                  tired: '😴 Tired',
                };

                const colors: { [key in MoodType]: string } = {
                  happy: 'bg-amber-400',
                  neutral: 'bg-slate-400',
                  sad: 'bg-indigo-500',
                  angry: 'bg-rose-500',
                  tired: 'bg-violet-500',
                };

                return (
                  <div key={mtype} className="space-y-1" id={`share-${mtype}`}>
                    <div className="flex justify-between text-xs font-sans">
                      <span className="font-medium text-slate-700 capitalize">{labels[mtype]}</span>
                      <span className="font-bold text-slate-500">{pct}% ({num})</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors[mtype]} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3.5 bg-slate-50/50 rounded-2xl text-[11px] font-sans text-slate-500 text-center border border-slate-100/80">
            Total of {totalCounts} emotional evaluations tracked.
          </div>
        </div>

      </div>

      {/* Gemini Premium Report compiler */}
      <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs" id="weekly-report-container">
        
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6" id="report-header">
          <div>
            <h2 className="font-sans font-bold text-slate-800 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              Empathetic AI Weekly Wellness Report
            </h2>
            <p className="text-xs font-sans text-slate-400">Comprehensive insights, reinforcement logs, and clinical lifestyle summaries</p>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={generatingReport || history.length === 0}
            id="generate-weekly-report-btn"
            className="px-5 py-2.5 bg-gradient-to-tr from-violet-600 to-indigo-650 hover:opacity-95 disabled:opacity-50 text-white rounded-xl text-xs font-sans font-bold tracking-wider uppercase transition shadow-sm cursor-pointer"
          >
            {generatingReport ? 'Synthesizing report...' : 'Generate AI Weekly Report'}
          </button>
        </div>

        {report ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-slate-50 rounded-2xl border border-slate-100/60 space-y-6"
            id="report-body"
          >
            <div className="grid md:grid-cols-2 gap-6" id="report-meta-grid">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 block uppercase tracking-wider mb-1">State Analysis</span>
                  <p className="text-sm font-sans text-slate-600 leading-relaxed">
                    {report.summary}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 block uppercase tracking-wider mb-1">Mood Trends Observed</span>
                  <p className="text-sm font-sans text-slate-600 leading-relaxed">
                    {report.trends}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 block uppercase tracking-wider mb-2">Professional Strategies</span>
                  <ul className="text-xs font-sans text-slate-600 space-y-1.5 list-disc pl-4">
                    {report.recommendations.map((rec, index) => (
                      <li key={index} id={`rec-${index}`}>{rec}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 block uppercase tracking-wider mb-1">Positive Reinforcement</span>
                  <p className="text-sm font-sans text-slate-600 leading-relaxed">
                    {report.reinforcement}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl" id="report-empty">
            <span className="text-3xl">📝</span>
            <p className="mt-3 text-xs font-sans text-slate-500">
              No report compiled. Click the compilation button to query Gemini's clinical model on your emotional progression.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
