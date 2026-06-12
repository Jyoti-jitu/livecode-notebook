'use client';

import React, { useState, useEffect } from 'react';
import { useLoveStudyStore } from '@/store/useLoveStudyStore';
import { Clock, Heart, Award, Flame, Play, Pause, RotateCcw, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoveStudyWidgets() {
  const store = useLoveStudyStore();
  const { timeLeft, isRunning, mode, cycleCompleted } = store.pomodoro;
  const [showReward, setShowReward] = useState(false);
  const [lastMode, setLastMode] = useState(mode);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Listen for mode changes to show a reward pop-up
  useEffect(() => {
    if (mode !== lastMode) {
      if (mode === 'shortBreak' || mode === 'longBreak') {
        setShowReward(true);
        setTimeout(() => setShowReward(false), 4000);
      }
      setLastMode(mode);
    }
  }, [mode, lastMode]);

  const handlePomodoroToggle = () => {
    if (isRunning) {
      store.pausePomodoro();
    } else {
      store.startPomodoro();
    }
  };

  // Convert study timer seconds to hh:mm:ss
  const formatStudyTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  // Study timer increment hook
  useEffect(() => {
    let interval: any;
    if (store.studyTimerActive) {
      interval = setInterval(() => {
        store.incrementStudyTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [store.studyTimerActive, store]);

  return (
    <div className="space-y-4">
      {/* 1. Pomodoro Timer Widget */}
      <div className="bg-white/50 dark:bg-love-dark/30 border border-rose-100/40 dark:border-rose-950/20 p-4 rounded-2xl shadow-sm relative overflow-hidden">
        {/* Animated Background Pulse on Work Mode */}
        {isRunning && mode === 'work' && (
          <div className="absolute inset-0 bg-rose-500/5 dark:bg-rose-400/5 animate-pulse pointer-events-none" />
        )}
        
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-rose-400 dark:text-rose-300/40 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-love-primary" />
            <span>Pomodoro Timer</span>
          </h3>
          <span className="text-[10px] font-bold text-rose-500/80 dark:text-rose-400 bg-love-light/40 dark:bg-rose-950/35 px-2 py-0.5 rounded-lg">
            Cycle #{cycleCompleted}
          </span>
        </div>

        {/* Mode Selector Tab buttons */}
        <div className="grid grid-cols-3 gap-1 bg-rose-50/50 dark:bg-love-dark-bg/40 p-1 rounded-xl mb-4">
          {(['work', 'shortBreak', 'longBreak'] as const).map((m) => (
            <button
              key={m}
              onClick={() => store.setPomodoroMode(m)}
              className={`text-[9px] font-bold uppercase tracking-wider py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === m
                  ? 'bg-gradient-to-r from-love-primary to-love-secondary text-white shadow-sm'
                  : 'text-rose-600/70 dark:text-rose-300/50 hover:bg-rose-100/30'
              }`}
            >
              {m === 'work' ? 'Work' : m === 'shortBreak' ? 'Short' : 'Long'}
            </button>
          ))}
        </div>

        {/* Counter Display & Controls */}
        <div className="flex flex-col items-center justify-center py-2 space-y-3 relative">
          <div className="text-4xl font-extrabold tracking-wider bg-gradient-to-r from-rose-700 via-love-primary to-love-secondary bg-clip-text text-transparent select-none font-mono">
            {formatTime(timeLeft)}
          </div>
          
          <div className="text-[10px] text-rose-500/70 dark:text-rose-400/55 font-medium">
            {mode === 'work' ? 'Time to focus together! 🧠' : 'Rest your eyes, hold hands ☕️'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePomodoroToggle}
              className={`p-2 rounded-xl text-white transition-all shadow-md active:scale-95 cursor-pointer ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-300/10'
                  : 'bg-gradient-to-r from-love-primary to-love-secondary hover:from-love-secondary hover:to-love-primary shadow-rose-300/20'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={store.resetPomodoro}
              className="p-2 bg-white dark:bg-love-dark border border-rose-100/40 dark:border-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-rose-400 hover:text-love-primary cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cute Reward Pop-up on break complete */}
        <AnimatePresence>
          {showReward && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="absolute inset-0 bg-white/95 dark:bg-love-dark/95 flex flex-col items-center justify-center text-center p-4 z-20"
            >
              <Award className="w-10 h-10 text-love-primary fill-current animate-bounce" />
              <h4 className="text-xs font-bold text-rose-700 dark:text-rose-100 mt-1">Goal Met! 💕</h4>
              <p className="text-[9px] text-rose-500 mt-0.5">
                Earned +5 Love Hearts! You study so well together!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Study Streak & Timer Widget */}
      <div className="bg-white/50 dark:bg-love-dark/30 border border-rose-100/40 dark:border-rose-950/20 p-4 rounded-2xl shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-rose-400 dark:text-rose-300/40 uppercase tracking-wider flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-love-primary" />
          <span>Study streak</span>
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-500/10 rounded-xl text-love-primary animate-pulse">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-800 dark:text-rose-100">
                {store.streak.days} Days Streak!
              </div>
              <div className="text-[10px] text-rose-500/70 dark:text-rose-400/55 font-semibold">
                Daily Study Target
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
              {store.streak.hearts} ❤️
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-2 w-full bg-rose-100/50 dark:bg-rose-950/25 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-love-primary to-love-secondary transition-all duration-500"
              style={{ width: `${store.streak.goalProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[8px] font-bold text-rose-400 uppercase tracking-wider">
            <span>Progress: {store.streak.goalProgress}%</span>
            <span>Target: 40 hearts</span>
          </div>
        </div>

        <div className="border-t border-rose-100/20 dark:border-rose-950/10 pt-2.5 flex items-center justify-between text-xs font-medium text-rose-700/80 dark:text-rose-300/60">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-rose-300 dark:text-rose-400/35" />
            Time studied:
          </span>
          <span className="font-mono font-bold text-love-primary">
            {formatStudyTime(store.studyTimeElapsed)}
          </span>
        </div>
      </div>

      {/* 3. Mood & Reactions System */}
      <div className="bg-white/50 dark:bg-love-dark/30 border border-rose-100/40 dark:border-rose-950/20 p-4 rounded-2xl shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-rose-400 dark:text-rose-300/40 uppercase tracking-wider flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-love-primary" />
          <span>Notebook Mood</span>
        </h3>

        {/* Mood selections */}
        <div className="grid grid-cols-2 gap-1.5">
          {([
            { mood: '😊 Focused', text: 'Focused' },
            { mood: '🥰 Happy', text: 'Happy' },
            { mood: '🔥 Productive', text: 'Productive' },
            { mood: '🧠 Studying', text: 'Study' }
          ] as const).map((item) => (
            <button
              key={item.mood}
              onClick={() => store.setMood(item.mood)}
              className={`py-2 px-2.5 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                store.currentMood === item.mood
                  ? 'bg-love-light/60 dark:bg-love-primary/20 text-love-primary border-love-primary/30 shadow-sm'
                  : 'bg-white/60 dark:bg-love-dark border-rose-100/40 dark:border-rose-950/20 text-rose-700/80 dark:text-rose-300/60 hover:bg-rose-50/50'
              }`}
            >
              <span>{item.mood.split(' ')[0]}</span>
              <span>{item.text}</span>
            </button>
          ))}
        </div>

        {/* Click Heart counter reaction card */}
        <div className="mt-2.5 bg-gradient-to-r from-rose-50/50 to-love-light/25 dark:from-love-dark-bg/20 dark:to-love-dark-bg/5 p-3 rounded-xl border border-rose-100/30 dark:border-rose-950/10 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-rose-800 dark:text-rose-200">Room Love Reactor</span>
            <span className="text-[8px] text-rose-500/70 dark:text-rose-400/55">Click right heart to add reaction!</span>
          </div>
          <div className="flex items-center gap-1 bg-white/70 dark:bg-love-dark px-2.5 py-1.5 rounded-xl border border-rose-100/40 dark:border-rose-950/25">
            <Heart className="w-3.5 h-3.5 text-love-primary fill-love-primary animate-bounce" />
            <span className="text-xs font-bold text-rose-700 dark:text-rose-200">
              {store.heartReactionCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
