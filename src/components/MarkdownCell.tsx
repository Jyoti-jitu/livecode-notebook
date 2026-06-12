'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLoveStudyStore, Cell } from '@/store/useLoveStudyStore';
import { Copy, Trash2, ArrowUp, ArrowDown, Eye, Edit, Check } from 'lucide-react';

interface MarkdownCellProps { cell: Cell; index: number; }

export default function MarkdownCell({ cell, index }: MarkdownCellProps) {
  const store = useLoveStudyStore();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(cell.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setContent(cell.content); }, [cell.content]);
  useEffect(() => { if (isEditing && textareaRef.current) textareaRef.current.focus(); }, [isEditing]);

  const handleSave = () => { store.updateCellContent(store.activeNotebookId, cell.id, content); setIsEditing(false); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSave(); } };

  return (
    <div className="group relative border border-rose-100/35 dark:border-rose-950/10 rounded-2xl bg-white/45 dark:bg-love-dark/20 p-4 transition-all hover:shadow-md hover:border-love-primary/30">
      <div className="absolute left-0 top-4 -translate-x-3/4">
        <span className="text-[10px] font-bold text-love-primary/70 bg-love-light/60 dark:bg-rose-950/35 px-1.5 py-0.5 rounded-md">M↓</span>
      </div>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-bold text-rose-300 dark:text-rose-600">Markdown Cell</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/80 dark:bg-love-dark border border-rose-100/40 px-1.5 py-0.5 rounded-lg shadow-sm">
          <button onClick={() => setIsEditing(!isEditing)} className="p-1 hover:bg-rose-50 rounded text-rose-500/80 hover:text-love-primary cursor-pointer" title={isEditing ? 'Preview' : 'Edit'}>{isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}</button>
          <button onClick={() => store.duplicateCell(store.activeNotebookId, cell.id)} className="p-1 hover:bg-rose-50 rounded text-rose-500/80 hover:text-love-primary cursor-pointer"><Copy className="w-3.5 h-3.5" /></button>
          <button onClick={() => store.moveCell(store.activeNotebookId, cell.id, 'up')} className="p-1 hover:bg-rose-50 rounded text-rose-500/80 hover:text-love-primary cursor-pointer"><ArrowUp className="w-3.5 h-3.5" /></button>
          <button onClick={() => store.moveCell(store.activeNotebookId, cell.id, 'down')} className="p-1 hover:bg-rose-50 rounded text-rose-500/80 hover:text-love-primary cursor-pointer"><ArrowDown className="w-3.5 h-3.5" /></button>
          <button onClick={() => store.deleteCell(store.activeNotebookId, cell.id)} className="p-1 hover:bg-rose-50 rounded text-rose-500/80 hover:text-love-primary cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {isEditing ? (
        <div className="space-y-2">
          <textarea ref={textareaRef} value={content} onChange={(e) => setContent(e.target.value)} onKeyDown={handleKeyDown} onBlur={handleSave} placeholder="Write markdown here..." className="w-full min-h-[120px] p-3 text-sm text-rose-800 dark:text-rose-100 bg-rose-50/25 dark:bg-love-dark-bg/40 border border-rose-100 dark:border-rose-950/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-love-primary/40 font-mono resize-y" />
          <div className="flex justify-between items-center text-[10px] text-rose-400">
            <span>Press Ctrl+S or click check to save</span>
            <button onClick={handleSave} className="flex items-center gap-1 px-2.5 py-1 bg-love-primary text-white font-bold rounded-lg cursor-pointer"><Check className="w-3 h-3" /><span>Save</span></button>
          </div>
        </div>
      ) : (
        <div onDoubleClick={() => setIsEditing(true)} className="prose prose-rose dark:prose-invert max-w-none text-rose-800 dark:text-rose-100 min-h-[40px] cursor-text">
          {cell.content.trim() ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{cell.content}</ReactMarkdown> : <p className="text-rose-300 dark:text-rose-700 italic text-sm">Double click to add notes...</p>}
        </div>
      )}
    </div>
  );
}
