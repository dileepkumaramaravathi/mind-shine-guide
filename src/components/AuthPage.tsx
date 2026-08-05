/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Mail, Lock, User, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle2, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (token: string, user: any) => void;
  onBackToLanding: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthPage({ onAuthSuccess, onBackToLanding, initialMode = 'login' }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [gmailNotification, setGmailNotification] = useState<{
    show: boolean;
    otp: string;
  }>({ show: false, otp: '' });

  const showGmailNotification = (code: string) => {
    setGmailNotification({ show: true, otp: code });
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(580, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}

    setTimeout(() => {
      setGmailNotification((prev) => ({ ...prev, show: false }));
    }, 9000);
  };

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI Toggles & Timers
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // 60s Resend Cooldown Timer
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Intercept Supabase Auth recovery magic link redirect
  useEffect(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    if (hash.includes('type=recovery') || hash.includes('access_token') || search.includes('reset')) {
      setMode('forgot');
      setResetStep(2);
      setOtp('SUPABASE_RECOVERY_BYPASS');
      
      const searchParams = new URLSearchParams(hash.replace('#', '?') || search);
      const emailParam = searchParams.get('email');
      if (emailParam) {
        setEmail(emailParam);
      }
      setSuccessMessage('Email recovery link verified. Please enter your new password below.');
    }
  }, []);

  const startResendTimer = () => {
    setResendCooldown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Password Complexity Rule Checks
  const isMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const isPasswordMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordComplex = isMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const getAnimatedState = () => {
    if (isLoading) return 'thinking';
    if (error) return 'upset';
    if (password.length > 0 || newPassword.length > 0) return 'closed-eyes';
    if (email.length > 0 || name.length > 0) return 'interested';
    return 'neutral';
  };

  const handleSendOtp = async () => {
    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code.');
      }
      setResetStep(2);
      setSuccessMessage('Verification code sent successfully. Check your email inbox.');
      startResendTimer();
      if (data.otp) {
        showGmailNotification(data.otp);
      }
    } catch (err: any) {
      setError(err.message || 'Email address is not registered.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification code.');
      }
      setSuccessMessage('A new verification code has been sent to your registered email address.');
      startResendTimer();
      if (data.otp) {
        showGmailNotification(data.otp);
      }
    } catch (err: any) {
      setError(err.message || 'Resend OTP request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit verification code received in your email.');
      return;
    }

    if (!isPasswordComplex) {
      setError('New password does not satisfy all complexity requirements.');
      return;
    }

    if (!isPasswordMatch) {
      setError('Passwords do not match. Please verify Confirm Password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword, confirmPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }

      setSuccessMessage('Password Reset Successful. Please Login With Your New Password.');
      setPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
      setMode('login');
      setResetStep(1);
    } catch (err: any) {
      setError(err.message || 'Verification code expired or invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'forgot') {
      if (resetStep === 1) {
        await handleSendOtp();
      } else {
        await handleResetPasswordSubmit(e);
      }
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

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
        throw new Error(data.error || 'Authentication failed');
      }

      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Network error, please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const moodState = getAnimatedState();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f0ff] via-[#edf2ff] to-[#ecf2fe] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden" id="auth-page">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-violet-200/50 rounded-full blur-3xl -z-5"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-200/50 rounded-full blur-3xl -z-5 animate-pulse-slow"></div>

      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl shadow-slate-100 p-6 sm:p-8 relative" id="auth-box">
        {/* Back button */}
        <button 
          type="button"
          onClick={() => {
            if (mode === 'forgot' && resetStep === 2) {
              setResetStep(1);
            } else if (mode === 'forgot' || mode === 'register') {
              setMode('login');
              setError(null);
              setSuccessMessage(null);
            } else {
              onBackToLanding();
            }
          }}
          id="auth-back-btn"
          className="absolute top-6 left-6 text-xs font-sans font-semibold text-slate-500 hover:text-slate-700 transition flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Dynamic Avatar Header */}
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
            {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Forgot Password'}
          </h2>
          <p className="font-sans text-xs text-slate-400 mt-1 text-center">
            {mode === 'login' 
              ? 'Sign in to access your mental wellness dashboard' 
              : mode === 'register' 
              ? 'Start tracking and nurturing your mental well-being'
              : resetStep === 1 
              ? 'Enter your registered email to receive a 6-digit OTP code' 
              : 'Enter the verification code and set your new password'}
          </p>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-xs font-sans font-semibold flex items-start gap-2" id="auth-success-msg">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
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
          {/* Register Name Field */}
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

          {/* Email Address Field */}
          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <div>
              <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  disabled={mode === 'forgot' && resetStep === 2}
                  placeholder="dileep@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  id="auth-email-input"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl font-sans text-slate-700 text-sm focus:outline-hidden focus:border-violet-500 focus:bg-white disabled:opacity-60 transition"
                />
              </div>
            </div>
          )}

          {/* Forgot Password Step 2: Verification Code (OTP) & New Password Fields */}
          {mode === 'forgot' && resetStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              {/* 6-Digit OTP Code Input */}
              <div>
                <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Verification Code (6 Digits)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  id="recovery-otp-input"
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl font-mono text-center text-lg font-bold tracking-widest text-indigo-700 focus:outline-hidden focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              {/* New Password Field */}
              <div>
                <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="MindMood@123"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    id="recovery-new-password-input"
                    className="w-full pl-11 pr-11 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl font-sans text-slate-700 text-sm focus:outline-hidden focus:border-violet-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    id="recovery-new-password-toggle"
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="MindMood@123"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    id="recovery-confirm-password-input"
                    className="w-full pl-11 pr-11 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl font-sans text-slate-700 text-sm focus:outline-hidden focus:border-violet-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    id="recovery-confirm-password-toggle"
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Live Checklist */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs font-sans">
                <p className="font-bold text-slate-600 mb-1">Password Requirements:</p>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <span className={isMinLength ? 'text-emerald-600 font-semibold flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                    {isMinLength ? '✓' : '•'} 8+ Characters
                  </span>
                  <span className={hasUppercase ? 'text-emerald-600 font-semibold flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                    {hasUppercase ? '✓' : '•'} 1 Uppercase (A-Z)
                  </span>
                  <span className={hasLowercase ? 'text-emerald-600 font-semibold flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                    {hasLowercase ? '✓' : '•'} 1 Lowercase (a-z)
                  </span>
                  <span className={hasNumber ? 'text-emerald-600 font-semibold flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                    {hasNumber ? '✓' : '•'} 1 Number (0-9)
                  </span>
                  <span className={hasSpecial ? 'text-emerald-600 font-semibold flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                    {hasSpecial ? '✓' : '•'} 1 Special Char (@,#,!)
                  </span>
                  <span className={isPasswordMatch ? 'text-emerald-600 font-semibold flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                    {isPasswordMatch ? '✓' : '•'} Passwords Match
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Standard Login Password Field */}
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
                    }}
                    id="auth-forgot-password"
                    className="text-xs font-sans text-violet-600 hover:underline font-semibold cursor-pointer"
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

          {/* Submit Action Button */}
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
                  ? 'Sign In' 
                  : mode === 'register' 
                  ? 'Create Account' 
                  : resetStep === 1 
                  ? 'Send Verification Code' 
                  : 'Verify OTP & Reset Password'}
              </>
            )}
          </button>

          {/* Resend OTP Button & Countdown Timer */}
          {mode === 'forgot' && resetStep === 2 && (
            <div className="pt-2 text-center space-y-2">
              <button
                type="button"
                disabled={resendCooldown > 0 || isLoading}
                onClick={handleResendOtp}
                id="auth-resend-otp-btn"
                className="text-xs font-sans font-semibold text-violet-600 hover:text-violet-800 disabled:text-slate-400 disabled:no-underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 
                  ? `Resend Verification Code available in ${resendCooldown}s` 
                  : 'Resend Verification Code'}
              </button>
            </div>
          )}
        </form>

        {/* Footer Navigation */}
        <div className="mt-6 text-center border-t border-slate-100 pt-6">
          <p className="font-sans text-sm text-slate-500">
            {mode === 'forgot' 
              ? 'Remembered your password?' 
              : mode === 'login' 
              ? "Don't have an account?" 
              : 'Already registered with us?'}
            {' '}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setSuccessMessage(null);
                setResetStep(1);
                if (mode === 'forgot' || mode === 'register') {
                  setMode('login');
                } else {
                  setMode('register');
                }
              }}
              id="auth-[#mode]-toggle-btn"
              className="font-bold text-violet-600 hover:underline cursor-pointer ml-1"
            >
              {mode === 'forgot' || mode === 'register' ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </div>
      </div>
      {/* Gmail Notification Simulator Card */}
      <AnimatePresence>
        {gmailNotification.show && (
          <motion.div
            initial={{ opacity: 0, x: 100, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="fixed top-6 right-6 w-96 bg-white/95 border border-slate-200/80 rounded-2xl shadow-2xl p-4 flex gap-4 pointer-events-auto z-[99999]"
            id="gmail-notification-simulation"
          >
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0 border border-red-100 shadow-sm animate-pulse">
              <Mail className="w-6 h-6 text-red-500 fill-red-100" />
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-sans font-extrabold text-slate-400 tracking-wider uppercase">
                  GMAIL • NOW
                </span>
                <button 
                  onClick={() => setGmailNotification(prev => ({ ...prev, show: false }))}
                  className="text-slate-400 hover:text-slate-650 transition p-0.5 rounded-lg cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 rotate-90" />
                </button>
              </div>
              <h4 className="text-xs font-sans font-black text-slate-800 truncate">
                Mind Mood AI Support
              </h4>
              <p className="text-[11px] font-sans text-slate-500 leading-normal">
                Your password verification OTP code is:
                <span className="block mt-1 font-sans font-black text-sm text-indigo-600 tracking-wider bg-indigo-50 border border-indigo-100 py-1.5 px-3 rounded-lg w-max select-all cursor-pointer">
                  {gmailNotification.otp}
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
