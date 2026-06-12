'use client';

import React, { useState, useRef } from 'react';
import { useLoveStudyStore } from '@/store/useLoveStudyStore';
import { Code, FileText, Play, RotateCcw, Octagon, Save, Download, Check, FileUp, Undo, Redo } from 'lucide-react';

export default function Toolbar() {
  const store = useLoveStudyStore();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddCode = () => {
    store.addCell(store.activeNotebookId, 'code');
  };

  const handleAddMarkdown = () => {
    store.addCell(store.activeNotebookId, 'markdown');
  };

  const handleRunAll = () => {
    store.runAllCells(store.activeNotebookId);
  };

  const handleRestart = () => {
    store.restartKernel(store.activeNotebookId);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    if (store.saveActiveNotebook) {
      await store.saveActiveNotebook();
    }
    setTimeout(() => {
      setSaveStatus('saved');
    }, 800);
  };

  // Upload file to Pyodide session VFS
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (store.uploadFile) {
        store.uploadFile(file.name, content);
        alert(`File "${file.name}" uploaded to notebook session! You can access it with pd.read_csv("${file.name}"). 📂`);
      }
    };
    reader.readAsText(file);
  };

  // Exporters
  const handleExportJupyter = () => {
    const notebook = store.notebooks.find(n => n.id === store.activeNotebookId);
    if (!notebook) return;
    const ipynb = {
      cells: notebook.cells.map(c => ({
        cell_type: c.type === 'markdown' ? 'markdown' : 'code',
        metadata: {},
        source: c.content.split('\n').map(line => line + '\n'),
        outputs: c.output ? [{
          output_type: "stream",
          name: "stdout",
          text: [typeof c.output === 'object' ? JSON.stringify(c.output) : c.output]
        }] : [],
        execution_count: c.executionCount || null
      })),
      metadata: {
        kernelspec: {
          display_name: "Python 3",
          language: "python",
          name: "python3"
        }
      },
      nbformat: 4,
      nbformat_minor: 2
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ipynb, null, 2));
    triggerDownload(`${notebook.title.replace(/\s+/g, '_')}.ipynb`, dataStr);
    setShowExportMenu(false);
  };

  const handleExportMarkdown = () => {
    const notebook = store.notebooks.find(n => n.id === store.activeNotebookId);
    if (!notebook) return;
    const md = notebook.cells.map(c => {
      if (c.type === 'markdown') {
        return c.content;
      } else {
        return `\`\`\`python\n${c.content}\n\`\`\`\n\n${c.output ? `*Output:*\n\`\`\`\n${typeof c.output === 'object' ? JSON.stringify(c.output) : c.output}\n\`\`\`` : ''}`;
      }
    }).join('\n\n');
    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
    triggerDownload(`${notebook.title.replace(/\s+/g, '_')}.md`, dataStr);
    setShowExportMenu(false);
  };

  const handleExportHTML = () => {
    const notebook = store.notebooks.find(n => n.id === store.activeNotebookId);
    if (!notebook) return;
    const htmlContent = `
      <html>
        <head>
          <title>${notebook.title}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; background: #fafafa; }
            h1 { color: #rose-800; border-bottom: 2px solid #FF5C93; padding-bottom: 10px; }
            pre { background: #f1f5f9; padding: 15px; border-radius: 8px; overflow-x: auto; border: 1px solid #e2e8f0; }
            .cell { margin-bottom: 30px; background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .output { border-left: 4px solid #FF5C93; padding-left: 15px; color: #334155; margin-top: 10px; background: #fff1f2; padding: 10px; border-radius: 6px; }
          </style>
        </head>
        <body>
          <h1>${notebook.title}</h1>
          ${notebook.cells.map(c => `
            <div class="cell">
              ${c.type === 'markdown' 
                ? `<div>${c.content}</div>` 
                : `<pre><code>${c.content}</code></pre>
                   ${c.output ? `<div class="output"><pre>${typeof c.output === 'object' ? JSON.stringify(c.output, null, 2) : c.output}</pre></div>` : ''}`
              }
            </div>
          `).join('')}
        </body>
      </html>
    `;
    const dataStr = "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent);
    triggerDownload(`${notebook.title.replace(/\s+/g, '_')}.html`, dataStr);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    window.print();
    setShowExportMenu(false);
  };

  const triggerDownload = (filename: string, href: string) => {
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", href);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="px-6 py-3 border-b border-rose-100/30 dark:border-rose-950/10 flex items-center justify-between bg-white/35 dark:bg-love-dark-bg/25 backdrop-blur-md z-10 flex-shrink-0 relative">
      {/* 1. Editor actions */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={handleAddCode}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-200 bg-white/80 dark:bg-love-dark border border-rose-100 dark:border-rose-900/40 rounded-xl hover:bg-love-light/40 dark:hover:bg-rose-950/20 hover:text-love-primary cursor-pointer transition-all duration-200"
        >
          <Code className="w-3.5 h-3.5 text-love-primary" />
          <span>+ Code</span>
        </button>

        <button
          onClick={handleAddMarkdown}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-200 bg-white/80 dark:bg-love-dark border border-rose-100 dark:border-rose-900/40 rounded-xl hover:bg-love-light/40 dark:hover:bg-rose-950/20 hover:text-love-primary cursor-pointer transition-all duration-200"
        >
          <FileText className="w-3.5 h-3.5 text-love-primary" />
          <span>+ Markdown</span>
        </button>

        <div className="h-4 w-px bg-rose-200/50 dark:bg-rose-800/30 mx-1" />

        <button
          onClick={handleRunAll}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-200 bg-white/80 dark:bg-love-dark border border-rose-100 dark:border-rose-900/40 rounded-xl hover:bg-love-light/40 dark:hover:bg-rose-950/20 hover:text-love-primary cursor-pointer transition-all duration-200"
        >
          <Play className="w-3.5 h-3.5 text-love-primary fill-love-primary" />
          <span>Run All</span>
        </button>

        <button
          onClick={handleRestart}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-200 bg-white/80 dark:bg-love-dark border border-rose-100 dark:border-rose-900/40 rounded-xl hover:bg-love-light/40 dark:hover:bg-rose-950/20 hover:text-love-primary cursor-pointer transition-all duration-200"
        >
          <RotateCcw className="w-3.5 h-3.5 text-love-primary" />
          <span>Restart</span>
        </button>

        <button
          onClick={handleRestart}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-200 bg-white/80 dark:bg-love-dark border border-rose-100 dark:border-rose-900/40 rounded-xl hover:bg-love-light/40 dark:hover:bg-rose-950/20 hover:text-love-primary cursor-pointer transition-all duration-200"
        >
          <Octagon className="w-3.5 h-3.5 text-rose-400" />
          <span>Interrupt</span>
        </button>
      </div>

      {/* 2. File Uploads, Undo, Redo, Save, Exports */}
      <div className="flex items-center gap-3">
        {/* Undo / Redo */}
        <button
          onClick={() => store.undo && store.undo()}
          disabled={!store.undoStack || store.undoStack.length === 0}
          className="p-1.5 bg-white/80 dark:bg-love-dark border border-rose-100 dark:border-rose-900/40 rounded-lg text-rose-700 dark:text-rose-200 hover:text-love-primary cursor-pointer disabled:opacity-40"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => store.redo && store.redo()}
          disabled={!store.redoStack || store.redoStack.length === 0}
          className="p-1.5 bg-white/80 dark:bg-love-dark border border-rose-100 dark:border-rose-900/40 rounded-lg text-rose-700 dark:text-rose-200 hover:text-love-primary cursor-pointer disabled:opacity-40"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-rose-200/50 dark:bg-rose-800/30 mx-1" />

        {/* File Upload Hidden input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.json,.xlsx"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-200 bg-white/80 dark:bg-love-dark border border-rose-100 dark:border-rose-900/40 rounded-xl hover:bg-love-light/40 dark:hover:bg-rose-950/20 hover:text-love-primary cursor-pointer transition-all duration-200"
          title="Upload dataset (.csv, .json, .xlsx)"
        >
          <FileUp className="w-3.5 h-3.5 text-rose-500" />
          <span>Upload File</span>
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-200 bg-white/80 dark:bg-love-dark border border-rose-100 dark:border-rose-900/40 rounded-xl hover:bg-love-light/40 dark:hover:bg-rose-950/20 hover:text-love-primary cursor-pointer transition-all duration-200"
        >
          <Save className="w-3.5 h-3.5 text-love-primary" />
          <span>Save</span>
        </button>

        {/* Export Dropdown Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-200 bg-white/80 dark:bg-love-dark border border-rose-100 dark:border-rose-900/40 rounded-xl hover:bg-love-light/40 dark:hover:bg-rose-950/20 hover:text-love-primary cursor-pointer transition-all duration-200"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span>Export</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-love-dark border border-rose-100 dark:border-rose-950 rounded-2xl shadow-xl z-20 py-2">
              <button
                onClick={handleExportJupyter}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/25"
              >
                Jupyter Notebook (.ipynb)
              </button>
              <button
                onClick={handleExportMarkdown}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/25"
              >
                Markdown (.md)
              </button>
              <button
                onClick={handleExportHTML}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/25"
              >
                HTML Document (.html)
              </button>
              <button
                onClick={handleExportPDF}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/25"
              >
                PDF Document (Print)
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-rose-200/50 dark:bg-rose-800/30 mx-1" />

        {/* Status Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl">
          <Check className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {saveStatus === 'saved' ? 'Saved' : 'Saving...'}
          </span>
        </div>
      </div>
    </div>
  );
}
