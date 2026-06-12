'use client';

import React, { useState } from 'react';
import { useLoveStudyStore } from '@/store/useLoveStudyStore';
import { Heart, Plus, BookOpen, Clock, FileText, Trash2, MoreVertical, Terminal, LogOut, Loader2, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import AddNotebookModal from './AddNotebookModal';

export default function Sidebar() {
  const store = useLoveStudyStore();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await store.logout(); } catch (e) { console.error(e); } finally { setIsLoggingOut(false); }
  };

  return (
    <aside className="w-[280px] h-full flex flex-col glass border-r border-rose-100/50 dark:border-rose-950/20 z-10 flex-shrink-0">
      <div className="p-6 flex flex-col border-b border-rose-100/30 dark:border-rose-950/10">
        <div className="flex items-center gap-2">
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}>
            <Heart className="w-8 h-8 text-love-primary fill-love-primary drop-shadow-[0_2px_8px_rgba(255,92,147,0.4)]" />
          </motion.div>
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-love-primary to-love-secondary bg-clip-text text-transparent">LiveCode</span>
        </div>
        <p className="text-xs font-medium text-rose-400 dark:text-rose-300/60 mt-1">Real-time collaborative notebook 💕</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        <div className="space-y-1">
          <button onClick={() => store.setView('notebook')} className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${store.currentView === 'notebook' ? 'bg-love-light/60 dark:bg-love-primary/20 text-love-primary shadow-sm border border-love-primary/10' : 'text-rose-700/80 dark:text-rose-200/70 hover:bg-rose-50/50 hover:text-love-primary'}`}>
            <Terminal className="w-4 h-4 text-love-primary" /><span>Notebook Editor</span>
          </button>
          <button onClick={() => store.setView('dashboard')} className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${store.currentView === 'dashboard' ? 'bg-love-light/60 dark:bg-love-primary/20 text-love-primary shadow-sm border border-love-primary/10' : 'text-rose-700/80 dark:text-rose-200/70 hover:bg-rose-50/50 hover:text-love-primary'}`}>
            <LayoutDashboard className="w-4 h-4 text-love-primary" /><span>Room Dashboard</span>
          </button>
        </div>

        <div className="h-px bg-rose-100/30 my-1" />

        <button onClick={() => setIsModalOpen(true)} className="w-full py-2.5 px-4 bg-gradient-to-r from-love-primary to-love-secondary hover:from-love-secondary hover:to-love-primary text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg cursor-pointer hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4" /><span>New Notebook</span>
        </button>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-rose-400 dark:text-rose-300/40 px-2 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /><span>Notebooks</span>
          </h3>
          <div className="space-y-1">
            {store.notebooks.map((notebook) => {
              const isActive = store.activeNotebookId === notebook.id;
              return (
                <div key={notebook.id} className="group relative flex items-center justify-between">
                  <button onClick={() => store.setActiveNotebook(notebook.id)}
                    className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-medium transition-all text-left ${isActive ? 'bg-love-light/60 dark:bg-love-primary/20 text-love-primary shadow-sm' : 'text-rose-700/80 hover:bg-rose-50/50 hover:text-love-primary'}`}>
                    <span className="text-base">{notebook.icon || '❤️'}</span>
                    <span className="truncate flex-1">{notebook.title}</span>
                  </button>
                  <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === notebook.id ? null : notebook.id); }} className="p-1 hover:bg-rose-100/50 rounded-lg text-rose-400">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {activeMenuId === notebook.id && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                        <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-love-dark-bg border border-rose-100/40 rounded-xl shadow-xl py-1 z-30">
                          <button onClick={() => { store.deleteNotebook(notebook.id); setActiveMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:bg-rose-50 text-left">
                            <Trash2 className="w-3.5 h-3.5" />Delete Notebook
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-rose-400 px-2 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /><span>Recent Files</span>
          </h3>
          <div className="space-y-1">
            {store.recentFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2 px-3 text-xs font-medium text-rose-600/70 hover:text-love-primary rounded-lg cursor-pointer hover:bg-rose-50/20">
                <FileText className="w-3.5 h-3.5 text-rose-300 flex-shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-rose-100/30 flex flex-col gap-3">
        <button onClick={handleLogout} disabled={isLoggingOut} className="w-full py-2.5 px-4 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-200 hover:bg-rose-50/80 active:scale-95 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer">
          {isLoggingOut ? <><Loader2 className="w-3.5 h-3.5 animate-spin text-love-primary" /><span>Saving...</span></> : <><LogOut className="w-3.5 h-3.5 text-love-primary" /><span>Save & Logout</span></>}
        </button>
      </div>
      <AddNotebookModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={(title, lang) => store.addNotebook(title, lang)} />
    </aside>
  );
}
