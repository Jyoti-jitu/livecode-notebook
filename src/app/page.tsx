'use client';

import React, { useState, useEffect } from 'react';
import { useLoveStudyStore } from '@/store/useLoveStudyStore';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import Toolbar from '@/components/Toolbar';
import CellsArea from '@/components/CellsArea';
import ScriptEditorView from '@/components/ScriptEditorView';
import DashboardView from '@/components/DashboardView';
import AuthView from '@/components/AuthView';
import RightPanelTabs from '@/components/RightPanelTabs';
import FloatingHearts from '@/components/FloatingHearts';
import CollaborationSimulator from '@/components/CollaborationSimulator';
import { useRoomSession } from '@/hooks/useRoomSession';
import { Menu, X, ArrowLeftRight, Heart } from 'lucide-react';

export default function Home() {
  const store = useLoveStudyStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileRightPanelOpen, setMobileRightPanelOpen] = useState(false);
  const activeNotebook = store.notebooks.find((n) => n.id === store.activeNotebookId);
  const isScript = activeNotebook && activeNotebook.language && activeNotebook.language !== 'python_notebook';

  useRoomSession();

  useEffect(() => {
    const root = window.document.documentElement;
    if (store.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [store.theme]);

  if (store.currentView === 'auth') return <AuthView />;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-love-bg-start via-love-bg-middle to-love-bg-end dark:from-love-dark-bg dark:via-love-dark dark:to-neutral-900 transition-colors duration-300 relative">
      <CollaborationSimulator />
      <FloatingHearts />

      <div className="absolute top-4 left-4 z-40 lg:hidden flex gap-2">
        <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} className="p-2 bg-white/80 dark:bg-love-dark border border-rose-100 dark:border-rose-950 rounded-xl text-rose-700 dark:text-rose-200 shadow-md cursor-pointer">
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="absolute top-4 right-4 z-40 xl:hidden flex gap-2">
        <button onClick={() => setMobileRightPanelOpen(!mobileRightPanelOpen)} className="p-2 bg-white/80 dark:bg-love-dark border border-rose-100 dark:border-rose-950 rounded-xl text-rose-700 dark:text-rose-200 shadow-md cursor-pointer">
          <ArrowLeftRight className="w-5 h-5" />
        </button>
      </div>

      <div className={`fixed inset-y-0 left-0 transform lg:relative lg:translate-x-0 transition-transform duration-300 z-30 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar />
      </div>
      {mobileSidebarOpen && <div onClick={() => setMobileSidebarOpen(false)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden" />}

      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <div className="pl-14 lg:pl-0"><TopNav /></div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {store.currentView === 'notebook' ? (
            isScript ? <ScriptEditorView /> : (
              <>
                <Toolbar />
                <div className="flex-1 overflow-y-auto"><CellsArea /></div>
              </>
            )
          ) : <DashboardView />}
        </div>
      </div>

      <div className={`fixed inset-y-0 right-0 transform xl:relative xl:translate-x-0 transition-transform duration-300 z-30 w-[320px] h-full flex flex-col glass border-l border-rose-100/50 dark:border-rose-950/20 flex-shrink-0 ${mobileRightPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-rose-100/30 dark:border-rose-950/10 flex items-center justify-between">
          <span className="text-xs font-bold text-rose-700 dark:text-rose-200 flex items-center gap-1.5"><Heart className="w-4 h-4 text-love-primary fill-love-primary animate-pulse" /><span>Study Room Panel</span></span>
          <button onClick={() => setMobileRightPanelOpen(false)} className="xl:hidden p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-rose-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto"><RightPanelTabs /></div>
      </div>
      {mobileRightPanelOpen && <div onClick={() => setMobileRightPanelOpen(false)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 xl:hidden" />}
    </div>
  );
}
