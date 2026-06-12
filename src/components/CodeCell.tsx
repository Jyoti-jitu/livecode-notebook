'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useLoveStudyStore, Cell } from '@/store/useLoveStudyStore';
import { Play, Copy, Trash2, ArrowUp, ArrowDown, ChevronRight, RefreshCw, AlertCircle, CopyCheck, Heart, ClipboardCopy, ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';

// Load Monaco Editor dynamically to bypass Next SSR errors
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((m) => m.default),
  { ssr: false }
);

interface CodeCellProps {
  cell: Cell;
  index: number;
}

export default function CodeCell({ cell, index }: CodeCellProps) {
  const store = useLoveStudyStore();
  const [editorContent, setEditorContent] = useState(cell.content);
  const [editorTheme, setEditorTheme] = useState('vs-light');
  const [outputCopied, setOutputCopied] = useState(false);
  const [editorHeight, setEditorHeight] = useState(80);

  // Keep state in sync with store
  useEffect(() => {
    setEditorContent(cell.content);
  }, [cell.content]);

  // Handle dark mode theme change for Monaco
  useEffect(() => {
    setEditorTheme(store.theme === 'light' ? 'vs-light' : 'vs-dark');
  }, [store.theme]);

  const handleRun = () => {
    if (typeof window !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    store.runCell(store.activeNotebookId, cell.id);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorContent(value);
      store.updateCellContent(store.activeNotebookId, cell.id, value);
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    // Add Keyboard shortcuts
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      handleRun();
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun();
    });

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.Enter, () => {
      handleRun();
      const active = store.notebooks.find(n => n.id === store.activeNotebookId);
      if (active) {
        const idx = active.cells.findIndex(c => c.id === cell.id);
        store.addCell(store.activeNotebookId, 'code', idx);
      }
    });

    // Content-based auto resize
    const updateHeight = () => {
      const contentHeight = editor.getContentHeight();
      setEditorHeight(Math.max(80, contentHeight));
      requestAnimationFrame(() => {
        editor.layout();
      });
    };
    editor.onDidContentSizeChange(updateHeight);
    setTimeout(updateHeight, 100);

    // Synchronize Yjs collaboration and cursor presence
    import('@/lib/yjs').then(({ getOrCreateYjsDoc, getOrCreateWebsocketProvider }) => {
      import('y-monaco').then(({ MonacoBinding }) => {
        const ydoc = getOrCreateYjsDoc(store.activeNotebookId);
        const provider = getOrCreateWebsocketProvider(store.roomId, ydoc);
        const ytext = ydoc.getText(cell.id);

        let hasInitialized = false;
        const initializeText = () => {
          if (hasInitialized) return;
          if (ytext.toString() === '' && cell.content) {
            ytext.insert(0, cell.content);
          }
          hasInitialized = true;
        };

        if (provider.synced) {
          initializeText();
        } else {
          const syncHandler = () => {
            initializeText();
            provider.off('sync', syncHandler);
          };
          provider.on('sync', syncHandler);
        }

        const binding = new MonacoBinding(
          ytext,
          editor.getModel(),
          new Set([editor]),
          provider.awareness
        );

        ytext.observe(() => {
          const val = ytext.toString();
          const currentState = useLoveStudyStore.getState();
          const activeNotebook = currentState.notebooks.find(n => n.id === store.activeNotebookId);
          const currentCell = activeNotebook?.cells.find(c => c.id === cell.id);
          if (currentCell && currentCell.content !== val) {
            setEditorContent(val);
            currentState.updateCellContent(store.activeNotebookId, cell.id, val);
          }
        });

        // Sync local typing presence
        editor.onDidChangeModelContent(() => {
          provider.awareness.setLocalStateField('typing', true);
        });
      });
    });
  };

  const isAnanyaHere = store.ananyaCursor.cellId === cell.id;

  return (
    <div className="group relative border border-rose-100/40 dark:border-rose-950/20 rounded-2xl bg-white/60 dark:bg-love-dark/25 p-3 space-y-2 transition-all duration-300 hover:shadow-md hover:shadow-rose-100/20 dark:hover:shadow-none hover:border-love-primary/30">
      
      {/* Collaborator Cursor Labels (Simulated overlays) */}
      {isAnanyaHere && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute z-20 pointer-events-none flex flex-col items-start"
          style={{
            top: `${50 + store.ananyaCursor.lineNumber * 10}px`,
            left: `${120 + store.ananyaCursor.column * 6}px`
          }}
        >
          {/* Arrow */}
          <div className="w-2 h-2 bg-love-primary rotate-45 -mb-0.5 ml-1" />
          {/* Tag */}
          <span className="text-[10px] font-bold text-white bg-love-primary px-2 py-0.5 rounded-md shadow-lg flex items-center gap-0.5 leading-none whitespace-nowrap">
            Ananya 💕
          </span>
        </motion.div>
      )}

      {/* Jitu's simulated local cursor pointer */}
      {index === 1 && (
        <div
          className="absolute z-20 pointer-events-none flex flex-col items-start opacity-70"
          style={{ top: '150px', left: '380px' }}
        >
          <div className="w-2 h-2 bg-love-lavender rotate-45 -mb-0.5 ml-1" />
          <span className="text-[10px] font-bold text-white bg-love-lavender px-2 py-0.5 rounded-md shadow-lg flex items-center gap-0.5 leading-none whitespace-nowrap">
            You 💜
          </span>
        </div>
      )}

      {/* Left side execution count flag */}
      <div className="absolute left-0 top-4 -translate-x-3/4 flex flex-col items-center">
        <span className="text-[10px] font-bold text-rose-400 dark:text-rose-500 bg-rose-50 dark:bg-love-dark px-1.5 py-0.5 rounded-md">
          [{index + 1}]
        </span>
      </div>

      {/* Header cell action toolbar */}
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-rose-300 dark:text-rose-600">
            Code Cell
          </span>
          <span className="text-[9px] bg-rose-500/10 text-love-primary font-bold border border-rose-100/30 dark:border-rose-950/10 rounded px-1.5 py-0.5 uppercase tracking-wider">
            {(cell.language || 'python').toUpperCase()}
          </span>
        </div>

        {/* Hover toolbar */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/80 dark:bg-love-dark border border-rose-100/40 dark:border-rose-950/20 px-1.5 py-0.5 rounded-lg shadow-sm">
          <button
            onClick={handleRun}
            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded text-rose-500/80 hover:text-love-primary cursor-pointer"
            title="Run Code"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
          <button
            onClick={() => store.duplicateCell(store.activeNotebookId, cell.id)}
            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded text-rose-500/80 hover:text-love-primary cursor-pointer"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => store.moveCell(store.activeNotebookId, cell.id, 'up')}
            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded text-rose-500/80 hover:text-love-primary cursor-pointer"
            title="Move Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => store.moveCell(store.activeNotebookId, cell.id, 'down')}
            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded text-rose-500/80 hover:text-love-primary cursor-pointer"
            title="Move Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => store.deleteCell(store.activeNotebookId, cell.id)}
            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded text-rose-500/80 hover:text-love-primary cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor area wrapper */}
      <div className="relative border border-rose-100/40 dark:border-rose-900/40 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-neutral-900 min-h-[100px]">
        {/* Run Button embedded in editor toolbar */}
        <div className="absolute right-3 top-3 z-10 flex gap-1">
          <button
            onClick={handleRun}
            disabled={cell.isRunning}
            className="flex items-center gap-1 px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer disabled:bg-rose-300"
          >
            {cell.isRunning ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
            <span>Run</span>
          </button>
        </div>

        {/* Dynamic Monaco instance */}
        <div className="py-1">
          <MonacoEditor
            height={`${editorHeight}px`}
            language={cell.language || 'python'}
            theme={editorTheme}
            value={editorContent}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              lineNumbers: 'on',
              automaticLayout: true,
              tabSize: 4,
              padding: { top: 8, bottom: 8 }
            }}
          />
        </div>
      </div>

      {/* Output Console area */}
      {cell.output && (
        <div className="border border-rose-100/35 dark:border-rose-950/25 rounded-xl overflow-hidden bg-rose-50/20 dark:bg-love-dark-bg/25">
          {/* Header console title bar */}
          <div className="px-3 py-1.5 bg-rose-50/50 dark:bg-love-dark-bg/40 border-b border-rose-100/35 dark:border-rose-950/25 flex items-center justify-between text-[10px] text-rose-400 dark:text-rose-500 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-love-primary" />
              Console Output
            </span>
            <div className="flex items-center gap-2">
              {typeof cell.output === 'object' && cell.output.type === 'error' ? (
                <span className="text-rose-500">Error</span>
              ) : (
                <span className="text-emerald-500">Success</span>
              )}
              {/* Copy output button */}
              {typeof cell.output === 'string' && (
                <button
                  onClick={() => {
                    const text = typeof cell.output === 'string' ? cell.output : '';
                    navigator.clipboard.writeText(text).then(() => {
                      setOutputCopied(true);
                      setTimeout(() => setOutputCopied(false), 2000);
                    });
                  }}
                  title="Copy output"
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-love-primary transition-colors cursor-pointer"
                >
                  {outputCopied ? (
                    <ClipboardCheck className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <ClipboardCopy className="w-3 h-3" />
                  )}
                  <span>{outputCopied ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-3 text-xs font-mono text-rose-900 dark:text-rose-100 whitespace-pre-wrap overflow-x-auto">
            {/* Standard Text Console output */}
            {typeof cell.output === 'string' && cell.output}

            {/* Error console output */}
            {typeof cell.output === 'object' && cell.output.type === 'error' && (
              <div className="flex items-start gap-1.5 text-rose-500">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{cell.output.text}</span>
              </div>
            )}

            {/* Pandas DataFrame rendered as a romantic interactive table! */}
            {typeof cell.output === 'object' && cell.output.type === 'table' && (
              <div className="overflow-x-auto py-1 relative group">
                <table className="w-full border-collapse border border-rose-100 dark:border-rose-950/40 rounded-xl text-left bg-white dark:bg-love-dark-bg">
                  <thead>
                    <tr className="bg-love-light/40 dark:bg-love-primary/20 border-b border-rose-100 dark:border-rose-950/30">
                      {cell.output.headers.map((h, i) => (
                        <th key={i} className="p-2 text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider border-r border-rose-100/50 last:border-0">
                          {h || ' '}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cell.output.rows.map((row, idx) => (
                      <tr key={idx} className="border-b border-rose-100/30 dark:border-rose-950/15 last:border-0 hover:bg-rose-50/30 dark:hover:bg-rose-900/10">
                        {row.map((val: any, valIdx: number) => (
                          <td key={valIdx} className="p-2 border-r border-rose-100/35 last:border-0 font-medium">
                            {valIdx === 1 ? (
                              <span className="flex items-center gap-1 text-rose-800 dark:text-rose-100">
                                <span>{val}</span>
                                {val === 'Jitu' && <span className="text-[10px]">💜</span>}
                                {val === 'Ananya' && <span className="text-[10px]">💕</span>}
                                {val === 'Together' && <span className="text-[10px]">💖</span>}
                              </span>
                            ) : valIdx === 2 ? (
                              <span className="flex items-center gap-1 text-love-primary font-bold">
                                <span>{val}</span>
                                <Heart className="w-2.5 h-2.5 fill-current animate-pulse text-love-primary" />
                              </span>
                            ) : (
                              <span className="text-rose-400/80">{val}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Floating hearts inside Pandas box */}
                <div className="absolute right-4 bottom-1 pointer-events-none opacity-40 flex gap-0.5">
                  <span className="text-[10px] animate-bounce">💖</span>
                  <span className="text-[12px] animate-bounce" style={{ animationDelay: '200ms' }}>💜</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
