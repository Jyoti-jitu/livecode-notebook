'use client';

import React, { useState } from 'react';
import { useLoveStudyStore } from '@/store/useLoveStudyStore';
import { Heart, User, Sparkles, ArrowRight, Home, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthViewProps {
  initialRoomId?: string;
}

export default function AuthView({ initialRoomId }: AuthViewProps) {
  const store = useLoveStudyStore();
  const [username, setUsername] = useState('');
  const [roomIdInput, setRoomIdInput] = useState(initialRoomId || store.roomId || 'love-study-room');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    store.setRoomId(roomIdInput.trim());
    store.setCurrentUser(username.trim());
    store.setView('notebook');
  };

  const isSharedLink = !!initialRoomId;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-love-bg-start via-love-bg-middle to-love-bg-end">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#fff0f3_1px,transparent_1px),linear-gradient(to_bottom,#fff0f3_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-70 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/70 dark:bg-love-dark/30 backdrop-blur-xl border border-rose-100/50 dark:border-rose-950/20 p-8 rounded-3xl shadow-2xl relative z-10 space-y-6"
      >
        <div className="flex flex-col items-center text-center space-y-1">
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.8 }} className="p-3 bg-rose-500/10 rounded-2xl text-love-primary">
            <Heart className="w-10 h-10 fill-current" />
          </motion.div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-love-primary to-love-secondary bg-clip-text text-transparent mt-2">
            {isSharedLink ? "You're Invited! 💌" : 'LiveCode Notebook'}
          </h2>
          <p className="text-xs text-rose-500/80 dark:text-rose-300/60 font-semibold max-w-[280px] leading-relaxed mt-1">
            {isSharedLink ? 'Someone shared this study room with you. Enter your name to join!' : 'Enter your name to join the real-time collaborative code session.'}
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-rose-600 dark:text-rose-300 uppercase tracking-wider block">Your Name / Nickname</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300" />
              <input type="text" required autoFocus value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your name..." className="w-full pl-10 pr-4 py-3 text-xs text-rose-800 dark:text-rose-100 bg-rose-50/30 dark:bg-love-dark-bg border border-rose-100 dark:border-rose-950/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-love-primary/40" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-rose-600 dark:text-rose-300 uppercase tracking-wider block">Study Room ID</label>
            <div className="relative">
              <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300" />
              <input type="text" required value={roomIdInput} onChange={(e) => setRoomIdInput(e.target.value)} readOnly={isSharedLink} placeholder="Enter study room id..." className={`w-full pl-10 pr-4 py-3 text-xs text-rose-800 dark:text-rose-100 border border-rose-100 dark:border-rose-950/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-love-primary/40 ${isSharedLink ? 'bg-rose-100/40 dark:bg-rose-950/20 cursor-not-allowed' : 'bg-rose-50/30 dark:bg-love-dark-bg'}`} />
              {isSharedLink && <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rose-300" />}
            </div>
          </div>
          <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-love-primary to-love-secondary hover:from-love-secondary hover:to-love-primary text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-6">
            <span>{isSharedLink ? 'Join Study Room 💖' : 'Enter Study Space'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
