/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Brain, Send, BookOpen, Trash2, Heart, Sparkles, Scan } from 'lucide-react';
import { ChatMessage } from '../types';
import FeelingScanner3D from './FeelingScanner3D';

interface AIChatProps {
  token: string;
}

export default function AIChat({ token }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null);
  const [copingTips, setCopingTips] = useState<string[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showScanner, setShowScanner] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch message logs on entrance
  useEffect(() => {
    fetchHistory();
  }, []);

  // Sync scroll automatically
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/ai/chat-history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.history || []);
      }
    } catch (err) {
      console.error('Failed to retrieve chat history', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputVal;
    if (!textToSend.trim() || isSending) return;

    if (!customText) {
      setInputVal(''); // Clean input field
    }

    // Append local user message as optimist feedback
    const temporaryUserMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, temporaryUserMsg]);
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ feeling: textToSend }),
      });

      if (!res.ok) {
        throw new Error('Empathetic server returned a connection issue');
      }

      const data = await res.json();
      // Replace or insert AI response
      setMessages((prev) => [...prev, data.message]);
      if (data.analysis) {
        setDetectedEmotion(data.analysis.emotion);
        setCopingTips(data.analysis.copingTips || []);
      }
    } catch (err) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'ai',
        text: 'I am here for you. Recording how we feel is an brave step towards understanding ourselves. Take a deep breath: draw it in slowly, hold for four seconds, and let it go. Would you like to write about this in your daily journal?',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm('Would you like to clear all current mental health chat memories securely?')) return;
    try {
      const res = await fetch('/api/ai/chat-history', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessages([]);
        setDetectedEmotion(null);
        setCopingTips([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Predefined interactive emotional check-ins to make logging immediate
  const checkins = [
    { label: 'Feeling overwhelmed with tasks', emoji: '🤯' },
    { label: 'Had a highly productive day', emoji: '✨' },
    { label: 'Experiencing social anxiety', emoji: '🥺' },
    { label: 'Just need minor motivation', emoji: '🌱' },
  ];

  return (
    <div className="grid lg:grid-cols-12 gap-8 h-[calc(100vh-12rem)] align-stretch" id="chat-tab">
      
      {/* Scrollable Conversation viewport (7 cols) */}
      <div className="lg:col-span-8 flex flex-col bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs relative" id="chat-viewport-panel">
        
        {/* Chat Tab Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shadow-2xs" id="chat-inner-header">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 text-violet-700 rounded-xl animate-pulse">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5">
                Mind Mood AI Support Assistant
              </h2>
              <span className="text-[10px] font-sans text-teal-600 font-bold block uppercase tracking-wider">● Online & Private</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScanner(!showScanner)}
              id="toggle-scanner-btn"
              className={`px-3 py-1.5 rounded-xl font-sans text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                showScanner 
                  ? 'bg-amber-100/85 text-amber-850 hover:bg-amber-200 border border-amber-200' 
                  : 'bg-violet-100/85 text-violet-850 hover:bg-violet-200 border border-violet-200'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
              {showScanner ? 'Support Chat 💬' : 'Launch 3D Scanner 📡'}
            </button>

            {messages.length > 0 && (
              <button
                onClick={clearLogs}
                id="clear-logs-btn"
                title="Clear secure memories"
                className="p-2 text-slate-400 hover:text-rose-600 transition hover:bg-rose-50 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>

        {/* Message Log Canvas */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/10"
          id="conversation-container"
        >
          {showScanner ? (
            <div className="pb-4 animate-fade-in" id="scanner-wrapper-box">
              <FeelingScanner3D
                onSyncFeeling={(scannedText) => {
                  setShowScanner(false);
                  handleSendMessage(undefined, scannedText);
                }}
              />
            </div>
          ) : isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
              <span className="w-6 h-6 border-2 border-violet-600/30 border-t-violet-600 rounded-full animate-spin"></span>
              <span className="text-xs font-sans">Connecting chat security locks...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-4" id="chat-placeholder">
              <div className="p-4 bg-violet-100 rounded-full text-violet-600 text-4xl animate-float">
                😌
              </div>
              <div>
                <h3 className="font-sans font-bold text-slate-800">Your Safe Wellness Companion</h3>
                <p className="font-sans text-xs text-slate-400 mt-1 pb-4 leading-relaxed">
                  Discuss stressors, daily accomplishments, or track feelings anonymously. All logs are securely isolated.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {checkins.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(undefined, item.label)}
                      id={`chat-shortcut-${index}`}
                      className="px-4 py-3 bg-slate-50 hover:bg-violet-50/50 border border-slate-100 font-sans text-xs font-semibold text-slate-600 hover:text-violet-700 rounded-xl transition text-left cursor-pointer"
                    >
                      {item.emoji} {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  id={`msg-wrap-${m.id}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl font-sans text-sm leading-relaxed ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-br-none'
                        : 'bg-slate-100 text-slate-800 rounded-bl-none'
                    }`}
                    id={`msg-body-${m.id}`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-violet-600 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Helper
                      </div>
                    )}
                    <span className="whitespace-pre-line">{m.text}</span>
                    <span className="block text-[8px] opacity-40 text-right mt-2 font-sans font-medium">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {isSending && (
            <div className="flex justify-start" id="ai-typing-indicator">
              <div className="max-w-[85%] p-4 bg-slate-100 text-slate-500 rounded-2xl rounded-bl-none font-sans text-sm flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-2.5 h-2.5 bg-violet-600/60 rounded-full animate-bounce"></span>
                  <span className="w-2.5 h-2.5 bg-violet-600/60 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2.5 h-2.5 bg-violet-600/60 rounded-full animate-bounce delay-200"></span>
                </span>
                <span className="text-xs">Wellness guide is synthesizing supportive insights...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input box form */}
        <form 
          onSubmit={(e) => handleSendMessage(e)}
          className="p-4 border-t border-slate-100 flex items-center gap-3 bg-slate-50"
          id="chat-input-form"
        >
          <input
            type="text"
            placeholder="Type how you are feeling right now..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isSending}
            id="chat-text-input"
            className="flex-1 px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-sm font-sans focus:outline-hidden focus:border-violet-500 transition"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isSending}
            id="chat-sent-btn"
            className="p-3 bg-slate-900 text-white rounded-2xl transition hover:bg-slate-800 disabled:opacity-45 shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Dynamic Sentiment Analyzer summary sidebar (4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-6" id="chat-sidebar-panel">
        <div className="p-6 bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] text-white rounded-3xl relative overflow-hidden" id="analytics-short-card">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/20 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center gap-2 text-violet-300 font-sans font-semibold text-xs tracking-wider uppercase">
              <Sparkles className="w-4 h-4 text-violet-300" />
              Dynamic NLP Analyzer
            </div>

            <h3 className="font-sans font-extrabold text-lg text-white mt-4">Immediate Sentiment</h3>
            
            {detectedEmotion ? (
              <div className="mt-4 space-y-4">
                <div className="flex gap-3 items-center">
                  <div className="px-3.5 py-1.5 rounded-full text-xs font-sans font-bold uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {detectedEmotion}
                  </div>
                  <span className="text-xs text-slate-400">immediately classified</span>
                </div>

                {copingTips.length > 0 && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                    <span className="text-[10px] font-mono text-violet-400 font-bold block uppercase tracking-wider">Coping Exercises Recommended</span>
                    <ul className="text-xs font-sans text-slate-300 space-y-1.5 pl-4 list-disc">
                      {copingTips.map((tip, index) => (
                        <li key={index} id={`tip-${index}`}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 text-slate-400 text-xs py-4 leading-relaxed">
                Send a feeling reflection message to trigger NLP classification and display psychological exercises tailored based on your state.
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-100 rounded-3xl" id="safe-disclaimer">
          <div className="flex gap-3 items-start">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-[#1f2937] text-sm">Empathetic Boundary</h3>
              <p className="font-sans text-xs text-slate-400 mt-1 leading-relaxed">
                Mind Mood AI acts as a lifestyle-nurturing AI validation assistant. It does not replace medical professional assessment. If in critical distress, please connect with personal support systems or local emergency mental health helplines immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
