'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check } from 'lucide-react';

interface AddNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, language: string) => void;
}

const LANGUAGES = [
  { id: 'python_notebook', name: 'Python Notebook', description: 'Jupyter-style interactive multi-cell notebook', icon: '📓', color: 'text-blue-500 bg-blue-500/10' },
  { id: 'python', name: 'Python Script', description: 'Single code editor & Python terminal output', icon: '🐍', color: 'text-amber-500 bg-amber-500/10' },
  { id: 'javascript', name: 'JavaScript Script', description: 'Single code editor & Node.js output shell', icon: '🟨', color: 'text-yellow-500 bg-yellow-500/10' },
  { id: 'java', name: 'Java Program', description: 'Compile & execute full Java files', icon: '☕', color: 'text-red-500 bg-red-500/10' },
  { id: 'c', name: 'C Script', description: 'Compile & execute clean C code files', icon: '🛡️', color: 'text-indigo-500 bg-indigo-500/10' },
  { id: 'cpp', name: 'C++ Program', description: 'Compile & run high performance C++ scripts', icon: '⚙️', color: 'text-teal-500 bg-teal-500/10' },
];

export default function AddNotebookModal({ isOpen, onClose, onSubmit }: AddNotebookModalProps) {
  const [title, setTitle] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('python_notebook');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim(), selectedLanguage);
    setTitle('');
    setSelectedLanguage('python_notebook');
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-lg bg-white/95 dark:bg-love-dark-bg/95 border border-rose-100/60 dark:border-rose-950/35 rounded-3xl p-6 shadow-2xl relative z-10 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-rose-100/30 dark:border-rose-950/15 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-500/10 text-love-primary rounded-xl"><Sparkles className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-base font-bold text-rose-800 dark:text-rose-100">Create New Workspace File</h3>
                  <p className="text-[11px] text-rose-500/70 dark:text-rose-400/50">Select a script type or notebook.</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-rose-100/50 dark:hover:bg-rose-900/30 rounded-xl text-rose-400 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-rose-600 dark:text-rose-300 uppercase tracking-wider block">File / Notebook Title</label>
                <input type="text" required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Algorithms Practice..." className="w-full px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-100 bg-rose-50/20 dark:bg-love-dark border border-rose-100 dark:border-rose-950/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-love-primary/40" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-rose-600 dark:text-rose-300 uppercase tracking-wider block">Programming Language & View</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                  {LANGUAGES.map((lang) => {
                    const isSelected = selectedLanguage === lang.id;
                    return (
                      <button key={lang.id} type="button" onClick={() => setSelectedLanguage(lang.id)}
                        className={`p-3 rounded-xl border text-left flex gap-2.5 transition-all cursor-pointer ${isSelected ? 'bg-rose-500/5 border-rose-400 shadow-sm' : 'bg-white dark:bg-love-dark border-rose-100/30 hover:bg-rose-50/30'}`}>
                        <span className="text-xl">{lang.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-800 dark:text-rose-200 truncate">{lang.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-love-primary flex-shrink-0" />}
                          </div>
                          <span className="text-[10px] text-rose-400 dark:text-rose-300/40 block mt-0.5 leading-snug line-clamp-2">{lang.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-rose-100/25">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-rose-500/5 hover:bg-rose-500/10 text-love-primary text-xs font-semibold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-love-primary to-love-secondary text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer">Create Workspace</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
