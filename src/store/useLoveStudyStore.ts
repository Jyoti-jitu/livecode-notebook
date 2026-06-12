'use client';

import { create } from 'zustand';
import { saveNotebookToDB, saveCellsToDB, loadNotebookFromDB, saveVersionSnapshot } from '@/lib/supabase';

export interface Cell {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  output?: string | { type: 'table'; headers: string[]; rows: any[] } | { type: 'error'; text: string };
  language: string;
  executionCount?: number;
  isRunning?: boolean;
  isCollapsed?: boolean;
}

export interface Notebook {
  id: string;
  title: string;
  icon: string;
  cells: Cell[];
  lastUpdated: string;
  created: string;
  language?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  avatar?: string;
}

export interface Collaborator {
  name: string;
  role: string;
  online: boolean;
  color: string;
  avatar: string;
}

interface LoveStudyState {
  // Navigation / App View
  currentView: 'dashboard' | 'notebook' | 'auth';
  authMode: 'login' | 'register' | 'forgot-password';
  theme: 'light' | 'dark';
  
  // Room and Persistence
  roomId: string;
  uploadedFiles: { name: string; content: string }[];
  sharedNotes: string;
  
  // Undo/Redo transaction logs
  undoStack: Cell[][];
  redoStack: Cell[][];
  
  // Notebook lists and active selection
  notebooks: Notebook[];
  activeNotebookId: string;
  recentFiles: { name: string; type: 'notebook' | 'markdown' }[];
  
  // Timer States
  studyTimerActive: boolean;
  studyTimeElapsed: number; // in seconds
  pomodoro: {
    timeLeft: number; // in seconds
    isRunning: boolean;
    mode: 'work' | 'shortBreak' | 'longBreak';
    workDuration: number; // in seconds
    shortBreakDuration: number;
    longBreakDuration: number;
    cycleCompleted: number;
  };
  
  // Collaborative Indicators
  collaborators: {
    jitu: Collaborator;
    ananya: Collaborator;
  };
  typingIndicator: {
    ananya: boolean;
  };
  ananyaCursor: {
    cellId: string | null;
    lineNumber: number;
    column: number;
  };
  
  // Gamification & Reactions
  streak: {
    days: number;
    hearts: number;
    goalProgress: number; // 0 to 100
  };
  currentMood: '😊 Focused' | '🥰 Happy' | '🔥 Productive' | '🧠 Studying';
  heartReactionCount: number;
  chatMessages: ChatMessage[];
  
  currentUser: string;
  onlineUsers: string[];
  localEdits: Record<string, number>;
  setCurrentUser: (username: string) => void;
  setOnlineUsers: (users: string[]) => void;
  // Actions
  toggleTheme: () => void;
  setView: (view: 'dashboard' | 'notebook' | 'auth', authMode?: 'login' | 'register' | 'forgot-password') => void;
  setActiveNotebook: (id: string) => void;
  addNotebook: (title: string, language?: string) => void;
  updateNotebookTitle: (id: string, title: string) => void;
  deleteNotebook: (id: string) => void;
  setRoomId: (id: string) => void;
  
  // Cell Actions
  addCell: (notebookId: string, type: 'code' | 'markdown', index?: number) => void;
  updateCellContent: (notebookId: string, cellId: string, content: string) => void;
  updateCellLanguage: (notebookId: string, cellId: string, language: string) => void;
  runCell: (notebookId: string, cellId: string) => Promise<void>;
  runAllCells: (notebookId: string) => Promise<void>;
  restartKernel: (notebookId: string) => void;
  deleteCell: (notebookId: string, cellId: string) => void;
  duplicateCell: (notebookId: string, cellId: string) => void;
  moveCell: (notebookId: string, cellId: string, direction: 'up' | 'down') => void;
  toggleCellCollapse: (notebookId: string, cellId: string) => void;
  reorderCells: (notebookId: string, cellIds: string[]) => void;
  
  // File Uploads
  uploadFile: (name: string, content: string) => void;
  
  // Shared Notes
  updateSharedNotes: (notes: string) => void;
  
  // Undo / Redo
  pushToUndo: (cells: Cell[]) => void;
  undo: () => void;
  redo: () => void;
  
