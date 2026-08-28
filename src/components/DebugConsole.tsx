import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, X, ChevronDown, ChevronUp, Bug } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LogEntry {
  id: string;
  type: 'log' | 'error' | 'warn';
  message: string;
  timestamp: Date;
}

export const DebugConsole: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (type: 'log' | 'error' | 'warn', args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      setLogs(prev => {
        const newLogs = [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          type,
          message,
          timestamp: new Date()
        }];
        // Keep only last 200 logs for performance
        return newLogs.slice(-200);
      });
    };

    console.log = (...args) => {
      addLog('log', args);
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      addLog('error', args);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      addLog('warn', args);
      originalWarn.apply(console, args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isMinimized]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-[999999] p-3 rounded-full bg-slate-900/90 backdrop-blur-xl border border-white/10 text-cyan-400 shadow-2xl hover:scale-110 active:scale-95 transition-all group"
        title="Open Debug Console"
      >
        <Terminal className="w-6 h-6" />
        {logs.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {logs.length > 99 ? '99+' : logs.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={`fixed z-[999999] transition-all duration-300 ease-in-out ${
      isMinimized 
        ? 'bottom-24 right-6 w-72 h-12' 
        : 'bottom-24 right-6 w-[90vw] md:w-[600px] h-[400px]'
    }`}>
      <div className="flex flex-col h-full bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-white/10 select-none">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-cyan-500/20">
              <Bug className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">
              System Debug Console
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLogs([])}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
              title="Clear Logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Log Area */}
        {!isMinimized && (
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1.5 scrollbar-thin scrollbar-thumb-white/10"
          >
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 opacity-50">
                <Terminal className="w-8 h-8" />
                <span>Waiting for system events...</span>
              </div>
            ) : (
              logs.map((log) => (
                <div 
                  key={log.id} 
                  className={`flex gap-3 p-1.5 rounded-lg border leading-relaxed ${
                    log.type === 'error' 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
                      : log.type === 'warn'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                      : 'bg-slate-900/50 border-white/5 text-slate-300'
                  }`}
                >
                  <span className="text-slate-500 shrink-0 font-bold opacity-70">
                    [{log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                  </span>
                  <div className="whitespace-pre-wrap break-all selection:bg-cyan-500/30">
                    <span className={`font-bold mr-2 uppercase text-[9px] px-1 rounded ${
                      log.type === 'error' ? 'bg-rose-500 text-white' : 
                      log.type === 'warn' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {log.type}
                    </span>
                    {log.message}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer Info */}
        {!isMinimized && (
          <div className="px-4 py-2 bg-slate-900/50 border-t border-white/10 text-[10px] text-slate-500 font-mono flex justify-between items-center">
            <span>{logs.length} entries captured</span>
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                Live Hook
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
