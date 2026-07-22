/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Clock, Play, Square, Sparkles, Volume2 } from 'lucide-react';

export default function Meditation({ token }: { token: string }) {
  const [isActive, setIsActive] = useState(false);
  const [exercise, setExercise] = useState<'box' | 'calm' | 'deep'>('calm');
  const [selectedDuration, setSelectedDuration] = useState(120); // default 2 mins
  const [secondsLeft, setSecondsLeft] = useState(120); // 2 Minutes
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);

  // Configuration for different breathing cycles (Inhale, Hold, Exhale, Hold2) in seconds
  const cycles = {
    calm: { inhale: 4, hold: 4, exhale: 4, label: 'Balanced 4-4-4 Calming' },
    deep: { inhale: 4, hold: 7, exhale: 8, label: 'Therapeutic 4-7-8 Deep Sleep' },
    box: { inhale: 4, hold: 4, exhale: 4, label: 'Equal 4-4 Box Breathing' },
  };

  useEffect(() => {
    let timer: any = null;
    if (isActive && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);

            // Log completion to persistent database milestone tracker!
            fetch('/api/meditation/complete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ seconds: selectedDuration }),
            }).catch((err) => console.error('Failed logging wellness points', err));

            alert(`Wonderful job! You have fully completed this ${formatMinSec(selectedDuration)} mental compression recovery milestone.`);
            return selectedDuration;
          }
          return prev - 1;
        });

        // Handle breathing phase transitions
        setPhaseSecondsLeft((prevPhase) => {
          if (prevPhase <= 1) {
            // Transition phase
            if (breathPhase === 'Inhale') {
              setBreathPhase('Hold');
              return cycles[exercise].hold;
            } else if (breathPhase === 'Hold') {
              setBreathPhase('Exhale');
              return cycles[exercise].exhale;
            } else {
              setBreathPhase('Inhale');
              return cycles[exercise].inhale;
            }
          }
          return prevPhase - 1;
        });
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isActive, secondsLeft, breathPhase, exercise]);

  const handleStart = () => {
    setIsActive(true);
    setBreathPhase('Inhale');
    setPhaseSecondsLeft(cycles[exercise].inhale);
  };

  const handleStop = () => {
    setIsActive(false);
    setSecondsLeft(selectedDuration);
    setBreathPhase('Inhale');
    setPhaseSecondsLeft(cycles[exercise].inhale);
  };

  const formatMinSec = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8" id="meditation-tab">
      
      {/* Visual Animation Circle Panel (7 cols) */}
      <div className="lg:col-span-7 p-8 bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col items-center justify-center min-h-[450px]" id="breathing-stage-panel">
        
        {/* Dynamic visual scaling bubble depending on current breath phase */}
        <div className="relative w-72 h-72 flex items-center justify-center" id="breathing-animation-canvas">
          
          <AnimatePresence mode="popLayout">
            <motion.div
              key={breathPhase + isActive}
              animate={{
                scale: !isActive ? 1 : breathPhase === 'Inhale' ? 1.5 : breathPhase === 'Hold' ? 1.5 : 1,
                opacity: !isActive ? 0.7 : breathPhase === 'Hold' ? 1 : 0.85,
              }}
              transition={{
                duration: !isActive ? 1 : breathPhase === 'Inhale' ? cycles[exercise].inhale : breathPhase === 'Exhale' ? cycles[exercise].exhale : 0.4,
                ease: 'easeInOut',
              }}
              className={`absolute w-44 h-44 rounded-full filter blur-md -z-1 transition duration-1000 ${
                breathPhase === 'Inhale' ? 'bg-indigo-300' :
                breathPhase === 'Hold' ? 'bg-amber-300' : 'bg-teal-300'
              }`}
            />
          </AnimatePresence>

          <div className="w-40 h-40 rounded-full bg-slate-900 border-4 border-white/90 text-white flex flex-col items-center justify-center shadow-lg relative z-5 text-center">
            {isActive ? (
              <>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#a5b4fc] uppercase">
                  {breathPhase}
                </span>
                <span className="text-3xl font-sans font-black mt-1">{phaseSecondsLeft}s</span>
              </>
            ) : (
              <>
                <Heart className="w-8 h-8 text-rose-400 animate-pulse" />
                <span className="text-xs font-sans font-bold text-slate-300 mt-2">Ready to Breathe</span>
              </>
            )}
          </div>
        </div>

        {/* Start / Stop timers */}
        <div className="mt-8 flex gap-4 items-center" id="breathing-trigger-group">
          {isActive ? (
            <button
              onClick={handleStop}
              id="stop-meditation-btn"
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-sans font-extrabold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-md transition"
            >
              <Square className="w-4 h-4 fill-white" /> Stop Session
            </button>
          ) : (
            <button
              onClick={handleStart}
              id="start-meditation-btn"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-sans font-extrabold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-100 transition"
            >
              <Play className="w-4 h-4 fill-white" /> Start Guided Loop
            </button>
          )}

          <div className="text-xs font-sans font-bold text-slate-500 bg-slate-100 px-3.5 py-2.5 rounded-xl flex items-center gap-1.5" id="breathing-counter">
            <Clock className="w-4 h-4 text-violet-600" />
            Remaining: {formatMinSec(secondsLeft)}
          </div>
        </div>

      </div>

      {/* Routine settings on Right (5 cols) */}
      <div className="lg:col-span-5 space-y-6" id="breathing-routine-panel">
        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-6">
          <div>
            <h2 className="font-sans font-bold text-slate-800 text-lg">Guided Breathing Cycles</h2>
            <p className="text-xs font-sans text-slate-400">Select therapeutic loop structures matching anxiety level</p>
          </div>

          <div className="space-y-3" id="cycle-selectors">
            <button
              onClick={() => {
                setExercise('calm');
                setSecondsLeft(selectedDuration);
              }}
              disabled={isActive}
              id="sel-cycle-calm"
              className={`p-4 rounded-2xl border text-left w-full transition duration-150 ${
                exercise === 'calm'
                  ? 'border-violet-600 bg-violet-50/50'
                  : 'border-slate-100 hover:bg-slate-50 disabled:opacity-40'
              }`}
            >
              <h3 className="font-sans font-bold text-slate-800 text-sm">Balanced 4-4-4 Calming</h3>
              <p className="text-[11px] font-sans text-slate-400 mt-1">Excellent for general decompression, relieving physical tension, and aligning focus.</p>
            </button>

            <button
              onClick={() => {
                setExercise('deep');
                setSecondsLeft(selectedDuration);
              }}
              disabled={isActive}
              id="sel-cycle-deep"
              className={`p-4 rounded-2xl border text-left w-full transition duration-150 ${
                exercise === 'deep'
                  ? 'border-violet-600 bg-violet-50/50'
                  : 'border-slate-100 hover:bg-slate-50 disabled:opacity-40'
              }`}
            >
              <h3 className="font-sans font-bold text-slate-800 text-sm">Therapeutic 4-7-8 Sleep</h3>
              <p className="text-[11px] font-sans text-slate-400 mt-1">Clinical breathing standard to silence anxiety triggers and pre-relax circadian cycles.</p>
            </button>

            <button
              onClick={() => {
                setExercise('box');
                setSecondsLeft(selectedDuration);
              }}
              disabled={isActive}
              id="sel-cycle-box"
              className={`p-4 rounded-2xl border text-left w-full transition duration-150 ${
                exercise === 'box'
                  ? 'border-violet-600 bg-violet-50/50'
                  : 'border-slate-100 hover:bg-slate-50 disabled:opacity-40'
              }`}
            >
              <h3 className="font-sans font-bold text-slate-800 text-sm">Equal 4-4 Box Breathing</h3>
              <p className="text-[11px] font-sans text-slate-400 mt-1">Tactical focus structure utilized by athletes to clear brain fog instantly.</p>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100" id="duration-selection-section">
            <h3 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Duration Selection</h3>
            <div className="flex flex-wrap gap-2" id="duration-selectors">
              {[60, 120, 180, 300, 600].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => {
                    setSelectedDuration(dur);
                    setSecondsLeft(dur);
                  }}
                  disabled={isActive}
                  id={`sel-duration-${dur}`}
                  className={`px-3 py-2 text-xs rounded-xl border font-sans font-extrabold transition cursor-pointer ${
                    selectedDuration === dur
                      ? 'border-violet-600 bg-violet-50 text-violet-700'
                      : 'border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-500'
                  }`}
                >
                  {dur >= 60 ? `${dur / 60} Min` : `${dur} Sec`}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-150 flex items-center gap-2.5 text-xs font-sans text-slate-500">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <span>Close your eyes and breathe in harmony with the color cloud's movement.</span>
          </div>
        </div>
      </div>

    </div>
  );
}
