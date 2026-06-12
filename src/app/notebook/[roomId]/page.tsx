'use client';

import React, { useEffect, useState } from 'react';
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

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: PageProps) {
  const store = useLoveStudyStore();
  const [roomId, setRoomId] = useState<string>('');
  const [paramsLoaded, setParamsLoaded] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileRightPanelOpen, setMobileRightPanelOpen] = useState(false);
  const activeNotebook = store.notebooks.find((n) => n.id === store.activeNotebookId);
  const isScript = activeNotebook && activeNotebook.language && activeNotebook.language !== 'python_notebook';

  useRoomSession(paramsLoaded);

  useEffect(() => {
    params.then((p) => {
      const id = decodeURIComponent(p.roomId);
      setRoomId(id);
      store.setRoomId(id);
      setParamsLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (store.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [store.theme]);

  if (!paramsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-love-bg-start via-love-bg-middle to-love-bg-end">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl animate-bounce">💕</span>
          <p className="text-xs font-semibold text-rose-500">Loading study room...</p>
        </div>
      </div>
    );
  }

  if (store.currentView === 'auth') return <AuthView initialRoomId={roomId} />;

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

      <div className={`fixed inset-y-0 right-0 transform xl:relative xl:translate-x-0 transition-transform duration-300 z-30 w-[320px] h-full flex flex-col glass border-l border-rose-100/50 flex-shrink-0 ${mobileRightPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-rose-100/30 flex items-center justify-between">
          <span className="text-xs font-bold text-rose-700 dark:text-rose-200 flex items-center gap-1.5"><Heart className="w-4 h-4 text-love-primary fill-love-primary animate-pulse" /><span>Study Room Panel</span></span>
          <span className="text-[10px] bg-rose-500/10 text-love-primary px-2 py-0.5 rounded-md font-bold max-w-[100px] truncate">Room: {roomId || 'default'}</span>
        </div>
        <div className="flex-1 overflow-y-auto"><RightPanelTabs /></div>
      </div>
      {mobileRightPanelOpen && <div onClick={() => setMobileRightPanelOpen(false)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 xl:hidden" />}
    </div>
  );
}
