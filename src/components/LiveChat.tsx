'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLoveStudyStore } from '@/store/useLoveStudyStore';
import { Send, Smile, MessageSquare, FolderHeart, Loader2 } from 'lucide-react';

const EMOJIS = ['❤️', '💖', '🥰', '😍', '🐼', '🐍', '⚡️', '🔥', '💻', '✨'];

export default function LiveChat() {
  const store = useLoveStudyStore();
  const [inputText, setInputText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [store.chatMessages, store.typingIndicator.ananya]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputText.trim()) { store.sendChatMessage(inputText.trim(), store.currentUser); setInputText(''); setShowEmojis(false); }
  };

  const handleArchiveChat = async () => {
    if (store.chatMessages.length === 0) return;
    setIsArchiving(true);
    try { await store.archiveChat(); } catch (e) { console.error(e); } finally { setIsArchiving(false); }
  };

  return (
    <div className="bg-white/50 dark:bg-love-dark/30 border border-rose-100/40 dark:border-rose-950/20 rounded-2xl flex flex-col h-[320px] shadow-sm relative overflow-hidden">
      <div className="p-3.5 border-b border-rose-100/30 dark:border-rose-950/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-love-primary" />
          <h3 className="text-xs font-bold text-rose-400 dark:text-rose-300/40 uppercase tracking-wider">Live Chat</h3>
        </div>
        {store.chatMessages.length > 0 && (
          <button type="button" onClick={handleArchiveChat} disabled={isArchiving} className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/35 border border-rose-100 hover:bg-rose-100/40 disabled:opacity-50 text-[10px] font-bold text-rose-700 dark:text-rose-300 rounded-lg cursor-pointer">
            {isArchiving ? <><Loader2 className="w-3 h-3 animate-spin text-love-primary" /><span>Archiving...</span></> : <><FolderHeart className="w-3 h-3 text-love-primary" /><span>Archive & Clear</span></>}
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {store.chatMessages.map((msg) => {
          const isMe = msg.sender === store.currentUser;
          return (
            <div key={msg.id} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={msg.avatar} alt={msg.sender} className="w-7 h-7 rounded-full object-cover border border-rose-100" />
              <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold text-rose-700/80 dark:text-rose-300/60">{isMe ? 'You' : msg.sender}</span>
                  <span className="text-[8px] text-rose-300">{msg.timestamp}</span>
                </div>
                <div className={`px-3 py-2 text-xs rounded-2xl shadow-sm ${isMe ? 'bg-gradient-to-r from-purple-500/80 to-love-lavender/90 text-white rounded-tr-none' : 'bg-gradient-to-r from-love-light/60 to-love-secondary/15 text-rose-800 dark:text-rose-100 rounded-tl-none border border-rose-100/30'}`}>{msg.text}</div>
              </div>
            </div>
          );
        })}
        {store.typingIndicator.ananya && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-love-primary/20 flex items-center justify-center text-xs">💕</div>
            <div className="px-3 py-2.5 bg-love-light/40 rounded-2xl rounded-tl-none border border-rose-100/30 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-love-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-love-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-love-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="p-2 border-t border-rose-100/30 flex items-center gap-1.5 flex-shrink-0 relative">
        {showEmojis && (
          <div className="absolute bottom-12 left-2 bg-white dark:bg-love-dark border border-rose-100 p-2 rounded-xl flex gap-1.5 shadow-xl z-20">
            {EMOJIS.map((emoji) => <button key={emoji} type="button" onClick={() => { setInputText(p => p + emoji); setShowEmojis(false); }} className="hover:scale-125 transition-transform text-sm p-0.5 cursor-pointer">{emoji}</button>)}
          </div>
        )}
        <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="p-1.5 hover:bg-rose-100/40 rounded-xl text-rose-400 hover:text-love-primary cursor-pointer"><Smile className="w-4 h-4" /></button>
        <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type a message..." className="flex-1 bg-rose-50/50 dark:bg-love-dark border border-rose-100/40 rounded-xl px-3 py-1.5 text-xs text-rose-800 dark:text-rose-100 placeholder-rose-300 focus:outline-none focus:ring-1 focus:ring-love-primary/40" />
        <button type="submit" className="p-1.5 bg-love-primary hover:bg-love-secondary text-white rounded-xl shadow-md cursor-pointer hover:scale-105"><Send className="w-3.5 h-3.5" /></button>
      </form>
    </div>
  );
}
