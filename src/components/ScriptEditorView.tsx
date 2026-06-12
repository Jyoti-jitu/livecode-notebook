'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useLoveStudyStore } from '@/store/useLoveStudyStore';
import { Play, Terminal, Trash2, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((m) => m.default),
  { ssr: false }
);

export default function ScriptEditorView() {
  const store = useLoveStudyStore();
  const activeNotebook = store.notebooks.find((n) => n.id === store.activeNotebookId);
  const cell = activeNotebook?.cells[0];
  const [editorContent, setEditorContent] = useState(cell?.content || '');
  const [editorTheme, setEditorTheme] = useState('vs-light');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const wasRunningRef = useRef(false);
  const runScriptRef = useRef<() => void>(() => {});

  useEffect(() => { if (cell) setEditorContent(cell.content); }, [cell?.content]);
  useEffect(() => { setEditorTheme(store.theme === 'light' ? 'vs-light' : 'vs-dark'); }, [store.theme]);
  useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [terminalLogs]);

  useEffect(() => {
    if (cell && cell.output) {
      let runOutput = '';
      const out = cell.output;
      if (typeof out === 'object') {
        if ('type' in out && out.type === 'error') {
          runOutput = `[Error]\n${out.text || 'An execution error occurred.'}`;
        } else {
          runOutput = JSON.stringify(out);
        }
      } else {
        runOutput = out || '';
      }
      const prompt = `lovestudy-terminal$ ${activeNotebook?.language || 'python'} ${activeNotebook?.title.toLowerCase().replace(/\s+/g, '_') || 'script'}`;
      setTerminalLogs([prompt, runOutput, `Exit code: 0`]);
    } else {
      setTerminalLogs([]);
    }
  }, [store.activeNotebookId]);

  useEffect(() => {
    if (cell) {
      if (cell.isRunning) {
        wasRunningRef.current = true;
      } else if (wasRunningRef.current) {
        wasRunningRef.current = false;
        let runOutput = '';
        const out = cell.output;
        if (out) {
          if (typeof out === 'object') {
            if ('type' in out && out.type === 'error') {
              runOutput = `[Error]\n${out.text || 'An execution error occurred.'}`;
            } else {
              runOutput = JSON.stringify(out);
            }
          } else {
            runOutput = out || '';
          }
        }
        const newPrompt = `lovestudy-terminal$ ${activeNotebook?.language || 'python'} ${activeNotebook?.title.toLowerCase().replace(/\s+/g, '_') || 'script'}`;
        setTerminalLogs((prev) => [...prev, newPrompt, runOutput, `Exit code: 0`]);
      }
    }
  }, [cell?.isRunning, cell?.output, activeNotebook?.language, activeNotebook?.title]);

  if (!activeNotebook || !cell) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-rose-400">
        <AlertTriangle className="w-12 h-12 stroke-[1.5] mb-2" /><span className="text-xs font-semibold">No script file currently loaded.</span>
      </div>
    );
  }

  const handleRunScript = async () => {
    if (typeof window !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setTerminalLogs((prev) => [...prev, `[Running] executing ${activeNotebook.title}...`]);
    await store.runCell(activeNotebook.id, cell.id);
  };

  useEffect(() => {
    runScriptRef.current = handleRunScript;
  });

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => { runScriptRef.current(); });
    editor.addCommand(monaco.KeyMod.Ctrl | monaco.KeyCode.Enter, () => { runScriptRef.current(); });

    import('@/lib/yjs').then(({ getOrCreateYjsDoc, getOrCreateWebsocketProvider }) => {
      import('y-monaco').then(({ MonacoBinding }) => {
        const ydoc = getOrCreateYjsDoc(activeNotebook.id);
        const provider = getOrCreateWebsocketProvider(store.roomId, ydoc);
        const ytext = ydoc.getText(cell.id);
        if (ytext.toString() === '' && cell.content) ytext.insert(0, cell.content);

        new MonacoBinding(ytext, editor.getModel(), new Set([editor]), provider.awareness);
        ytext.observe(() => {
          const val = ytext.toString();
          setEditorContent(val);
          store.updateCellContent(activeNotebook.id, cell.id, val);
        });
      });
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white/40 dark:bg-love-dark-bg/20">
      <div className="h-12 border-b border-rose-100/40 dark:border-rose-950/20 px-4 flex items-center justify-between bg-white/70 dark:bg-love-dark/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-love-primary/10 text-love-primary font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">{activeNotebook.language}</span>
          <span className="text-xs font-semibold text-rose-500/80 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span>Collab active</span></span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTerminalLogs([])} className="p-1.5 hover:bg-rose-100/40 rounded-lg text-rose-400 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
          <button onClick={handleRunScript} disabled={cell.isRunning} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-gradient-to-r from-love-primary to-love-secondary hover:from-love-secondary hover:to-love-primary disabled:opacity-50 text-white rounded-xl shadow-md transition-all cursor-pointer">
            {cell.isRunning ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Running...</span></> : <><Play className="w-3.5 h-3.5 fill-current" /><span>Run Code</span></>}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-[6.5] min-h-[300px] border-r border-rose-100/30 flex flex-col relative">
          <MonacoEditor height="100%" language={activeNotebook.language} value={editorContent} theme={editorTheme} onChange={(val) => { if (val !== undefined) { setEditorContent(val); store.updateCellContent(activeNotebook.id, cell.id, val); } }} onMount={handleEditorDidMount} options={{ minimap: { enabled: false }, fontSize: 13, fontFamily: 'Fira Code, monospace', automaticLayout: true }} />
        </div>
        <div className="flex-[3.5] bg-neutral-950 text-neutral-200 flex flex-col font-mono text-xs overflow-hidden">
          <div className="h-9 bg-neutral-900 border-b border-neutral-800 px-4 flex items-center justify-between text-neutral-400 flex-shrink-0">
            <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider"><Terminal className="w-3.5 h-3.5 text-love-primary" /><span>Shell Console Output</span></span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {terminalLogs.length === 0 ? <div className="text-neutral-500 italic text-[11px]">Terminal idle. Click "Run Code" or press Shift+Enter.</div> : terminalLogs.map((log, idx) => {
              const isPrompt = log.startsWith('lovestudy-terminal$');
              const isError = log.includes('[Error]');
              return <div key={idx} className={`whitespace-pre-wrap leading-relaxed ${isPrompt ? 'text-emerald-400 font-bold' : isError ? 'text-rose-500 font-bold' : 'text-neutral-300'}`}>{log}</div>;
            })}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
