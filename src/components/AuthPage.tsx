/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Brain, Mail, Lock, User, Eye, EyeOff, Sparkles, AlertCircle, CheckSquare } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (token: string, user: any) => void;
  onBackToLanding: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthPage({ onAuthSuccess, onBackToLanding, initialMode = 'login' }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick interactive "input reflection tracker":
  // We change the animated graphic depending on which fields have text
  const getAnimatedState = () => {
    if (isLoading) return 'thinking';
    if (error) return 'upset';
    if (password.length > 0 || newPassword.length > 0) return 'closed-eyes';
    if (email.length > 0 || name.length > 0) return 'interested';
    return 'neutral';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (mode === 'forgot') {
      try {
        if (resetStep === 1) {
          const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Request failed.');
          }
          setSimulatedCode(data.code);
          setResetStep(2);
        } else {
          const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code: verificationCode, newPassword }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Password reset failed.');
          }
          setSuccessMessage('Your password has been reset successfully! Please sign in with your new credentials below.');
          setMode('login');
          setResetStep(1);
          setSimulatedCode(null);
          setPassword(newPassword); // pre-populate new password for a perfect UX on login
          setVerificationCode('');
          setNewPassword('');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred during verification.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login' 
      ? { email, password } 
      : { name, email, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Successful Auth
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Network error, please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const moodState = getAnimatedState();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f0ff] via-[#edf2ff] to-[#ecf2fe] flex items-center justify-center p-6 relative overflow-hidden" id="auth-page">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-violet-200/50 rounded-full blur-3xl -z-5"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-200/50 rounded-full blur-3xl -z-5 animate-pulse-slow"></div>

      <div className="w-full max-w-md bg-white/85 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl shadow-slate-100 p-8 relative" id="auth-box">
        {/* Back navigation */}
        <button 
          onClick={onBackToLanding}
          id="auth-back-btn"
          className="absolute top-6 left-6 text-xs font-sans font-semibold text-slate-400 hover:text-slate-600 transition flex items-center gap-1 cursor-pointer"
        >
          ← Back
        </button>

        {/* Dynamic Interactive Avatar Reacting to On-Screen Actions */}
        <div className="flex flex-col items-center mt-4 mb-6" id="auth-avatar">
          <motion.div 
            animate={{ 
              scale: moodState === 'thinking' ? [1, 1.05, 1] : 1,
              y: moodState === 'interested' ? -3 : 0 
            }}
            transition={{ repeat: moodState === 'thinking' ? Infinity : 0, duration: 1.5 }}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white transition-all duration-300 shadow-md ${
              moodState === 'upset' ? 'bg-rose-500' :
              moodState === 'closed-eyes' ? 'bg-[#9c66ff]' :
              moodState === 'thinking' ? 'bg-indigo-600 animate-pulse' :
              moodState === 'interested' ? 'bg-violet-600' : 'bg-slate-700'
            }`}
          >
            {moodState === 'neutral' && <span className="text-2xl font-sans font-bold">😐</span>}
            {moodState === 'interested' && <span className="text-2xl font-sans font-bold">😄</span>}
            {moodState === 'closed-eyes' && <span className="text-2xl font-sans font-bold">🙈</span>}
            {moodState === 'thinking' && <span className="text-2xl font-sans font-bold">😌</span>}
            {moodState === 'upset' && <span className="text-2xl font-sans font-bold">🥺</span>}
          </motion.div>
          
          <h2 className="font-sans font-bold text-2xl text-slate-800 tracking-tight mt-4">
            {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Recover Password'}
          </h2>
          <p className="font-sans text-xs text-slate-400 mt-1 text-center">
            {mode === 'login' 
              ? 'Sign in to access your mental safety space' 
              : mode === 'register' 
              ? 'Start tracking and nurturing your mindset'
              : 'Enter your email address to establish a secure password update'}
          </p>
        </div>

        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-xs font-sans font-semibold flex items-start gap-2" id="auth-success-msg">
            <CheckSquare className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-sans flex items-center gap-2" id="auth-error">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" id="auth-form">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Dileep 👋"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  id="reg-name-input"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl font-sans text-slate-700 text-sm focus:outline-hidden focus:border-violet-500 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'register' || (mode === 'forgot' && resetStep === 1)) && (
            <div>
              <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="dileep@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  id="auth-email-input"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl font-sans text-slate-700 text-sm focus:outline-hidden focus:border-violet-500 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          {mode === 'forgot' && resetStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              {simulatedCode && (
                <div className="p-3.5 bg-violet-55/60 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs font-sans text-[#312e81] flex flex-col gap-1.5">
                  <span className="font-bold flex items-center gap-1.5 text-[#1e1b4b]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                    Sandbox Reset Code Delivered!
                  </span>
                  <span>We generated a secure verification validation token code for test purposes:</span>
                  <span className="mt-1 bg-white border border-slate-205/80 py-1.5 px-4 rounded-xl font-mono text-center text-sm font-black text-indigo-600 tracking-widest leading-none select-all block w-max self-center shadow-2xs">
                    {simulatedCode}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Verification Code (4 Digits)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1234"
                  maxLength={4}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  id="recovery-code-input"
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl font-sans text-slate-700 text-sm font-extrabold tracking-widest text-center focus:outline-hidden focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setNewPassword(e.target.value);
                    }}
                    id="recovery-password-input"
                    className="w-full pl-11 pr-11 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl font-sans text-slate-700 text-sm focus:outline-hidden focus:border-violet-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    id="recovery-password-toggle"
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setResetStep(1);
                      setError(null);
                      setSuccessMessage(null);
                      setSimulatedCode(null);
                    }}
                    id="auth-forgot-password"
                    className="text-xs font-sans text-violet-600 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  id="auth-password-input"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl font-sans text-slate-700 text-sm focus:outline-hidden focus:border-violet-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  id="auth-password-toggle"
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            id="auth-submit-btn"
            className="w-full py-4 text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 disabled:opacity-50 rounded-2xl font-sans font-bold text-sm tracking-wide shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/60 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {mode === 'login' 
                  ? 'Sign In Successfully' 
                  : mode === 'register' 
                  ? 'Generate Secure Account' 
                  : resetStep === 1 
                  ? 'Send Verification Code' 
                  : 'Verify & Reset Password'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-100 pt-6">
          <p className="font-sans text-sm text-slate-500">
            {mode === 'forgot' 
              ? 'Remembered your password?' 
              : mode === 'login' 
              ? "Don't have an emotional account?" 
              : 'Already registered with us?'}
            <button
              onClick={() => {
                setMode(mode === 'forgot' ? 'login' : mode === 'login' ? 'register' : 'login');
                setError(null);
                setSuccessMessage(null);
                setSimulatedCode(null);
                setResetStep(1);
              }}
              id="auth-switch-mode"
              className="ml-1.5 text-violet-600 font-bold hover:underline transition cursor-pointer"
            >
              {mode === 'forgot' 
                ? 'Sign In' 
                : mode === 'login' 
                ? 'Register Account' 
                : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