  // Persistence auto save
  saveActiveNotebook: () => Promise<void>;
  loadActiveNotebook: () => Promise<void>;
  loadNotebooksList: () => Promise<void>;
  syncRoomState: (updateData?: any) => Promise<void>;
  logActivity: (action: string, notebookTitle: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Chat Actions
  sendChatMessage: (text: string, sender?: string) => void;
  setAnanyaTyping: (typing: boolean) => void;
  archiveChat: () => Promise<void>;
  
  // Timer Actions
  toggleStudyTimer: () => void;
  incrementStudyTimer: () => void;
  resetStudyTimer: () => void;
  
  // Pomodoro Actions
  startPomodoro: () => void;
  pausePomodoro: () => void;
  resetPomodoro: () => void;
  tickPomodoro: () => void;
  setPomodoroMode: (mode: 'work' | 'shortBreak' | 'longBreak') => void;
  
  // Reactions & Moods
  setMood: (mood: '😊 Focused' | '🥰 Happy' | '🔥 Productive' | '🧠 Studying') => void;
  incrementHearts: (count?: number) => void;
  
  // Cursor Updates
  updateAnanyaCursor: (cellId: string | null, line: number, col: number) => void;
}

const debounceSaveTimers: Record<string, NodeJS.Timeout> = {};

function debounceSaveCellsToDB(notebookId: string, cells: Cell[]) {
  if (debounceSaveTimers[notebookId]) {
    clearTimeout(debounceSaveTimers[notebookId]);
  }
  debounceSaveTimers[notebookId] = setTimeout(async () => {
    try {
      const state = useLoveStudyStore.getState();
      const notebook = state.notebooks.find((n) => n.id === notebookId);
      const title = notebook ? notebook.title : undefined;
      await saveCellsToDB(notebookId, cells, title);
    } catch (e) {
      console.warn(`Failed to auto-save cells for notebook ${notebookId}:`, e);
    }
  }, 800);
}

export function getNotebookExtension(language?: string): string {
  if (!language || language === 'python_notebook') return '.ipynb';
  if (language === 'python') return '.py';
  if (language === 'javascript') return '.js';
  if (language === 'java') return '.java';
  if (language === 'c') return '.c';
  if (language === 'cpp') return '.cpp';
  return '.txt';
}

const initialNotebooks: Notebook[] = [
  {
    id: 'notebook-1',
    title: 'Jitu & Ananya Study',
    icon: '❤️',
    created: '2026-06-12 09:00:00',
    lastUpdated: 'Just now',
    cells: [
      {
        id: 'cell-1-1',
        type: 'markdown',
        language: 'markdown',
        content: '# Welcome to our study space 💕\n\nThis is our notebook where we learn **Python, NumPy and Pandas** together.\n\n💖 Learn new things\n💖 Practice together\n💖 Help each other\n💖 Grow together'
      },
      {
        id: 'cell-1-2',
        type: 'code',
        language: 'python',
        content: `import numpy as np
import pandas as pd

arr = np.array([1, 2, 3, 4, 5])
arr_squared = arr ** 2
print("Original Array:", arr)
print("Squared Array:", arr_squared)`,
        executionCount: 1,
        output: 'Original Array: [1 2 3 4 5]\nSquared Array: [1  4  9 16 25]'
      },
      {
        id: 'cell-1-3',
        type: 'code',
        language: 'python',
        content: `data = {
    'Name': ['Jitu', 'Ananya', 'Together'],
    'Love': [100, 100, 200]
}
df = pd.DataFrame(data)
df`,
        executionCount: 2,
        output: {
          type: 'table',
          headers: ['', 'Name', 'Love'],
          rows: [
            ['0', 'Jitu', '100'],
            ['1', 'Ananya', '100'],
            ['2', 'Together', '200']
          ]
        }
      }
    ]
  },
  {
    id: 'notebook-2',
    title: 'Data Science Basics',
    icon: '📊',
    created: '2026-06-11 14:00:00',
    lastUpdated: '1 day ago',
    cells: [
      {
        id: 'cell-2-1',
        type: 'markdown',
        language: 'markdown',
        content: '# Introduction to Data Science with Python 🐍\nIn this notebook, we cover columns, series, and plots using standard Python lists.'
      },
      {
        id: 'cell-2-2',
        type: 'code',
        language: 'python',
        content: `x = [1, 2, 3, 4, 5]
y = [2, 4, 6, 8, 10]
# Calculate mean
mean_x = sum(x) / len(x)
mean_y = sum(y) / len(y)
print("Mean of X:", mean_x)
print("Mean of Y:", mean_y)`,
        executionCount: 1,
        output: 'Mean of X: 3.0\nMean of Y: 6.0'
      }
    ]
  }
];

export const useLoveStudyStore = create<LoveStudyState>((set, get) => {
  const isClient = typeof window !== 'undefined';
  const savedUser = isClient ? window.localStorage.getItem('love_study_username') || '' : '';
  const initialView = savedUser ? 'notebook' : 'auth';

  return {
    currentView: initialView,
    authMode: 'login',
    theme: 'light',
    
    roomId: 'love-study-room',
    currentUser: savedUser,
    onlineUsers: [],
    localEdits: {},
    uploadedFiles: [],
    sharedNotes: '# Live Shared Study Notes\nType notes here to share real-time! 💗',
    
    undoStack: [],
    redoStack: [],
    
    notebooks: [],
    activeNotebookId: '',
    recentFiles: [],
    
    studyTimerActive: true,
    studyTimeElapsed: 0,
    
    pomodoro: {
      timeLeft: 25 * 60, // 25 minutes
      isRunning: false,
      mode: 'work',
      workDuration: 25 * 60,
      shortBreakDuration: 5 * 60,
      longBreakDuration: 15 * 60,
      cycleCompleted: 0
    },
    
    collaborators: {
      jitu: {
        name: 'Jitu',
        role: 'Owner',
        online: true,
        color: '#A78BFA', // Purple
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
      },
      ananya: {
        name: 'Ananya',
        role: 'Partner',
        online: true,
        color: '#FF5C93', // Pink
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'
      }
    },
    
    typingIndicator: {
      ananya: false
    },
    
    ananyaCursor: {
      cellId: null,
      lineNumber: 1,
      column: 1
    },
    
    streak: {
      days: 0,
      hearts: 0,
      goalProgress: 0
    },
    
    currentMood: '😊 Focused',
    heartReactionCount: 0,
    
    chatMessages: [],
    
    setCurrentUser: (username) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('love_study_username', username);
      }
      set({ currentUser: username });
    },
    setOnlineUsers: (users) => set({ onlineUsers: users }),
    toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    
    setView: (view, authMode = 'login') => set({ currentView: view, authMode }),
    
    setActiveNotebook: (id) => {
      set({ activeNotebookId: id, currentView: 'notebook' });
      get().loadActiveNotebook();
    },
    
    addNotebook: (title, language = 'python_notebook') => {
      const { roomId, notebooks } = get();
      const newId = `notebook-${Date.now()}`;
      
      let icon = '📝';
      let cells: Cell[] = [];
      
      if (language === 'python_notebook') {
        icon = '📓';
        cells = [
          {
            id: `cell-${Date.now()}-1`,
            type: 'markdown',
            language: 'markdown',
            content: `# ${title} 💕\nWelcome to your collaborative notebook study session. Add cells below and learn together!`
          },
          {
            id: `cell-${Date.now()}-2`,
            type: 'code',
            language: 'python',
            content: 'print("Let\'s learn together! 💖")\n# Press the Run button to run this cell',
            executionCount: 0
          }
        ];
      } else {
        let content = '';
        if (language === 'python') {
          icon = '🐍';
          content = 'print("Hello from Python Script! 🐍")\n';
        } else if (language === 'javascript') {
          icon = '🟨';
          content = 'console.log("Hello from JavaScript Script! 🟨");\n';
        } else if (language === 'java') {
          icon = '☕';
          content = 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java! ☕");\n    }\n}\n';
        } else if (language === 'c') {
          icon = '🛡️';
          content = '#include <stdio.h>\n\nint main() {\n    printf("Hello from C! 🛡️\\n");\n    return 0;\n}\n';
        } else if (language === 'cpp') {
          icon = '⚙️';
          content = '#include <iostream>\n\nint main() {\n    std::cout << "Hello from C++! ⚙️" << std::endl;\n    return 0;\n}\n';
        } else {
          content = '// Start writing code here\n';
        }
        
        cells = [
          {
            id: `cell-${Date.now()}-1`,
            type: 'code',
            language: language,
            content: content,
            executionCount: 0
          }
        ];
      }
      
      const newNotebook: Notebook = {
        id: newId,
        title,
        icon,
        language,
        created: new Date().toISOString().replace('T', ' ').substring(0, 19),
        lastUpdated: 'Just now',
        cells
      };
      
      // Auto-save notebook configuration & cells
      saveNotebookToDB(newId, title, roomId, language, icon);
      saveCellsToDB(newId, newNotebook.cells, title);
      
      set({
        notebooks: [...notebooks, newNotebook],
        activeNotebookId: newId,
        recentFiles: [...notebooks, newNotebook].map((n: any) => ({
          name: n.title + getNotebookExtension(n.language),
          type: 'notebook' as 'notebook' | 'markdown'
        })).concat([{ name: 'Shared_Notes.md', type: 'markdown' as 'notebook' | 'markdown' }])
      });

      get().logActivity('Created notebook', title);
      get().incrementHearts(1);
    },
    
    updateNotebookTitle: (id, title) => {
      const { notebooks, roomId } = get();
      const notebook = notebooks.find((n) => n.id === id);
      saveNotebookToDB(id, title, roomId, notebook?.language, notebook?.icon);
      set({
        notebooks: notebooks.map((n) => n.id === id ? { ...n, title, lastUpdated: 'Just now' } : n),
        recentFiles: notebooks.map((n) => n.id === id ? { ...n, title } : n).map((n: any) => ({ name: n.title + getNotebookExtension(n.language), type: 'notebook' as 'notebook' | 'markdown' })).concat([{ name: 'Shared_Notes.md', type: 'markdown' as 'notebook' | 'markdown' }])
      });
      get().logActivity('Renamed notebook to ' + title, title);
    },
    
    deleteNotebook: async (id) => {
      const { notebooks, activeNotebookId } = get();
      const target = notebooks.find(n => n.id === id);
      try {
        await fetch(`/api/notebooks?id=${id}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.warn('Failed to delete notebook:', e);
      }
      const filtered = notebooks.filter((n) => n.id !== id);
      const active = activeNotebookId === id ? (filtered[0]?.id || '') : activeNotebookId;
      set({
        notebooks: filtered,
        activeNotebookId: active,
        recentFiles: filtered.map((n: any) => ({ name: n.title + getNotebookExtension(n.language), type: 'notebook' as 'notebook' | 'markdown' })).concat([{ name: 'Shared_Notes.md', type: 'markdown' as 'notebook' | 'markdown' }])
      });
      if (target) {
        get().logActivity('Deleted notebook', target.title);
      }
    },
    
    setRoomId: (id) => set({ roomId: id }),
    
    // Core cells action tracking undo/redo history state
    pushToUndo: (cells) => {
      const serialized = JSON.parse(JSON.stringify(cells));
      set((state) => ({
        undoStack: [...state.undoStack, serialized],
        redoStack: []
      }));
    },
    
    undo: () => {
      const { undoStack, notebooks, activeNotebookId } = get();
      if (undoStack.length === 0) return;
      
      const active = notebooks.find((n) => n.id === activeNotebookId);
      if (!active) return;
      
      const previousCells = undoStack[undoStack.length - 1];
      const newUndoStack = undoStack.slice(0, -1);
      const serializedCurrent = JSON.parse(JSON.stringify(active.cells));
      
      set({
        notebooks: notebooks.map((n) => n.id === activeNotebookId ? { ...n, cells: previousCells } : n),
        undoStack: newUndoStack,
        redoStack: [...get().redoStack, serializedCurrent]
      });
    },
    
    redo: () => {
      const { redoStack, notebooks, activeNotebookId } = get();
      if (redoStack.length === 0) return;
      
      const active = notebooks.find((n) => n.id === activeNotebookId);
      if (!active) return;
      
      const nextCells = redoStack[redoStack.length - 1];
      const newRedoStack = redoStack.slice(0, -1);
      const serializedCurrent = JSON.parse(JSON.stringify(active.cells));
      
      set({
        notebooks: notebooks.map((n) => n.id === activeNotebookId ? { ...n, cells: nextCells } : n),
        redoStack: newRedoStack,
        undoStack: [...get().undoStack, serializedCurrent]
      });
    },
    
    addCell: (notebookId, type, index) => {
      const { notebooks } = get();
      const active = notebooks.find((n) => n.id === notebookId);
      if (!active) return;
      
      get().pushToUndo(active.cells);
 
      const notebook = notebooks.find((n) => n.id === notebookId);
      const notebookLanguage = notebook?.language && notebook.language !== 'python_notebook'
        ? notebook.language
        : 'python';

      const newCell: Cell = {
        id: `cell-${Date.now()}`,
        type,
        language: type === 'code' ? notebookLanguage : 'markdown',
        content: type === 'code' ? '' : '## New Section 💕\n'
      };
      
      const updatedCells = [...active.cells];
      if (typeof index === 'number') {
        updatedCells.splice(index + 1, 0, newCell);
      } else {
        updatedCells.push(newCell);
      }

      set({
        notebooks: notebooks.map((n) => n.id === notebookId ? { ...n, cells: updatedCells, lastUpdated: 'Just now' } : n)
      });

      saveCellsToDB(notebookId, updatedCells, active.title);
      
      get().incrementHearts(1);
      get().logActivity('Added new cell', active.title);
    },
    
    updateCellContent: (notebookId, cellId, content) => {
      set((state) => {
        const updatedNotebooks = state.notebooks.map((n) => {
          if (n.id !== notebookId) return n;
          const updatedCells = n.cells.map((c) => c.id === cellId ? { ...c, content } : c);
          
          // Trigger debounced save to MongoDB
          debounceSaveCellsToDB(notebookId, updatedCells);
          
          return {
            ...n,
            cells: updatedCells,
            lastUpdated: 'Just now'
          };
        });

        return {
          notebooks: updatedNotebooks,
          localEdits: {
            ...state.localEdits,
            [cellId]: Date.now()
          }
        };
      });
    },
    
    updateCellLanguage: (notebookId, cellId, language) => set((state) => ({
      notebooks: state.notebooks.map((n) => {
        if (n.id !== notebookId) return n;
        return {
          ...n,
          cells: n.cells.map((c) => c.id === cellId ? { ...c, language } : c),
          lastUpdated: 'Just now'
        };
      })
    })),
    
    runCell: async (notebookId, cellId) => {
      const notebook = get().notebooks.find((n) => n.id === notebookId);
      if (!notebook) return;
      
      // Set cell to running
      set((state) => ({
        notebooks: state.notebooks.map((n) => {
          if (n.id !== notebookId) return n;
          return {
            ...n,
            cells: n.cells.map((c) => c.id === cellId ? { ...c, isRunning: true } : c)
          };
        })
      }));

      const cell = notebook.cells.find((c) => c.id === cellId);
      if (!cell) return;
      
      try {
        const response = await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: cell.content,
            language: cell.language || (notebook.language === 'python_notebook' ? 'python' : notebook.language) || 'python'
          })
        });

        if (!response.ok) {
          throw new Error(`Execution failed: ${response.statusText}`);
        }

        const res = await response.json();
        const executionCount = (cell.executionCount || 0) + 1;
        
        let output: any = '';
        if (res.stderr) {
          output = {
            type: 'error',
            text: res.stderr
          };
        } else {
          // Try to parse as JSON if it's a formatted table representation
          try {
            if (res.stdout.startsWith('{') && res.stdout.endsWith('}')) {
              const parsed = JSON.parse(res.stdout);
              if (parsed.type === 'table') {
                output = parsed;
              } else {
                output = res.stdout;
              }
            } else {
              output = res.stdout || 'Cell executed with no outputs.';
            }
          } catch {
            output = res.stdout || 'Cell executed with no outputs.';
          }
        }
        
        set((state) => ({
          notebooks: state.notebooks.map((n) => {
            if (n.id !== notebookId) return n;
            return {
              ...n,
              cells: n.cells.map((c) => c.id === cellId ? { ...c, isRunning: false, output, executionCount } : c)
            };
          })
        }));

        // Sync updated cells (with outputs) to database
        const updatedNotebook = get().notebooks.find((n) => n.id === notebookId);
        if (updatedNotebook) {
          saveCellsToDB(notebookId, updatedNotebook.cells, updatedNotebook.title);
        }

        get().incrementHearts(1);
        get().logActivity('Ran code cell', notebook.title);

      } catch (e: any) {
        set((state) => ({
          notebooks: state.notebooks.map((n) => {
            if (n.id !== notebookId) return n;
            return {
              ...n,
              cells: n.cells.map((c) => c.id === cellId ? {
                ...c,
                isRunning: false,
                output: { type: 'error', text: e.message || 'Fatal Execution Error.' }
              } : c)
            };
          })
        }));

        // Sync error outputs to database as well
        const updatedNotebook = get().notebooks.find((n) => n.id === notebookId);
        if (updatedNotebook) {
          saveCellsToDB(notebookId, updatedNotebook.cells, updatedNotebook.title);
        }
      }
    },
    
    runAllCells: async (notebookId) => {
      const notebook = get().notebooks.find((n) => n.id === notebookId);
      if (!notebook) return;
      for (const cell of notebook.cells) {
        if (cell.type === 'code') {
          await get().runCell(notebookId, cell.id);
        }
      }
    },
    
    restartKernel: (notebookId) => set((state) => ({
      notebooks: state.notebooks.map((n) => {
        if (n.id !== notebookId) return n;
        return {
          ...n,
          cells: n.cells.map((c) => ({ ...c, executionCount: undefined, output: undefined, isRunning: false })),
          lastUpdated: 'Just now'
        };
      })
    })),
    
    deleteCell: (notebookId, cellId) => {
      const { notebooks } = get();
      const active = notebooks.find((n) => n.id === notebookId);
      if (!active) return;
      
      get().pushToUndo(active.cells);

      const updatedCells = active.cells.filter((c) => c.id !== cellId);
      
      set({
        notebooks: notebooks.map((n) => n.id === notebookId ? { ...n, cells: updatedCells, lastUpdated: 'Just now' } : n)
      });

      saveCellsToDB(notebookId, updatedCells, active.title);
      
      get().logActivity('Deleted cell', active.title);
    },
    
    duplicateCell: (notebookId, cellId) => {
      const { notebooks } = get();
      const active = notebooks.find((n) => n.id === notebookId);
      if (!active) return;

      get().pushToUndo(active.cells);

      const cell = active.cells.find((c) => c.id === cellId);
      if (!cell) return;

      const duplicated: Cell = {
        ...cell,
        id: `cell-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        executionCount: undefined,
        output: undefined
      };
      const cellIdx = active.cells.findIndex((c) => c.id === cellId);
      const newCells = [...active.cells];
      newCells.splice(cellIdx + 1, 0, duplicated);

      set({
        notebooks: notebooks.map((n) => n.id === notebookId ? { ...n, cells: newCells, lastUpdated: 'Just now' } : n)
      });

      saveCellsToDB(notebookId, newCells, active.title);
    },
    
    moveCell: (notebookId, cellId, direction) => {
      const { notebooks } = get();
      const active = notebooks.find((n) => n.id === notebookId);
      if (!active) return;

      get().pushToUndo(active.cells);

      const index = active.cells.findIndex((c) => c.id === cellId);
      if (index === -1) return;
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === active.cells.length - 1) return;

      const newCells = [...active.cells];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = newCells[index];
      newCells[index] = newCells[targetIndex];
      newCells[targetIndex] = temp;

      set({
        notebooks: notebooks.map((n) => n.id === notebookId ? { ...n, cells: newCells, lastUpdated: 'Just now' } : n)
      });

      saveCellsToDB(notebookId, newCells, active.title);
    },
    toggleCellCollapse: (notebookId, cellId) => set((state) => ({
      notebooks: state.notebooks.map((n) => {
        if (n.id !== notebookId) return n;
        return {
          ...n,
          cells: n.cells.map((c) => c.id === cellId ? { ...c, isCollapsed: !c.isCollapsed } : c)
        };
      })
    })),
    
    reorderCells: (notebookId, cellIds) => {
      const { notebooks } = get();
      const active = notebooks.find((n) => n.id === notebookId);
      if (!active) return;

      get().pushToUndo(active.cells);

      const orderedCells = cellIds
        .map(id => active.cells.find(c => c.id === id))
        .filter((c): c is Cell => !!c);

      set({
        notebooks: notebooks.map((n) => n.id === notebookId ? { ...n, cells: orderedCells, lastUpdated: 'Just now' } : n)
      });

      saveCellsToDB(notebookId, orderedCells, active.title);
    },
    
    uploadFile: (name, content) => set((state) => ({
      uploadedFiles: [...state.uploadedFiles, { name, content }]
    })),
    
    updateSharedNotes: async (notes) => {
      set({ sharedNotes: notes });
      try {
        await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notesContent: notes })
        });
      } catch (e) {
        console.warn('Failed to save notes to MongoDB:', e);
      }
    },
    
    saveActiveNotebook: async () => {
      const { notebooks, activeNotebookId, roomId } = get();
      const active = notebooks.find((n) => n.id === activeNotebookId);
      if (!active) return;
      
      // Save version snapshots and write to DB
      saveVersionSnapshot(active.id, active.cells);
      await saveNotebookToDB(active.id, active.title, roomId, active.language, active.icon);
      await saveCellsToDB(active.id, active.cells, active.title);
    },
    
    loadActiveNotebook: async () => {
      let { activeNotebookId, notebooks } = get();
      if (notebooks.length === 0) {
        await get().loadNotebooksList();
        const updated = get();
        notebooks = updated.notebooks;
        activeNotebookId = updated.activeNotebookId;
      }
      
      const active = notebooks.find((n) => n.id === activeNotebookId);
      if (!active) return;
      
      const dbCells = await loadNotebookFromDB(activeNotebookId, active.cells);
      
      // Load chat messages from MongoDB (overwriting the local state, even if empty)
      try {
        const resChat = await fetch('/api/chat');
        if (resChat.ok) {
          const { messages } = await resChat.json();
          set({ chatMessages: messages || [] });
        }
      } catch (e) {
        console.warn('Failed to load chat from MongoDB:', e);
      }

      // Load shared notes from MongoDB
      try {
        const resNotes = await fetch('/api/notes');
        if (resNotes.ok) {
          const { notesContent } = await resNotes.json();
          if (notesContent) {
            set({ sharedNotes: notesContent });
          }
        }
      } catch (e) {
        console.warn('Failed to load notes from MongoDB:', e);
      }

      // Load room state (streaks, mood, timer, reactors)
      await get().syncRoomState();

      set((state) => ({
        notebooks: state.notebooks.map((n) => n.id === activeNotebookId ? { ...n, cells: dbCells } : n)
      }));
    },
    
    sendChatMessage: async (text, sender) => {
      const activeSender = sender || get().currentUser;
      const isJitu = activeSender === 'Jitu';
      const isAnanya = activeSender === 'Ananya';
      let avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
      if (isJitu) avatar = get().collaborators.jitu.avatar;
      if (isAnanya) avatar = get().collaborators.ananya.avatar;

      const newMessage: ChatMessage = {
        id: `chat-${Date.now()}`,
        sender: activeSender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, newMessage]
      }));

      try {
        await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: newMessage })
        });
      } catch (e) {
        console.warn('Failed to send chat to MongoDB:', e);
      }

      // Reward message sender with +1 heart
      get().incrementHearts(1);
    },
    
    setAnanyaTyping: (typing) => set({ typingIndicator: { ananya: typing } }),
    
    archiveChat: async () => {
      const { chatMessages, notebooks, roomId, currentUser } = get();

      if (!chatMessages || chatMessages.length === 0) return;

      const chatTitle = `Chat Reference - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const chatMarkdownContent = `# Chat Reference Log 💕\n*Created on ${new Date().toLocaleString()} during study session by ${currentUser || 'User'}*\n\n---\n\n` + 
        chatMessages.map(msg => `**${msg.sender}** _(${msg.timestamp})_:\n${msg.text}`).join('\n\n');

      const chatNotebookId = `notebook-chat-${Date.now()}`;
      const chatCells: Cell[] = [
        {
          id: `cell-${Date.now()}-chat`,
          type: 'markdown',
          language: 'markdown',
          content: chatMarkdownContent
        }
      ];

      const chatNotebook: Notebook = {
        id: chatNotebookId,
        title: chatTitle,
        icon: '💬',
        language: 'python_notebook',
        created: new Date().toISOString().replace('T', ' ').substring(0, 19),
        lastUpdated: 'Just now',
        cells: chatCells
      };

      try {
        // 1. Save notebook metadata and cells to DB
        await saveNotebookToDB(chatNotebookId, chatTitle, roomId, 'python_notebook', '💬');
        await saveCellsToDB(chatNotebookId, chatCells, chatTitle);
        
        // 2. Append new notebook to list and update state
        const updatedNotebooks = [...notebooks, chatNotebook];
        set({ notebooks: updatedNotebooks });

        // 3. Save notebooks list in bulk to database
        await fetch('/api/notebooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notebooks: updatedNotebooks })
        });

        // 4. Clear chat in DB
        await fetch('/api/chat', { method: 'DELETE' });

        // 5. Clear chat in local state
        set({ chatMessages: [] });
      } catch (e) {
        console.warn('Failed to archive chat:', e);
      }
    },
    
    toggleStudyTimer: () => set((state) => ({ studyTimerActive: !state.studyTimerActive })),
    
    incrementStudyTimer: () => {
      const nextTime = get().studyTimeElapsed + 1;
      set({ studyTimeElapsed: nextTime });
      if (nextTime % 5 === 0) {
        get().syncRoomState({ studyTimeElapsed: nextTime });
      }
    },
    
    resetStudyTimer: () => set({ studyTimeElapsed: 0 }),
    
    startPomodoro: () => set((state) => ({
      pomodoro: { ...state.pomodoro, isRunning: true }
    })),
    
    pausePomodoro: () => set((state) => ({
      pomodoro: { ...state.pomodoro, isRunning: false }
    })),
    
    resetPomodoro: () => set((state) => ({
      pomodoro: {
        ...state.pomodoro,
        timeLeft: state.pomodoro.mode === 'work' ? state.pomodoro.workDuration : (state.pomodoro.mode === 'shortBreak' ? state.pomodoro.shortBreakDuration : state.pomodoro.longBreakDuration),
        isRunning: false
      }
    })),
    
    tickPomodoro: () => {
      const { pomodoro } = get();
      const { timeLeft, isRunning, mode, workDuration, shortBreakDuration, longBreakDuration, cycleCompleted } = pomodoro;
      if (!isRunning) return;
      
      if (timeLeft <= 1) {
        // Completed current cycle
        let nextMode: 'work' | 'shortBreak' | 'longBreak' = 'work';
        let nextTime = workDuration;
        let nextCycles = cycleCompleted;
        
        if (mode === 'work') {
          if (cycleCompleted % 4 === 3) {
            nextMode = 'longBreak';
            nextTime = longBreakDuration;
          } else {
            nextMode = 'shortBreak';
            nextTime = shortBreakDuration;
          }
          nextCycles += 1;
          
          // Reward 5 hearts for completed work cycle
          get().incrementHearts(5);
          get().logActivity('Completed 25 min Pomodoro block', 'Pomodoro Timer');
        } else {
          nextMode = 'work';
          nextTime = workDuration;
        }
        
        set({
          pomodoro: {
            ...pomodoro,
            mode: nextMode,
            timeLeft: nextTime,
            isRunning: false,
            cycleCompleted: nextCycles
          }
        });
      } else {
        set({
          pomodoro: {
            ...pomodoro,
            timeLeft: timeLeft - 1
          }
        });
      }
    },
    
    setPomodoroMode: (mode) => set((state) => {
      let timeLeft = state.pomodoro.workDuration;
      if (mode === 'shortBreak') timeLeft = state.pomodoro.shortBreakDuration;
      if (mode === 'longBreak') timeLeft = state.pomodoro.longBreakDuration;
      
      return {
        pomodoro: {
          ...state.pomodoro,
          mode,
          timeLeft,
          isRunning: false
        }
      };
    }),
    
    setMood: (mood) => {
      set({ currentMood: mood });
      get().syncRoomState({ currentMood: mood });
    },
    
    incrementHearts: (count = 1) => {
      const currentHearts = get().streak.hearts;
      const currentDays = get().streak.days;
      const newHearts = currentHearts + count;
      const dailyTargetMet = newHearts >= 40;
      const previouslyMet = currentHearts >= 40;
      const newDays = dailyTargetMet && !previouslyMet ? currentDays + 1 : currentDays;
      const goalProgress = Math.min(100, Math.round((newHearts / 40) * 100));
      
      set((state) => ({
        heartReactionCount: state.heartReactionCount + count,
        streak: {
          days: newDays,
          hearts: newHearts,
          goalProgress
        }
      }));
      
      get().syncRoomState({
        heartReactionCount: get().heartReactionCount,
        streakDays: newDays,
        streakHearts: newHearts,
        streakGoalProgress: goalProgress
      });
    },

    loadNotebooksList: async () => {
      try {
        const res = await fetch('/api/notebooks');
        if (res.ok) {
          const { notebooks } = await res.json();
          if (notebooks && notebooks.length > 0) {
            const parsedNotebooks = notebooks.map((nb: any) => ({
              id: nb.id,
              title: nb.title,
              icon: nb.icon || '❤️',
              language: nb.language || 'python_notebook',
              created: nb.createdAt || new Date().toISOString(),
              lastUpdated: 'Just now',
              cells: nb.cells || []
            }));
            
            set({
              notebooks: parsedNotebooks,
              recentFiles: parsedNotebooks.map((n: any) => ({ name: n.title + getNotebookExtension(n.language), type: 'notebook' as 'notebook' | 'markdown' })).concat([{ name: 'Shared_Notes.md', type: 'markdown' as 'notebook' | 'markdown' }])
            });
            
            const activeId = get().activeNotebookId;
            if (!activeId || !parsedNotebooks.find((n: any) => n.id === activeId)) {
              set({ activeNotebookId: parsedNotebooks[0].id });
            }
          } else {
            // Seed the database with initial notebooks
            await fetch('/api/notebooks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notebooks: initialNotebooks })
            });
            set({
              notebooks: initialNotebooks,
              activeNotebookId: initialNotebooks[0].id,
              recentFiles: initialNotebooks.map((n: any) => ({ name: n.title + getNotebookExtension(n.language), type: 'notebook' as 'notebook' | 'markdown' })).concat([{ name: 'Shared_Notes.md', type: 'markdown' as 'notebook' | 'markdown' }])
            });
          }
        }
      } catch (e) {
        console.warn('Failed to load notebooks list:', e);
      }
    },

    syncRoomState: async (updateData?: any) => {
      const { roomId } = get();
      try {
        if (updateData) {
          const res = await fetch('/api/room-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, ...updateData })
          });
          if (res.ok) {
            const { state } = await res.json();
            if (state) {
              set({
                streak: {
                  days: state.streakDays,
                  hearts: state.streakHearts,
                  goalProgress: state.streakGoalProgress
                },
                studyTimeElapsed: state.studyTimeElapsed,
                heartReactionCount: state.heartReactionCount,
                currentMood: state.currentMood
              });
            }
          }
        } else {
          const res = await fetch(`/api/room-state?roomId=${roomId}`);
          if (res.ok) {
            const { state } = await res.json();
            if (state) {
              set({
                streak: {
                  days: state.streakDays,
                  hearts: state.streakHearts,
                  goalProgress: state.streakGoalProgress
                },
                studyTimeElapsed: state.studyTimeElapsed,
                heartReactionCount: state.heartReactionCount,
                currentMood: state.currentMood
              });
            }
          }
        }
      } catch (e) {
        console.warn('Failed to sync room state:', e);
      }
    },

    logActivity: async (action: string, notebookTitle: string) => {
      const { currentUser } = get();
      try {
        await fetch('/api/collaboration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: currentUser,
            action,
            notebook: notebookTitle
          })
        });
      } catch (e) {
        console.warn('Failed to log activity:', e);
      }
    },
    
    updateAnanyaCursor: (cellId, line, col) => set({
      ananyaCursor: { cellId, lineNumber: line, column: col }
    }),

    logout: async () => {
      // 1. Archive & clear chat
      await get().archiveChat();

      const { notebooks, roomId, sharedNotes } = get();

      // 2. Save all notebooks in the room to the DB
      try {
        const res = await fetch('/api/notebooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notebooks })
        });
        if (!res.ok) {
          console.warn('Failed to bulk save notebooks on logout');
        }
      } catch (e) {
        console.warn('Error saving notebooks on logout:', e);
      }

      // 3. Save shared notes
      try {
        await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notesContent: sharedNotes })
        });
      } catch (e) {
        console.warn('Failed to save shared notes on logout:', e);
      }

      // 4. Save room state
      try {
        const { streak, studyTimeElapsed, heartReactionCount, currentMood } = get();
        await fetch('/api/room-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            streakDays: streak.days,
            streakHearts: streak.hearts,
            streakGoalProgress: streak.goalProgress,
            studyTimeElapsed,
            heartReactionCount,
            currentMood
          })
        });
      } catch (e) {
        console.warn('Failed to save room state on logout:', e);
      }

      // 5. Clear the user and redirect to Auth view
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('love_study_username');
      }
      
      set({
        currentUser: '',
        onlineUsers: [],
        currentView: 'auth'
      });
    }
  };
});
