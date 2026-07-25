/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Clock, Play, Square, Wind, Sparkles } from 'lucide-react';

export default function Meditation({ token }: { token: string }) {
  const [isActive, setIsActive] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(120);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Single breathing pattern: 4-4-4 Box Breathing (clinical standard)
  const INHALE = 4, HOLD = 4, EXHALE = 4;

  useEffect(() => {
    let timer: any = null;
    if (isActive && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setIsActive(false);
            fetch('/api/meditation/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ seconds: selectedDuration }),
            }).catch(() => {});
            return selectedDuration;
          }
          return prev - 1;
        });

        setPhaseSecondsLeft(prevPhase => {
          if (prevPhase <= 1) {
            if (breathPhase === 'Inhale') {
              setBreathPhase('Hold');
              return HOLD;
            } else if (breathPhase === 'Hold') {
              setBreathPhase('Exhale');
              return EXHALE;
            } else {
              setBreathPhase('Inhale');
              setCompletedCycles(c => c + 1);
              return INHALE;
            }
          }
          return prevPhase - 1;
        });
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isActive, secondsLeft, breathPhase]);

  const handleStart = () => {
    setIsActive(true);
    setBreathPhase('Inhale');
    setPhaseSecondsLeft(INHALE);
    setCompletedCycles(0);
  };

  const handleStop = () => {
    setIsActive(false);
    setSecondsLeft(selectedDuration);
    setBreathPhase('Inhale');
    setPhaseSecondsLeft(INHALE);
    setCompletedCycles(0);
  };

  const formatMinSec = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const phaseColors = {
    Inhale: 'from-indigo-500 to-violet-600',
    Hold: 'from-amber-400 to-orange-500',
    Exhale: 'from-teal-400 to-emerald-500',
  };

  const phaseInstructions = {
    Inhale: 'Breathe in slowly through your nose...',
    Hold: 'Hold still, let your body absorb the oxygen...',
    Exhale: 'Release slowly through your mouth...',
  };

  const progress = ((selectedDuration - secondsLeft) / selectedDuration) * 100;

  return (
    <div className="space-y-8 animate-fade-in" id="meditation-tab">

      {/* Header */}
      <div className="p-8 bg-gradient-to-br from-indigo-900 via-violet-900 to-slate-900 text-white rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-5">
          <span className="px-3 py-1 bg-indigo-600/50 border border-indigo-400/30 text-white text-[10px] font-sans font-bold uppercase tracking-wider rounded-full">
            Neuro-Calm Recovery
          </span>
          <h1 className="font-sans font-extrabold text-2xl md:text-3xl mt-3 tracking-tight">
            Guided Breathing 🌬️
          </h1>
          <p className="text-slate-300 text-xs mt-2 max-w-lg leading-relaxed">
            Clinical 4-4-4 box breathing — inhale 4s, hold 4s, exhale 4s. Used by therapists and athletes worldwide to instantly reduce anxiety and restore focus.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">

        {/* Left: Animation (8 cols) */}
        <div className="lg:col-span-8 p-8 bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col items-center justify-center min-h-[420px]" id="breathing-stage-panel">

          {/* Big breathing circle */}
          <div className="relative w-64 h-64 flex items-center justify-center mb-8" id="breathing-animation-canvas">

            {/* Outer pulse ring */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  key={breathPhase}
                  animate={{
                    scale: breathPhase === 'Inhale' ? 1.5 : breathPhase === 'Hold' ? 1.5 : 1,
                    opacity: [0.4, 0.15],
                  }}
                  transition={{ duration: breathPhase === 'Inhale' ? INHALE : breathPhase === 'Exhale' ? EXHALE : 0.3, ease: 'easeInOut' }}
                  className={`absolute w-48 h-48 rounded-full bg-gradient-to-br ${phaseColors[breathPhase]} blur-xl opacity-30`}
                />
              )}
            </AnimatePresence>

            {/* Inner circle */}
            <motion.div
              animate={{
                scale: !isActive ? 1 : breathPhase === 'Inhale' ? 1.35 : breathPhase === 'Hold' ? 1.35 : 0.95,
              }}
              transition={{
                duration: !isActive ? 0.5 : breathPhase === 'Inhale' ? INHALE : breathPhase === 'Exhale' ? EXHALE : 0.3,
                ease: 'easeInOut',
              }}
              className={`w-44 h-44 rounded-full flex flex-col items-center justify-center shadow-2xl text-white relative z-5 ${
                isActive
                  ? `bg-gradient-to-br ${phaseColors[breathPhase]}`
                  : 'bg-gradient-to-br from-slate-700 to-slate-900'
              } transition-all`}
            >
              {isActive ? (
                <>
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase opacity-80">{breathPhase}</span>
                  <span className="text-4xl font-sans font-black mt-1">{phaseSecondsLeft}s</span>
                  <span className="text-[9px] font-mono opacity-60 mt-1">of {breathPhase === 'Inhale' ? INHALE : breathPhase === 'Hold' ? HOLD : EXHALE}s</span>
                </>
              ) : (
                <>
                  <Heart className="w-8 h-8 text-rose-400 animate-pulse" />
                  <span className="text-xs font-sans font-bold text-slate-300 mt-2 text-center">Ready to<br />Breathe</span>
                </>
              )}
            </motion.div>
          </div>

          {/* Phase instruction text */}
          <AnimatePresence mode="wait">
            {isActive && (
              <motion.p
                key={breathPhase}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-sm font-sans text-slate-500 text-center mb-6 italic"
              >
                {phaseInstructions[breathPhase]}
              </motion.p>
            )}
          </AnimatePresence>

          {!isActive && (
            <p className="text-xs font-sans text-slate-400 text-center mb-6">Close your eyes. Follow the circle. Let your thoughts settle.</p>
          )}

          {/* Progress bar */}
          {isActive && (
            <div className="w-full max-w-xs mb-6">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                <span>{formatMinSec(selectedDuration - secondsLeft)} elapsed</span>
                <span>{formatMinSec(secondsLeft)} left</span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3 items-center">
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
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-sans font-extrabold uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-100 transition"
              >
                <Play className="w-4 h-4 fill-white" /> Start Breathing
              </button>
            )}

            {isActive && (
              <div className="text-xs font-sans font-bold text-slate-500 bg-slate-50 px-3.5 py-2.5 rounded-xl flex items-center gap-1.5" id="breathing-counter">
                <Clock className="w-4 h-4 text-violet-600" />
                {formatMinSec(secondsLeft)} remaining
              </div>
            )}
          </div>
        </div>

        {/* Right: Settings (4 cols) */}
        <div className="lg:col-span-4 space-y-5" id="breathing-routine-panel">

          {/* Stats card */}
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl space-y-3"
            >
              <h3 className="font-sans font-bold text-slate-700 text-sm">Session Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
                  <span className="block font-sans font-black text-2xl text-violet-600">{completedCycles}</span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Cycles</span>
                </div>
                <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
                  <span className="block font-sans font-black text-2xl text-indigo-600">{formatMinSec(selectedDuration - secondsLeft)}</span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Elapsed</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Duration picker */}
          <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-5">
            <div>
              <h2 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-2">
                <Wind className="w-4 h-4 text-indigo-500" /> Session Duration
              </h2>
              <p className="text-xs font-sans text-slate-400 mt-0.5">Choose how long your breathing session lasts</p>
            </div>

            <div className="grid grid-cols-2 gap-2" id="duration-selectors">
              {[
                { dur: 60, label: '1 Min', desc: 'Quick reset' },
                { dur: 120, label: '2 Min', desc: 'Recommended' },
                { dur: 180, label: '3 Min', desc: 'Deep calm' },
                { dur: 300, label: '5 Min', desc: 'Full session' },
              ].map(({ dur, label, desc }) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => { setSelectedDuration(dur); setSecondsLeft(dur); }}
                  disabled={isActive}
                  id={`sel-duration-${dur}`}
                  className={`p-3 rounded-xl border text-left font-sans transition cursor-pointer disabled:opacity-40 ${
                    selectedDuration === dur
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-slate-100 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <span className="block font-extrabold text-sm">{label}</span>
                  <span className="block text-[10px] opacity-70 mt-0.5">{desc}</span>
                </button>
              ))}
            </div>

            {/* Pattern info */}
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <h4 className="font-sans font-bold text-indigo-800 text-xs mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> 4-4-4 Box Breathing Pattern
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[['4s', 'Inhale', 'indigo'], ['4s', 'Hold', 'amber'], ['4s', 'Exhale', 'teal']].map(([time, phase, color]) => (
                  <div key={phase} className={`p-2 bg-${color}-100 rounded-lg`}>
                    <span className={`block font-black font-sans text-base text-${color}-700`}>{time}</span>
                    <span className={`block text-[9px] font-mono text-${color}-600 uppercase`}>{phase}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-indigo-700 mt-2 leading-relaxed">
                Used by therapists & the US Navy SEALS to reduce anxiety. Repeat until session ends.
              </p>
            </div>
          </div>

          {/* Completion message */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-sans text-slate-500 flex items-start gap-2">
            <Heart className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <span>A completed session adds wellness points to your <strong>Wellness Core score</strong> and triggers a milestone notification.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
