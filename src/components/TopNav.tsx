'use client';

import React, { useState, useEffect } from 'react';
import { useLoveStudyStore } from '@/store/useLoveStudyStore';
import { Share2, Heart, Sun, Moon, Edit3, Check, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TopNav() {
  const store = useLoveStudyStore();
  const activeNotebook = store.notebooks.find((n) => n.id === store.activeNotebookId);
  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => { if (activeNotebook) setTitleInput(activeNotebook.title); }, [activeNotebook]);

  const handleSaveTitle = () => {
    if (titleInput.trim() && activeNotebook) { store.updateNotebookTitle(activeNotebook.id, titleInput.trim()); setIsEditing(false); }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveTitle();
    if (e.key === 'Escape') { setTitleInput(activeNotebook?.title || ''); setIsEditing(false); }
  };

  return (
    <header className="h-[80px] w-full px-6 flex items-center justify-between border-b border-rose-100/50 dark:border-rose-950/20 glass z-10 flex-shrink-0">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <input type="text" value={titleInput} onChange={(e) => setTitleInput(e.target.value)} onKeyDown={handleKeyDown} className="text-lg font-bold text-rose-700 dark:text-rose-100 bg-white/70 dark:bg-love-dark border border-love-primary/40 rounded-xl px-2 py-0.5 focus:outline-none" autoFocus />
              <button onClick={handleSaveTitle} className="p-1 hover:bg-rose-100/50 rounded-lg text-emerald-500"><Check className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-rose-800 dark:text-rose-100 flex items-center gap-1">
                <span>{activeNotebook?.title || 'LiveCode Notebook'}</span><span>💖</span>
              </h1>
              <button onClick={() => setIsEditing(true)} className="p-1 hover:bg-rose-100/50 rounded-lg text-rose-400 transition-colors"><Edit3 className="w-4 h-4" /></button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
          <span className="text-xs font-semibold text-rose-500/80 dark:text-rose-300/50 flex items-center gap-1">
            You and {store.onlineUsers.find(n => n !== store.currentUser) || 'your partner'} are learning together <span className="animate-pulse">✨</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowShareModal(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-love-primary rounded-xl border border-love-primary/20 cursor-pointer">
            <Share2 className="w-4 h-4" /><span>Share</span>
          </button>
          <button onClick={() => setFavorite(!favorite)} className={`p-2 rounded-xl border border-rose-100/50 transition-all cursor-pointer ${favorite ? 'bg-rose-500 text-white border-rose-500' : 'bg-white/60 dark:bg-love-dark hover:bg-rose-50/50 text-rose-400'}`}>
            <Heart className="w-4 h-4" />
          </button>
          <button onClick={store.toggleTheme} className="p-2 rounded-xl bg-white/60 dark:bg-love-dark border border-rose-100/50 hover:bg-rose-50/50 text-rose-400 cursor-pointer">
            {store.theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
        <div className="h-6 w-px bg-rose-100/50" />
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2.5 overflow-hidden">
            {store.onlineUsers.map((username) => {
              const isMe = username === store.currentUser;
              const avatar = isMe ? store.collaborators.jitu.avatar : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=ff5c93,f43f5e,e11d48&textColor=ffffff&radius=50&fontSize=38`;
              return (
                <div key={username} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatar} alt={username} className="inline-block h-9 w-9 rounded-full ring-2 ring-love-light object-cover bg-rose-100" />
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
              );
            })}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-200">{store.onlineUsers.length > 0 ? store.onlineUsers.join(' & ') : store.currentUser || 'Join to connect'}</span>
            <span className="text-[10px] text-emerald-500 font-semibold">{store.onlineUsers.length > 0 ? `${store.onlineUsers.length} online` : '0 online'}</span>
          </div>
        </div>
      </div>

      {showShareModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white dark:bg-love-dark-bg border border-rose-100/50 p-6 rounded-3xl shadow-2xl">
            <h3 className="text-lg font-bold text-rose-800 dark:text-rose-100 flex items-center gap-2"><Users className="w-5 h-5 text-love-primary" /><span>Share Study Room</span></h3>
            <p className="text-sm text-rose-500/80 mt-2">Invite your partner to study together in real-time.</p>
            <div className="mt-4 flex gap-2">
              <input type="text" readOnly value={typeof window !== 'undefined' ? `${window.location.origin}/notebook/${store.roomId}` : `http://localhost:3000/notebook/${store.roomId}`} className="flex-1 text-xs bg-rose-50/50 dark:bg-love-dark text-rose-700 dark:text-rose-200 border border-rose-100 rounded-xl px-3 py-2.5 focus:outline-none" />
              <button onClick={() => { const link = `${window.location.origin}/notebook/${store.roomId}`; navigator.clipboard.writeText(link); }} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl">Copy</button>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowShareModal(false)} className="px-4 py-2 bg-gradient-to-r from-love-primary to-love-secondary text-white text-xs font-semibold rounded-xl">Close</button>
            </div>
          </motion.div>
        </div>
      )}
    </header>
  );
}
