'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLoveStudyStore } from '@/store/useLoveStudyStore';
import CollaboratorsCard from './CollaboratorsCard';
import LiveChat from './LiveChat';
import LoveStudyWidgets from './LoveStudyWidgets';
import NotebookInfo from './NotebookInfo';
import { MessageSquare, FileText, Sparkles, Send, Copy, RefreshCw, AlertTriangle, Terminal, Bot, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function RightPanelTabs() {
  const store = useLoveStudyStore();
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'ai'>('chat');
  
  // Notes Tab states
  const [notesMode, setNotesMode] = useState<'edit' | 'preview'>('edit');
  
  // AI Tab states
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am your AI study assistant powered by Gemini. Ask me to write code, explain algorithms, or debug error logs. 💖',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiThinking, activeTab]);

  const callGemini = async (promptToSend: string, currentHistory: AIMessage[]) => {
    setIsAiThinking(true);
    try {
      // Build context structure for Gemini
      // Filter out the welcome message to ensure history begins with a 'user' turn
      const apiHistory = currentHistory.filter(msg => msg.id !== 'welcome');

      const contents = apiHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      contents.push({
        role: 'user',
        parts: [{ text: promptToSend }]
      });

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contents })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gemini API call failed');
      }

      const data = await response.json();
      const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response. Please try again.";
      
      setAiMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (error: any) {
      console.error(error);
      let friendlyMessage = error.message || 'Oops! I encountered an error communicating with Gemini. Please verify your connection and try again. 🛠️';
      
      if (friendlyMessage.includes('leaked') || friendlyMessage.includes('PERMISSION_DENIED')) {
        friendlyMessage = 'Your `GEMINI_API_KEY` has been flagged as leaked or blocked by Google. Please update it with a new key in your `.env.local` file or deployment settings. 🔐';
      } else if (friendlyMessage.includes('not found') || friendlyMessage.includes('ModelService.ListModels')) {
        friendlyMessage = 'Google Gemini API returned a 404 error. This usually indicates the API key is restricted, disabled, or blocked due to being leaked. Please configure a valid `GEMINI_API_KEY` in your settings. 🔐';
      }
      
      setAiMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: friendlyMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleSendPrompt = (forcedPrompt?: string) => {
    const promptToSend = (forcedPrompt || aiPrompt).trim();
    if (!promptToSend) return;

    if (!forcedPrompt) {
      setAiPrompt('');
    }

    const newUserMessage: AIMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...aiMessages, newUserMessage];
    setAiMessages(updatedHistory);
    callGemini(promptToSend, aiMessages);
  };

  const handleCopyToCell = (text: string) => {
    const codeMatch = text.match(/```(?:python|javascript|java|cpp)?\n([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1] : text;
    
    const active = store.notebooks.find(n => n.id === store.activeNotebookId);
    if (active) {
      const codeCell = active.cells.find(c => c.type === 'code');
      if (codeCell) {
        store.updateCellContent(store.activeNotebookId, codeCell.id, code);
        alert('Copied code snippet into code cell! 📝');
      } else {
        store.addCell(store.activeNotebookId, 'code');
        const updatedActive = useLoveStudyStore.getState().notebooks.find(n => n.id === store.activeNotebookId);
        const newCell = updatedActive?.cells[updatedActive.cells.length - 1];
        if (newCell) {
          store.updateCellContent(store.activeNotebookId, newCell.id, code);
        }
        alert('Created new cell and loaded code snippet! 📝');
      }
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Dynamic Tab Selector Headers */}
      <div className="flex border-b border-rose-100/30 dark:border-rose-950/10 bg-rose-50/50 dark:bg-love-dark-bg/50 p-1.5 rounded-2xl mx-4 mt-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-white dark:bg-love-dark text-love-primary shadow-sm border border-rose-100/40 dark:border-rose-950/20'
              : 'text-rose-500 hover:text-love-primary'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'notes'
              ? 'bg-white dark:bg-love-dark text-love-primary shadow-sm border border-rose-100/40 dark:border-rose-950/20'
              : 'text-rose-500 hover:text-love-primary'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Notes</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-white dark:bg-love-dark text-love-primary shadow-sm border border-rose-100/40 dark:border-rose-950/20'
              : 'text-rose-500 hover:text-love-primary'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Helper</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <CollaboratorsCard />
            <LiveChat />
            <LoveStudyWidgets />
            <NotebookInfo />
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="flex flex-col gap-3 h-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Shared Markdown Notes</span>
              <div className="flex bg-rose-50 dark:bg-love-dark p-0.5 rounded-lg border border-rose-100/40 dark:border-rose-950/20">
                <button
                  onClick={() => setNotesMode('edit')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md cursor-pointer ${
                    notesMode === 'edit' ? 'bg-white dark:bg-neutral-800 text-love-primary shadow-xs' : 'text-rose-400'
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setNotesMode('preview')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md cursor-pointer ${
                    notesMode === 'preview' ? 'bg-white dark:bg-neutral-800 text-love-primary shadow-xs' : 'text-rose-400'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {notesMode === 'edit' ? (
              <textarea
                value={store.sharedNotes}
                onChange={(e) => store.updateSharedNotes(e.target.value)}
                placeholder="Type real-time study notes here..."
                className="w-full h-[400px] text-xs p-3 bg-white/70 dark:bg-love-dark text-rose-800 dark:text-rose-100 border border-rose-100 dark:border-rose-900/45 rounded-2xl focus:outline-none focus:ring-2 focus:ring-love-primary/40 resize-none font-mono"
              />
            ) : (
              <div className="w-full h-[400px] overflow-y-auto p-3 bg-white/70 dark:bg-love-dark border border-rose-100 dark:border-rose-900/45 rounded-2xl prose prose-rose dark:prose-invert prose-xs">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {store.sharedNotes}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="flex flex-col h-[520px] overflow-hidden bg-rose-50/20 dark:bg-love-dark/10 border border-rose-100/35 dark:border-rose-950/10 rounded-2xl">
            {/* Header with Clear Button */}
            <div className="px-3.5 py-2 border-b border-rose-100/25 dark:border-rose-950/15 flex justify-between items-center bg-white/40 dark:bg-love-dark-bg/20 flex-shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500/80 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-love-primary" />
                <span>AI Pair Assistant</span>
              </span>
              <button
                onClick={() => {
                  setAiMessages([
                    {
                      id: 'welcome',
                      sender: 'ai',
                      text: 'Hello! I am your AI study assistant powered by Gemini. Ask me to write code, explain algorithms, or debug error logs. 💖',
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  ]);
                }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-rose-500 hover:text-love-primary hover:bg-rose-50/50 rounded-lg cursor-pointer transition-colors"
                title="Clear conversation history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Chat</span>
              </button>
            </div>

            {/* AI Messages Stream container */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
              {aiMessages.map((msg) => {
                const isAI = msg.sender === 'ai';
                return (
                  <div key={msg.id} className={`flex gap-2 max-w-[85%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
                    {/* Avatar */}
                    {isAI ? (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-love-primary to-purple-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 flex-shrink-0 text-xs font-bold ring-1 ring-rose-200">
                        Me
                      </div>
                    )}

                    <div className="space-y-1">
                      {/* Name / Time info */}
                      <div className={`flex items-center gap-1.5 text-[9px] font-semibold text-rose-400 ${!isAI && 'justify-end'}`}>
                        <span>{isAI ? 'StudyBot' : 'You'}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {/* Bubble */}
                      <div className={`p-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isAI 
                          ? 'bg-white dark:bg-love-dark text-neutral-800 dark:text-neutral-200 rounded-tl-xs border border-rose-100/40 dark:border-rose-950/20' 
                          : 'bg-gradient-to-br from-love-primary to-love-secondary text-white rounded-tr-xs'
                      }`}>
                        <div className="prose prose-rose dark:prose-invert prose-xs max-w-full break-words">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.text}
                          </ReactMarkdown>
                        </div>

                        {/* Copy Code Actions block inside message bubbles */}
                        {isAI && (msg.text.includes('```python') || msg.text.includes('```')) && (
                          <div className="mt-2.5 pt-2 border-t border-rose-100/30 dark:border-rose-950/10 flex gap-2">
                            <button
                              onClick={() => handleCopyToCell(msg.text)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-love-primary/10 hover:bg-love-primary/20 text-love-primary dark:text-rose-300 text-[10px] font-bold rounded-lg border border-love-primary/15 cursor-pointer transition-colors"
                            >
                              <Terminal className="w-3 h-3" />
                              <span>Insert into cell</span>
                            </button>
                            <button
                              onClick={() => {
                                const codeMatch = msg.text.match(/```(?:python|javascript|java|cpp)?\n([\s\S]*?)```/);
                                const code = codeMatch ? codeMatch[1] : msg.text;
                                navigator.clipboard.writeText(code);
                                alert('Code copied to clipboard!');
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing loader */}
              {isAiThinking && (
                <div className="flex gap-2 max-w-[85%] mr-auto">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-love-primary to-purple-500 flex items-center justify-center text-white flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[9px] font-semibold text-rose-400">StudyBot is typing...</div>
                    <div className="bg-white dark:bg-love-dark p-3 rounded-2xl rounded-tl-xs border border-rose-100/40 dark:border-rose-950/20 shadow-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-love-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-love-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-love-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Action Suggestion Chips above typing area */}
            <div className="p-2 border-t border-rose-100/25 dark:border-rose-950/15 flex gap-1.5 overflow-x-auto bg-white/40 dark:bg-love-dark-bg/20 flex-shrink-0 scrollbar-none">
              <button
                onClick={() => handleSendPrompt("Explain active numpy code cell")}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 bg-white/95 dark:bg-love-dark border border-rose-100 dark:border-rose-950/25 text-[10px] font-medium text-rose-700 dark:text-rose-200 hover:text-love-primary rounded-full cursor-pointer transition-all"
              >
                <Terminal className="w-3 h-3 text-love-primary" />
                <span>Explain code</span>
              </button>
              <button
                onClick={() => handleSendPrompt("Suggest Fix for NameError exception")}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 bg-white/95 dark:bg-love-dark border border-rose-100 dark:border-rose-950/25 text-[10px] font-medium text-rose-700 dark:text-rose-200 hover:text-love-primary rounded-full cursor-pointer transition-all"
              >
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span>Fix NameError</span>
              </button>
              <button
                onClick={() => handleSendPrompt("Generate starter pandas DataFrame snippet")}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 bg-white/95 dark:bg-love-dark border border-rose-100 dark:border-rose-950/25 text-[10px] font-medium text-rose-700 dark:text-rose-200 hover:text-love-primary rounded-full cursor-pointer transition-all"
              >
                <Sparkles className="w-3 h-3 text-love-secondary" />
                <span>Generate Pandas</span>
              </button>
            </div>

            {/* Input typing bar */}
            <div className="p-2 bg-white dark:bg-love-dark border-t border-rose-100/30 dark:border-rose-950/20 flex gap-2 flex-shrink-0">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
                placeholder="Ask StudyBot anything..."
                className="flex-1 text-xs p-2.5 bg-rose-50/30 dark:bg-neutral-900 text-rose-700 dark:text-rose-100 border border-rose-100 dark:border-rose-950/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-love-primary"
              />
              <button
                onClick={() => handleSendPrompt()}
                className="p-2.5 bg-gradient-to-r from-love-primary to-love-secondary hover:from-love-secondary hover:to-love-primary text-white rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
