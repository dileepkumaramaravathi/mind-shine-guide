/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Brain, BookOpen, BarChart3, Shield, MessageCircle, Heart, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLoginClick: () => void;
}

export default function LandingPage({ onGetStarted, onLoginClick }: LandingPageProps) {
  return (
    <div className="relative min-h-screen bg-linear-to-b from-[#f5f3ff] via-[#f0f4ff] to-[#ecf2fe] text-[#2c2445] overflow-x-hidden" id="landing-page">
      {/* Decorative ambient blobs */}
      <div className="absolute top-10 left-1/10 w-96 h-96 bg-[#dbeafe] rounded-full blur-3xl opacity-60 -z-5 animate-pulse-slow"></div>
      <div className="absolute bottom-20 right-1/10 w-96 h-96 bg-[#edd9ff] rounded-full blur-3xl opacity-60 -z-5 animate-float"></div>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between" id="landing-header">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-2xl shadow-md text-white">
            <Brain className="w-6 h-6" />
          </div>
          <span className="font-sans font-bold text-2xl tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Mind Mood AI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onLoginClick}
            id="login-header-btn"
            className="px-5 py-2.5 rounded-xl font-sans font-medium text-sm text-violet-600 hover:text-violet-700 transition"
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            id="register-header-btn"
            className="px-5 py-2.5 rounded-xl font-sans font-medium text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 transition shadow-lg shadow-violet-100"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center grid lg:grid-cols-12 gap-12 items-center" id="landing-hero">
        <div className="lg:col-span-7 text-left flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100/80 border border-violet-200/50 text-xs font-sans font-semibold text-violet-700 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-violet-600" />
            Your AI Mental Wellness Navigator
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-sans font-extrabold text-5xl md:text-6xl tracking-tight leading-tight text-slate-900"
          >
            Track Your Mind, <br />
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Understand Your Mood
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-sans text-lg text-slate-600 mt-6 leading-relaxed max-w-xl"
          >
            Mind Mood AI is a modern emotional companion that leverages secure artificial intelligence to evaluate thoughts, log daily reflections, suggest smart exercises, and visualizes trends for mental clarity and peace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 mt-10"
          >
            <button
              onClick={onGetStarted}
              id="cta-start-btn"
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-sans font-semibold text-md hover:shadow-xl hover:shadow-violet-200/50 transition flex items-center gap-2 group cursor-pointer"
            >
              Begin Your Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onLoginClick}
              id="cta-learn-btn"
              className="px-6 py-4 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 rounded-2xl font-sans text-md font-medium transition cursor-pointer"
            >
              Sign In to Your Space
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-8 mt-12 pt-8 border-t border-slate-200"
          >
            <div>
              <span className="block font-sans font-extrabold text-3xl text-slate-800">100%</span>
              <span className="text-xs font-sans text-slate-500 font-medium">Private & Secure</span>
            </div>
            <div>
              <span className="block font-sans font-extrabold text-3xl text-slate-800">24/7</span>
              <span className="text-xs font-sans text-slate-500 font-medium">Emotional AI Companion</span>
            </div>
          </motion.div>
        </div>

        {/* Feature Preview Card Grid */}
        <div className="lg:col-span-5 relative">
          <div className="relative w-full max-w-md mx-auto grid grid-cols-1 gap-4" id="feature-previews">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-5 bg-white/70 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-100 border border-white hover:-translate-y-1 transition duration-300"
            >
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-violet-100 text-violet-600 rounded-xl">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-800">Daily Mood Journal</h3>
                  <p className="font-sans text-sm text-slate-500 mt-1">Reflect on events and let AI highlight sentiments and mental states securely.</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-5 bg-white/70 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-100 border border-white hover:-translate-y-1 transition duration-300"
            >
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-800">Therapeutic AI Chat</h3>
                  <p className="font-sans text-sm text-slate-500 mt-1">Receive empathetic assistance, clinical-style coping suggestions and validation any time.</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-5 bg-white/70 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-100 border border-white hover:-translate-y-1 transition duration-300"
            >
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-fuchsia-100 text-fuchsia-600 rounded-xl">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-800">Weekly Analytics</h3>
                  <p className="font-sans text-sm text-slate-500 mt-1">Observe dynamic mood trend graphs and generate detailed wellness reports.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* App Values */}
      <div className="bg-white/50 border-y border-slate-200/60 py-16" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-sans font-bold text-3xl text-slate-900 tracking-tight">
              Designed with Clinical Empathy & Privacy
            </h2>
            <p className="font-sans text-slate-500 mt-3 text-md">
              Mind Mood AI builds an affirming, peaceful, and constructive relationship with your emotions without judgement.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-semibold text-lg text-slate-800 mb-2">Private Secure Vault</h3>
                <p className="font-sans text-slate-500 text-sm leading-relaxed">
                  Your raw entries, emotional notes, and logs are tied to user-encrypted identifiers. You possess maximum agency over your data.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-semibold text-lg text-slate-800 mb-2">Weekly Well-Being Report</h3>
                <p className="font-sans text-slate-500 text-sm leading-relaxed">
                  Analyze your logs with Gemini-based intelligence summaries to recognize personal habits and stress-free zones.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-blue-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-semibold text-lg text-slate-800 mb-2">Meditation & Breathing</h3>
                <p className="font-sans text-slate-500 text-sm leading-relaxed">
                  Decompresses from tension instantly using our interactive meditation breathing guides built directly within the portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 py-10 text-center text-xs font-sans text-slate-400">
        <p>© 2026 Mind Mood AI. Dedicated to mental clarity and supportive AI wellness helper systems.</p>
      </div>
    </div>
  );
}
