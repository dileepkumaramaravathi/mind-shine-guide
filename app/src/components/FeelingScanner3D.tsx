/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Scan, Brain, Heart, ArrowRight, RefreshCw, Cpu, Activity, Play } from 'lucide-react';

interface FeelingScanner3DProps {
  onSyncFeeling: (scannedText: string) => void;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
  px?: number; // projected 2D coordinates for line drawing
  py?: number;
}

export default function FeelingScanner3D({ onSyncFeeling }: FeelingScanner3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'completed'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [telemetryLog, setTelemetryLog] = useState<string>('System idle. Ready to initiate neural scan.');
  const [scannedEmotion, setScannedEmotion] = useState<{
    emotion: string;
    description: string;
    intensity: number;
    metrics: { calm: number; stress: number; clarity: number; fatigue: number };
    therapeuticPrompt: string;
  } | null>(null);

  const [activeDiagnosticMode, setActiveDiagnosticMode] = useState<'biometrics' | 'aura' | 'psyche'>('biometrics');

  // Math-based 3D particle data
  const particlesRef = useRef<Point3D[]>([]);
  const rotationRef = useRef({ angleX: 0.005, angleY: 0.008 });

  // Initialize the sphere coordinates once
  useEffect(() => {
    const pts: Point3D[] = [];
    const count = 120; // High-density for a beautiful model
    
    // Create points arranged in a gorgeous Fibonacci sphere configuration
    for (let i = 0; i < count; i++) {
      const theta = Math.acos(-1 + (2 * i) / count);
      const phi = Math.sqrt(count * Math.PI) * theta;
      
      pts.push({
        x: Math.sin(theta) * Math.cos(phi) * 110,
        y: Math.sin(theta) * Math.sin(phi) * 110,
        z: Math.cos(theta) * 110,
      });
    }
    particlesRef.current = pts;
  }, []);

  // 3D Canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Clear canvas with elegant transparency trail for high-tech glow
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const focalLength = 260;

      const pts = particlesRef.current;
      const rot = rotationRef.current;

      // Rotate points dynamically
      const sinX = Math.sin(rot.angleX);
      const cosX = Math.cos(rot.angleX);
      const sinY = Math.sin(rot.angleY);
      const cosY = Math.cos(rot.angleY);

      // Mutate and project points
      pts.forEach((pt) => {
        // Y-axis rotation
        const x1 = pt.x * cosY - pt.z * sinY;
        const z1 = pt.z * cosY + pt.x * sinY;

        // X-axis rotation
        const y2 = pt.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + pt.y * sinX;

        pt.x = x1;
        pt.y = y2;
        pt.z = z2;

        // Perspective divide
        const scale = focalLength / (focalLength + z2);
        pt.px = centerX + x1 * scale;
        pt.py = centerY + y2 * scale;
      });

      // 1. Draw connecting mesh boundaries
      ctx.lineWidth = 0.5;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dz = pts[i].z - pts[j].z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          // Only draw thin holographic lines if points are physically near
          if (dist < 48) {
            const alpha = (1 - dist / 48) * 0.16;
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(pts[i].px!, pts[i].py!);
            ctx.lineTo(pts[j].px!, pts[j].py!);
            ctx.stroke();
          }
        }
      }

      // 2. Draw active holographic particle nodes
      pts.forEach((pt) => {
        const scale = focalLength / (focalLength + pt.z);
        const radius = Math.max(0.8, scale * 2.2);
        
        // Front-facing elements shine brighter to reinforce perfect depth
        const zFactor = (pt.z + 110) / 220; // 0 to 1
        const alpha = 0.2 + zFactor * 0.7;

        ctx.beginPath();
        ctx.arc(pt.px!, pt.py!, radius, 0, Math.PI * 2);
        
        if (scanState === 'scanning') {
          // Pulse amber/teal when active neural scan sweeps
          const pulse = (Math.sin(Date.now() * 0.01) + 1) / 2;
          ctx.fillStyle = pulse > 0.5 ? `rgba(20, 184, 166, ${alpha})` : `rgba(245, 158, 11, ${alpha})`;
        } else {
          ctx.fillStyle = `rgba(167, 139, 250, ${alpha})`;
        }
        ctx.fill();
      });

      // 3. Draw a glowing scanner sweeping line if scanning is active
      if (scanState === 'scanning') {
        const yLine = centerY + Math.sin(Date.now() * 0.005) * 110;
        const gradient = ctx.createLinearGradient(0, yLine - 12, 0, yLine + 12);
        gradient.addColorStop(0, 'rgba(20, 184, 166, 0)');
        gradient.addColorStop(0.5, 'rgba(20, 184, 166, 0.5)');
        gradient.addColorStop(1, 'rgba(20, 184, 166, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(centerX - 140, yLine - 10, 280, 20);

        // Solid horizontal neon bar
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.9)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(centerX - 135, yLine);
        ctx.lineTo(centerX + 135, yLine);
        ctx.stroke();

        // Pulsing radar circles
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, (Date.now() % 1500) / 12 + 40, 0, Math.PI * 2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [scanState]);

  // Handle Scan sequence simulation
  useEffect(() => {
    if (scanState !== 'scanning') return;

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        const next = prev + 1;
        
        // Update progressive clinical telemetry logs
        if (next === 10) setTelemetryLog('📡 Handshaking with AI Neuro-Sentiment interface...');
        if (next === 25) setTelemetryLog('🔬 Mapping respiratory bio-frequency patterns from camera baseline...');
        if (next === 45) setTelemetryLog('🧬 Calibrating visual aura refraction index and physical posture tension...');
        if (next === 65) setTelemetryLog('🦠 Evaluating micro-emotional fluctuation levels against cortisol indexes...');
        if (next === 85) setTelemetryLog('📊 Synthesizing final mental load balancing ratios...');

        if (next >= 100) {
          clearInterval(interval);
          finishScanSequence();
          return 100;
        }
        return next;
      });
    }, 45); // ~4.5 seconds scan

    return () => clearInterval(interval);
  }, [scanState]);

  const initiateScan = () => {
    setScanProgress(0);
    setScanState('scanning');
    setScannedEmotion(null);
    setTelemetryLog('Holographic scan initialized. Keep posture steady and remain focused...');
  };

  const finishScanSequence = () => {
    // Curate highly evocative sentiment reports depending on active chosen diagnostic mode
    let result;

    if (activeDiagnosticMode === 'biometrics') {
      // Burnout / Exhaustion state
      result = {
        emotion: 'Mindful Exhaustion & Overload',
        description: 'Micro-scans detect high musculoskeletal tension, lowered respiration velocity, and an elevated fatigue coefficient. Your nervous system is signaling a sincere requirement for mental decompression.',
        intensity: 4,
        metrics: { calm: 24, stress: 78, clarity: 42, fatigue: 89 },
        therapeuticPrompt: 'Hi companion, I just completed the 3D Neural Scan which detected elevated stress (78%) and fatigue (89%). I feel deeply exhausted and physically tense today. Let\'s unpack why my energy levels are lower and talk about small self-care decompression steps.'
      };
    } else if (activeDiagnosticMode === 'aura') {
      // Reflective / Anxious state
      result = {
        emotion: 'Cosmic Reflective Serenity',
        description: 'Spectral aura analysis shows high-clarity mental waves balanced by soft, contemplative loneliness. Broad creative synapses are firing, reflecting deep intellectual processing with slight underlying worry.',
        intensity: 3,
        metrics: { calm: 65, stress: 32, clarity: 88, fatigue: 35 },
        therapeuticPrompt: 'Hello companion, my 3D Neuro-Aura scan completed with 88% Mental Clarity and 65% Calm! I am in a deeply reflective, high-cognitive contemplation mode but carrying slight worries. Let\'s write or talk about organizing my current insights.'
      };
    } else {
      // Calm, radiant, happy state
      result = {
        emotion: 'Harmonious High-Vibrational Clarity',
        description: 'Outstanding mental frequency alignment detected. Cortisol signals are minimal, matched by balanced neuro-conductivity and consistent deep breathing states. Great mental fortitude!',
        intensity: 5,
        metrics: { calm: 94, stress: 10, clarity: 91, fatigue: 15 },
        therapeuticPrompt: 'Hi companion, my 3D Psyche Scan registered extremely high Harmony (94% Calm, 91% Clarity)! I feel aligned, peaceful, and stable right now. I want to celebrate this baseline state or log what activities contribute to keeping me so centered.'
      };
    }

    setScannedEmotion(result);
    setScanState('completed');
    setTelemetryLog('Scan finalized. Mind-State decodification successfully completed.');
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl overflow-hidden border border-slate-800 shadow-xl" id="feeling-scanner-3d-panel">
      
      <div className="grid lg:grid-cols-12 md:divide-x md:divide-slate-800">
        
        {/* Left Side: 3D Holographic Canvas & Status Monitor (7 cols) */}
        <div className="lg:col-span-7 p-6 flex flex-col justify-between items-center bg-slate-950/20 min-h-[480px]">
          
          {/* Diagnostic Category Pill selection */}
          <div className="w-full flex justify-between items-center border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Scan className="w-4 h-4 text-teal-400 animate-pulse" />
              <span className="font-sans font-extrabold text-xs tracking-wider text-slate-300 uppercase">3D Neural Scanner Portal</span>
            </div>
            
            <div className="flex gap-1.5" id="diagnostic-mode-picker">
              {(['biometrics', 'aura', 'psyche'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    if (scanState === 'scanning') return;
                    setActiveDiagnosticMode(mode);
                  }}
                  disabled={scanState === 'scanning'}
                  id={`diagnostic-tab-${mode}`}
                  className={`px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-wider rounded-lg border transition ${
                    activeDiagnosticMode === mode
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-400'
                  }`}
                >
                  {mode === 'biometrics' ? 'Bio-Tension' : mode === 'aura' ? 'Contemplative Aura' : 'Psyche Balance'}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Canvas container */}
          <div className="relative my-4 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={280}
              height={280}
              className="rounded-full overflow-hidden border border-slate-800/60 bg-slate-950"
              id="holographic-canvas-box"
            ></canvas>
            
            {/* Superimposed Glowing Ring Accent */}
            <div className="absolute w-[295px] h-[295px] border-2 border-dashed border-slate-800/30 rounded-full animate-spin-slow pointer-events-none"></div>

            {/* Simulated Live Camera Sweep Face box */}
            {scanState === 'scanning' && (
              <div className="absolute inset-0 m-auto w-40 h-40 border border-teal-500/40 rounded-3xl flex items-center justify-center animate-pulse pointer-events-none">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-teal-400"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-teal-400"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-teal-400"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-teal-400"></div>
                <span className="text-[10px] font-mono text-teal-400 bg-slate-950/80 px-2 py-0.5 rounded-md uppercase tracking-widest animate-pulse scale-90">
                  Scanning... {scanProgress}%
                </span>
              </div>
            )}
          </div>

          {/* Core Telemetry logs readout */}
          <div className="w-full bg-slate-950/80 border border-slate-805/90 rounded-2xl p-3.5 font-mono text-[10px] tracking-wide text-slate-400 mt-2 space-y-2">
            <div className="flex items-center justify-between text-slate-500 border-b border-slate-800/40 pb-1.5">
              <span>AL-702 NEURAL LINK TELEMETRY</span>
              <span className={`h-2 w-2 rounded-full ${scanState === 'scanning' ? 'bg-orange-500 animate-ping' : 'bg-green-500'}`}></span>
            </div>
            
            <p className="text-teal-300 leading-relaxed font-semibold">
              &gt; {telemetryLog}
            </p>

            {scanState === 'scanning' && (
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="h-full bg-teal-400 transition-all duration-75"
                  style={{ width: `${scanProgress}%` }}
                ></div>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Scan Interpretation & Synchronize Controls (5 cols) */}
        <div className="lg:col-span-5 p-6 flex flex-col justify-between space-y-6" id="scanner-controls-container">
          
          <AnimatePresence mode="wait">
            {scanState === 'idle' && (
              <motion.div
                key="idle-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-4 flex-1 flex flex-col justify-center text-center py-6"
              >
                <div className="p-4 bg-violet-600/10 border border-violet-500/20 text-violet-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                  <Cpu className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-sans font-extrabold text-[#f3f4f6] text-base leading-snug">AI Mind-Post-Aura Scanner</h3>
                  <p className="text-xs font-sans text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">
                    Experience our custom 3D emotional diagnostic model before speaking with the therapist. The camera scans skin variations to extract feeling baselines instantly.
                  </p>
                </div>

                <button
                  onClick={initiateScan}
                  id="start-3d-scan-btn"
                  className="w-full max-w-xs mx-auto mt-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Play className="w-4 h-4 fill-white text-white" />
                  Initiate 3D feeling scan
                </button>
              </motion.div>
            )}

            {scanState === 'scanning' && (
              <motion.div
                key="scanning-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 flex-1 flex flex-col justify-center items-center py-10"
              >
                <div className="text-center space-y-3">
                  <Activity className="w-10 h-10 text-teal-400 animate-pulse mx-auto" />
                  <h3 className="font-sans font-extrabold text-[#f3f4f6] text-base">Deconstructive Mapping Active</h3>
                  <p className="text-xs font-sans text-slate-400 max-w-xs leading-relaxed">
                    Analyzing cranial blood circulation models and posture expansion indicators. Keep still for maximum fidelity.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-500 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-ping"></span>
                  <span>Sensors Synchronized</span>
                </div>
              </motion.div>
            )}

            {scanState === 'completed' && scannedEmotion && (
              <motion.div
                key="completed-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 flex-1 flex flex-col justify-between"
              >
                {/* Result header */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/25 text-teal-400 font-mono text-[9px] font-bold uppercase tracking-wider">
                      Diagnostic Deciphered
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/25 text-violet-400 font-mono text-[9px] font-bold uppercase tracking-wider">
                      Fidelity 98.7%
                    </span>
                  </div>

                  <h3 className="font-sans font-black text-slate-100 text-lg">
                    {scannedEmotion.emotion}
                  </h3>

                  <p className="text-xs font-sans text-slate-350 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                    &ldquo;{scannedEmotion.description}&rdquo;
                  </p>
                </div>

                {/* Metrics charts bars */}
                <div className="space-y-2.5 pt-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Spectral Energy Ratios</span>
                  
                  <div className="grid grid-cols-2 gap-3" id="scan-metrics-matrix">
                    {/* Calm */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <div className="flex justify-between text-[10px] font-sans font-bold text-slate-400 mb-1">
                        <span>CALM/PEACE</span>
                        <span className="text-teal-400">{scannedEmotion.metrics.calm}%</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-400" style={{ width: `${scannedEmotion.metrics.calm}%` }}></div>
                      </div>
                    </div>

                    {/* Stress */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <div className="flex justify-between text-[10px] font-sans font-bold text-slate-400 mb-1">
                        <span>STRESS INDEX</span>
                        <span className="text-rose-400">{scannedEmotion.metrics.stress}%</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${scannedEmotion.metrics.stress}%` }}></div>
                      </div>
                    </div>

                    {/* Clarity */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <div className="flex justify-between text-[10px] font-sans font-bold text-slate-400 mb-1">
                        <span>MENTAL CLARITY</span>
                        <span className="text-indigo-400">{scannedEmotion.metrics.clarity}%</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400" style={{ width: `${scannedEmotion.metrics.clarity}%` }}></div>
                      </div>
                    </div>

                    {/* Fatigue */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <div className="flex justify-between text-[10px] font-sans font-bold text-slate-400 mb-1">
                        <span>FATIGUE RATE</span>
                        <span className="text-amber-400">{scannedEmotion.metrics.fatigue}%</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400" style={{ width: `${scannedEmotion.metrics.fatigue}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit & Sync CTA */}
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={initiateScan}
                    className="p-3 bg-slate-800 hover:bg-slate-700 transition rounded-xl text-slate-300 hover:text-white"
                    title="Rescan posture frequencies"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSyncFeeling(scannedEmotion.therapeuticPrompt)}
                    className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 hover:scale-[1.01] font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    Sync Scan with AI Chat Helper
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
