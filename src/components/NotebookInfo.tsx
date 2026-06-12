'use client';

import React from 'react';
import { useLoveStudyStore } from '@/store/useLoveStudyStore';
import { Info, Calendar, Clock, Terminal, Users } from 'lucide-react';

export default function NotebookInfo() {
  const store = useLoveStudyStore();
  const activeNotebook = store.notebooks.find((n) => n.id === store.activeNotebookId);

  return (
    <div className="bg-white/50 dark:bg-love-dark/30 border border-rose-100/40 dark:border-rose-950/20 p-4 rounded-2xl space-y-3.5 shadow-sm">
      <h3 className="text-xs font-bold text-rose-400 dark:text-rose-300/40 uppercase tracking-wider flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-love-primary" />
        <span>Notebook Info</span>
      </h3>
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-rose-700/80 dark:text-rose-300/60">
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-rose-300" />Created</span>
          <span className="font-semibold">{activeNotebook ? 'Today' : '-'}</span>
        </div>
        <div className="flex items-center justify-between text-rose-700/80 dark:text-rose-300/60">
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-rose-300" />Last updated</span>
          <span className="font-semibold">{activeNotebook?.lastUpdated || 'Just now'}</span>
        </div>
        <div className="flex items-center justify-between text-rose-700/80 dark:text-rose-300/60">
          <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-rose-300" />Language</span>
          <span className="font-semibold">Python 3 (Pyodide)</span>
        </div>
        <div className="flex items-center justify-between text-rose-700/80 dark:text-rose-300/60">
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-rose-300" />Collaborators</span>
          <span className="font-semibold flex items-center gap-1"><span className="h-1.5 w-1.5 bg-emerald-500 rounded-full inline-block" />{store.onlineUsers.length} online</span>
        </div>
      </div>
    </div>
  );
}
