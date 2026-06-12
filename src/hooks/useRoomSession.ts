'use client';

import { useEffect, useState } from 'react';
import { useLoveStudyStore, getNotebookExtension } from '@/store/useLoveStudyStore';

export function useRoomSession(paramsLoaded?: boolean) {
  const [sessionActive, setSessionActive] = useState(false);

  useEffect(() => {
    const state = useLoveStudyStore.getState();
    if (!state.currentUser) return;
    if (paramsLoaded === false) return;

    const initSession = async () => {
      await useLoveStudyStore.getState().loadActiveNotebook();
      setSessionActive(true);
    };
    initSession();
  }, [paramsLoaded]);

  useEffect(() => {
    if (!sessionActive) return;

    const pollUpdates = async () => {
      try {
        const localState = useLoveStudyStore.getState();
        const { currentUser, roomId } = localState;
        if (!currentUser) return;

        // Heartbeat presence
        const resPresence = await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser, roomId })
        });
        if (resPresence.ok) {
          const { onlineUsers } = await resPresence.json();
          useLoveStudyStore.setState({ onlineUsers: onlineUsers || [currentUser] });
        }

        // Poll notebook changes
        const { activeNotebookId } = localState;
        if (!activeNotebookId) return;

        const resNotebooks = await fetch('/api/notebooks');
        if (resNotebooks.ok) {
          const { notebooks: dbNotebooks } = await resNotebooks.json();
          if (dbNotebooks && dbNotebooks.length > 0) {
            const localNotebooksMatch = localState.notebooks.every(
              (n) => dbNotebooks.find((db: { id: string }) => db.id === n.id)
            );

            if (!localNotebooksMatch || localState.notebooks.length !== dbNotebooks.length) {
              const parsedNotebooks = dbNotebooks.map((nb: {
                id: string;
                title: string;
                icon?: string;
                language?: string;
                createdAt?: string;
                cells?: any[];
              }) => ({
                id: nb.id,
                title: nb.title,
                icon: nb.icon || '❤️',
                language: nb.language,
                created: nb.createdAt || new Date().toISOString(),
                lastUpdated: 'Just now',
                cells: (nb.cells || []).map((c: any) => ({
                  id: c.id,
                  type: c.type,
                  content: c.content || '',
                  output: c.output || '',
                  language: c.language || (nb.language === 'python_notebook' ? 'python' : nb.language) || 'python',
                  executionCount: c.executionCount || 0,
                })),
              }));
              useLoveStudyStore.setState({
                notebooks: parsedNotebooks,
                recentFiles: parsedNotebooks
                  .map((n: { title: string; language?: string }) => ({ name: n.title + getNotebookExtension(n.language), type: 'notebook' as const }))
                  .concat([{ name: 'Shared_Notes.md', type: 'markdown' as const }]),
              });
            } else {
              const match = dbNotebooks.find((nb: { id: string }) => nb.id === activeNotebookId);
              const active = localState.notebooks.find((n) => n.id === activeNotebookId);
              if (match && match.cells && active) {
                const currentCells = active.cells;
                const cellsChanged =
                  match.cells.length !== currentCells.length ||
                  match.cells.some((c: { id: string; type: string; language?: string; content?: string; output?: unknown }, idx: number) => {
                    const local = currentCells[idx];
                    if (!local) return true;
                    const wasEditedLocally = Date.now() - (localState.localEdits?.[c.id] || 0) < 4000;
                    return (c.id !== local.id || c.type !== local.type || c.language !== local.language || (!wasEditedLocally && c.content !== local.content) || JSON.stringify(c.output) !== JSON.stringify(local.output));
                  });

                if (cellsChanged) {
                  const updatedCells = match.cells.map((c: any, idx: number) => {
                    const local = currentCells[idx];
                    const wasEditedLocally = local && (Date.now() - (localState.localEdits?.[c.id] || 0) < 4000);
                    return { id: c.id, type: c.type, content: wasEditedLocally ? (local.content || '') : (c.content || ''), output: c.output || '', language: c.language || (match.language === 'python_notebook' ? 'python' : match.language) || 'python', executionCount: c.executionCount || 0 };
                  });
                  useLoveStudyStore.setState({
                    notebooks: localState.notebooks.map((n) => n.id === activeNotebookId ? { ...n, cells: updatedCells } : n),
                  });
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to poll cell updates:', e);
      }

      try {
        const resRoom = await fetch(`/api/room-state?roomId=${useLoveStudyStore.getState().roomId}`);
        if (resRoom.ok) {
          const { state } = await resRoom.json();
          if (state) {
            const localStore = useLoveStudyStore.getState();
            const newStudyTime = state.studyTimeElapsed;
            const studyTimeDiff = Math.abs(newStudyTime - localStore.studyTimeElapsed);
            useLoveStudyStore.setState({
              streak: { days: state.streakDays, hearts: state.streakHearts, goalProgress: state.streakGoalProgress },
              currentMood: state.currentMood,
              heartReactionCount: state.heartReactionCount,
              studyTimeElapsed: localStore.studyTimerActive && studyTimeDiff < 5 ? localStore.studyTimeElapsed : newStudyTime,
            });
          }
        }
      } catch (e) {
        console.warn('Failed to poll room state:', e);
      }
    };

    pollUpdates();
    const interval = setInterval(pollUpdates, 1500);
    return () => clearInterval(interval);
  }, [sessionActive]);
}
