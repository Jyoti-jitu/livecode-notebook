'use client';

import React, { useState } from 'react';
import { useLoveStudyStore } from '@/store/useLoveStudyStore';
import CodeCell from './CodeCell';
import MarkdownCell from './MarkdownCell';
import { Heart, Plus, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CellsArea() {
  const store = useLoveStudyStore();
  const activeNotebook = store.notebooks.find((n) => n.id === store.activeNotebookId);
  const [draggedCellId, setDraggedCellId] = useState<string | null>(null);

  if (!activeNotebook) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
        <Heart className="w-16 h-16 text-rose-200 fill-current animate-pulse mb-4" />
        <h3 className="text-lg font-bold text-rose-800 dark:text-rose-100">No active notebook selected</h3>
        <p className="text-sm text-rose-400 mt-1">Select a notebook from the sidebar to start!</p>
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent, id: string) => { setDraggedCellId(id); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedCellId || draggedCellId === targetId) return;
    const cellIds = activeNotebook.cells.map(c => c.id);
    const draggedIndex = cellIds.indexOf(draggedCellId);
    const targetIndex = cellIds.indexOf(targetId);
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const reordered = [...cellIds];
      reordered.splice(draggedIndex, 1);
      reordered.splice(targetIndex, 0, draggedCellId);
      store.reorderCells(activeNotebook.id, reordered);
    }
  };
  const handleDragEnd = () => setDraggedCellId(null);
  const handleAddCodeCell = () => store.addCell(activeNotebook.id, 'code');
  const handleAddMarkdownCell = () => store.addCell(activeNotebook.id, 'markdown');

  if (activeNotebook.cells.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-6 h-full min-h-[400px]">
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2.2 }}>
          <Heart className="w-24 h-24 text-love-primary fill-love-primary drop-shadow-[0_4px_16px_rgba(255,92,147,0.35)]" />
        </motion.div>
        <div>
          <h2 className="text-xl font-bold text-rose-800 dark:text-rose-100">Start your first study session 💕</h2>
          <p className="text-xs text-rose-500/80 dark:text-rose-400 mt-2 max-w-sm mx-auto">Add a code cell or markdown cell below to begin!</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleAddCodeCell} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-love-primary to-love-secondary text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"><Plus className="w-4 h-4" />Add Code Cell</button>
          <button onClick={handleAddMarkdownCell} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-love-dark text-love-primary border border-love-primary/20 text-xs font-semibold rounded-xl cursor-pointer"><Plus className="w-4 h-4" />Add Markdown Cell</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-8 py-6 space-y-6 overflow-y-auto">
      <div className="space-y-4">
        {activeNotebook.cells.map((cell, idx) => (
          <div key={cell.id} draggable onDragStart={(e) => handleDragStart(e, cell.id)} onDragOver={(e) => handleDragOver(e, cell.id)} onDragEnd={handleDragEnd}
            className={`relative flex gap-2 ${draggedCellId === cell.id ? 'opacity-30 border-2 border-dashed border-love-primary/30 rounded-2xl' : ''}`}>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-7 opacity-0 hover:opacity-100 cursor-grab text-rose-300 p-1">
              <GripVertical className="w-4 h-4" />
            </div>
            <div className="w-full">
              {cell.type === 'code' ? <CodeCell cell={cell} index={idx} /> : <MarkdownCell cell={cell} index={idx} />}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-rose-100/30 pt-6 flex flex-col items-center gap-3 mt-4">
        <div className="flex items-center gap-2.5">
          <button onClick={handleAddCodeCell} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-love-primary bg-love-primary/5 hover:bg-love-primary/10 border border-love-primary/20 rounded-xl cursor-pointer"><Plus className="w-3.5 h-3.5" /><span>Code Cell</span></button>
          <button onClick={handleAddMarkdownCell} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-love-primary bg-love-primary/5 hover:bg-love-primary/10 border border-love-primary/20 rounded-xl cursor-pointer"><Plus className="w-3.5 h-3.5" /><span>Markdown Cell</span></button>
        </div>
        <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest flex items-center gap-1">
          <Heart className="w-3 h-3 text-love-primary animate-pulse" /><span>Drag to reorder cells</span>
        </span>
      </div>
    </div>
  );
}
