/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Trophy, Calendar, CheckCircle, HelpCircle, Activity, Heart, ArrowUpRight } from 'lucide-react';
import { WellnessScore } from '../types';

interface WellnessScoreViewProps {
  token: string;
  onNavigate: (tab: 'dashboard' | 'chat' | 'journal' | 'analytics' | 'profile' | 'meditation' | 'community' | 'notifications' | 'wellness') => void;
}

export default function WellnessScoreView({ token, onNavigate }: WellnessScoreViewProps) {
  const [data, setData] = useState<WellnessScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWellnessScore();
  }, []);

  const fetchWellnessScore = async () => {
    try {
      const res = await fetch('/api/wellness/score', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getDialColor = (score: number) => {
    if (score >= 90) return 'text-teal-500 bg-teal-500/10 border-teal-500/20';
    if (score >= 75) return 'text-violet-500 bg-violet-500/10 border-violet-500/20';
    if (score >= 50) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="space-y-8 animate-fade-in" id="wellness-tab">
      
      {/* Intro Hero with ambient gradient */}
      <div className="p-8 bg-gradient-to-br from-indigo-900 via-[#1e1b4b] to-[#0f172a] text-white rounded-3xl relative overflow-hidden" id="wellness-intro">
        <div className="absolute top-0 right-0 w-72 h-72 bg-violet-600/25 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 right-20 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <span className="px-3 py-1 bg-violet-600/50 border border-violet-400/30 text-white text-[10px] font-sans font-bold uppercase tracking-wider rounded-full">
              Neuro-Calm Indexing Engine
            </span>
            <h1 className="font-sans font-extrabold text-2xl md:text-3xl tracking-tight">
              Dynamic Wellness Core 🧠
            </h1>
            <p className="text-slate-305 text-xs leading-relaxed">
              Our clinical scoring model measures your active mental checkin patterns, streak perseverance, emotion balances, and journal details to calculate a real-time index out of 100. Build your routines to nurture structural serenity.
            </p>
          </div>

          <button
            onClick={fetchWellnessScore}
            id="refresh-wellness-btn"
            className="px-5 py-2.5 bg-white text-indigo-900 hover:bg-slate-50 transition rounded-xl text-xs font-sans font-bold cursor-pointer shrink-0 shadow-xs"
          >
            Re-calculate Score
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center text-slate-350">
          <span className="w-8 h-8 border-3 border-violet-500/20 border-t-violet-600 rounded-full animate-spin"></span>
          <span className="text-xs font-sans mt-3">Re-indexing emotional tracking vectors...</span>
        </div>
      ) : !data ? (
        <div className="bg-white border border-slate-100 p-12 rounded-3xl text-center text-slate-400">
          Failed to calibrate wellness metrics. Verify network status.
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-8" id="wellness-dashboard">
          
          {/* Main big dial center (5 cols) */}
          <div className="lg:col-span-5" id="wellness-radial-col">
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col items-center justify-center text-center space-y-6">
              <div>
                <h2 className="font-sans font-extrabold text-[#111827] text-md">Your Serenity Index</h2>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold block mt-1">Real-time status</span>
              </div>

              {/* Big Circular Dial Visual */}
              <div className="relative w-44 h-44 flex items-center justify-center" id="score-gauge-ring">
                {/* SVG path backing */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r="74"
                    stroke="#f1f5f9"
                    strokeWidth="11"
                    fill="transparent"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="74"
                    stroke="#8b5cf6"
                    strokeDasharray={464}
                    strokeDashoffset={464 - (464 * data.score) / 100}
                    strokeWidth="12"
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                
                {/* Score central text */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-[11px] font-mono font-bold uppercase text-slate-405 tracking-wider">Serene Core</span>
                  <span className="font-sans font-extrabold text-4xl text-slate-900 mt-0.5 leading-none">
                    {data.score}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold mt-1">/ 100 pts</span>
                </div>
              </div>

              {/* Calibration tier name badge */}
              <div className={`px-4 py-1.5 rounded-full text-xs font-sans font-bold border capitalize ${getDialColor(data.score)}`}>
                🌟 {data.evaluationName}
              </div>

              {/* Supportive Evaluation Paragraph */}
              <p className="font-sans text-xs text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100/95 max-w-sm">
                &ldquo;{data.summary}&rdquo;
              </p>
            </div>
          </div>

          {/* Right side: detailed metric breakdown & actionable tips (7 cols) */}
          <div className="lg:col-span-7 space-y-6" id="wellness-details-col">
            
            {/* Breakdown progress sliders */}
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-5" id="wellness-breakdown">
              <div>
                <h3 className="font-sans font-bold text-slate-800 text-sm">Calibration Breakdown</h3>
                <p className="text-[10px] font-sans text-slate-400">See what parameters contribute back to your total serenity score</p>
              </div>

              <div className="space-y-4">
                {/* 1. Streak Tracker */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-sans text-slate-600 font-semibold flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" /> Consecutive Streaks
                    </span>
                    <span className="font-mono text-slate-400 font-bold">{data.breakdown.streakScore}/40 pts</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                      style={{ width: `${(data.breakdown.streakScore / 40) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* 2. Logging habits */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-sans text-slate-600 font-semibold flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-violet-500" /> Mood Log Density
                    </span>
                    <span className="font-mono text-slate-400 font-bold">{data.breakdown.loggingScore}/30 pts</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full"
                      style={{ width: `${(data.breakdown.loggingScore / 30) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* 3. Positivity Indicator */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-sans text-slate-600 font-semibold flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-500" /> Positivity & Balance
                    </span>
                    <span className="font-mono text-slate-400 font-bold">{data.breakdown.positivityScore}/20 pts</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full"
                      style={{ width: `${(data.breakdown.positivityScore / 20) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* 4. Journal Details */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-sans text-slate-600 font-semibold flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-teal-500" /> Reflective Journaling Index
                    </span>
                    <span className="font-mono text-slate-400 font-bold">{data.breakdown.journalScore}/10 pts</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full"
                      style={{ width: `${(data.breakdown.journalScore / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* CURATED TIPS TO UPGRADE THE SCORE */}
            <div className="p-6 bg-violet-50/20 border border-violet-100 rounded-3xl space-y-4" id="score-elevate-tips">
              <div className="flex items-center gap-2 text-violet-700">
                <Sparkles className="w-4.5 h-4.5 animate-pulse text-violet-600" />
                <h3 className="font-sans font-bold text-slate-800 text-sm">Actionable Serenity Builders</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="tips-grid">
                
                <button
                  onClick={() => onNavigate('meditation')}
                  className="p-4 bg-white hover:bg-violet-50 border border-slate-100/50 rounded-2xl text-left transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-teal-600">Meditation Task</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                  </div>
                  <h4 className="font-sans font-bold text-slate-800 text-xs mt-2">Mindful Breathing Loop</h4>
                  <p className="text-[11px] font-sans text-slate-400 mt-1">Completing 1 min breathing adds points to unlock your streak score bonus.</p>
                </button>

                <button
                  onClick={() => onNavigate('journal')}
                  className="p-4 bg-white hover:bg-violet-50 border border-slate-100/50 rounded-2xl text-left transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-600">Reflection Task</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                  </div>
                  <h4 className="font-sans font-bold text-slate-800 text-xs mt-2">Write a Journal Reflection</h4>
                  <p className="text-[11px] font-sans text-slate-400 mt-1">Deep, sincere self-analysis logs upgrade your reflective journaling multiplier safely!</p>
                </button>

              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
