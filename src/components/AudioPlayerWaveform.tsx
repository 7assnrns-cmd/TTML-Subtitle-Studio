import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Gauge, Sparkles, Music2, Keyboard } from 'lucide-react';
import { WordTiming, PauseEvent, TTMLConfig } from '../types';
import { UILanguage, getTranslation } from '../utils/i18n';
import { CustomSelect } from './CustomSelect';

interface AudioPlayerWaveformProps {
  audioUrl: string | null;
  duration: number;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  words: WordTiming[];
  pauses: PauseEvent[];
  activeWordId: string | null;
  uiLanguage: UILanguage;
  config: TTMLConfig;
}

export const AudioPlayerWaveform: React.FC<AudioPlayerWaveformProps> = ({
  audioUrl,
  duration,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  words,
  pauses,
  activeWordId,
  uiLanguage,
  config,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const t = (key: string) => getTranslation(uiLanguage, key);

  // High-precision RAF synchronization loop to eliminate browser onTimeUpdate clock jitter & drift
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const syncClock = () => {
      if (audioRef.current && !audioRef.current.paused && !isDraggingRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
      animFrameRef.current = requestAnimationFrame(syncClock);
    };

    animFrameRef.current = requestAnimationFrame(syncClock);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPlaying, setCurrentTime]);

  // Strict cleanup on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch (e) {
          // ignore
        }
      }
      setIsPlaying(false);
    };
  }, [setIsPlaying]);

  // Reset states and explicitly trigger load when audio URL changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    const el = audioRef.current;
    if (el) {
      try {
        el.pause();
        el.currentTime = 0;
        el.load();
      } catch (e) {
        // ignore
      }
    }
  }, [audioUrl, setIsPlaying, setCurrentTime]);

  // Sync internal audio element when external currentTime seeks (tolerance < 0.06s)
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && !isDraggingRef.current && Math.abs(audio.currentTime - currentTime) > 0.06) {
      try {
        // Check if metadata is loaded (readyState >= 1)
        if (audio.readyState >= 1) {
          audio.currentTime = currentTime;
        } else {
          // Otherwise, set it once metadata loads
          const handleLoadedMetadata = () => {
            try {
              audio.currentTime = currentTime;
            } catch (e) {
              console.warn('Failed to set deferred currentTime:', e);
            }
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          };
          audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        }
      } catch (e) {
        console.warn('Failed to set currentTime on audio element:', e);
      }
    }
  }, [currentTime]);

  // Sync isPlaying state
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio playback interrupted or blocked:', err);
          setIsPlaying(false);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, setIsPlaying]);

  // Sync playback rate with pitch preservation
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      if ('preservesPitch' in audioRef.current) {
        (audioRef.current as any).preservesPitch = true;
      }
    }
  }, [playbackRate]);

  // Global keyboard shortcuts for fluid media playback control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing into input/textarea/select
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.code === 'Space' || e.code === 'KeyK') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyJ') {
        e.preventDefault();
        seekRelative(-5);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyL') {
        e.preventDefault();
        seekRelative(5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, duration, setIsPlaying]);

  // Draw interactive waveform canvas with frosted aesthetic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const effectiveDuration = duration > 0 ? duration : 1;

    ctx.clearRect(0, 0, width, height);

    // Frosted dark background track with gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    if (config.visualizerStyle === 'none') {
      // Still draw playhead
    } else {
      // Draw pauses...
    pauses.forEach((p) => {
      const startX = (p.start / effectiveDuration) * width;
      const endX = (p.end / effectiveDuration) * width;
      const pauseWidth = Math.max(2, endX - startX);

      ctx.fillStyle = 'rgba(244, 63, 94, 0.18)';
      ctx.fillRect(startX, 0, pauseWidth, height);

      // Top glowing indicator tick
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(startX, 0, pauseWidth, 2.5);
    });

    // Visualizer logic
    const totalBars = config.visualizerStyle === 'circles' ? 60 : 140;
    const barWidth = width / totalBars;
    const sensitivity = config.visualizerSensitivity ?? 5;
    const style = config.visualizerStyle ?? 'bars';

    let wordIdx = 0;
    for (let i = 0; i < totalBars; i++) {
      const barTime = (i / totalBars) * effectiveDuration;

      while (wordIdx < words.length && words[wordIdx].end < barTime) {
        wordIdx++;
      }

      const matchingWord = (wordIdx < words.length && barTime >= words[wordIdx].start) ? words[wordIdx] : undefined;
      const isWordActive = matchingWord && activeWordId === matchingWord.id;
      const isPast = barTime <= currentTime;

      let barHeightRatio = 0.22 + (Math.sin(i * 0.45) * 0.14 + Math.cos(i * 0.82) * 0.14);
      barHeightRatio *= (sensitivity / 5);

      if (matchingWord) {
        barHeightRatio = Math.min(0.92, barHeightRatio + 0.42);
      } else {
        barHeightRatio = Math.max(0.08, barHeightRatio * 0.28);
      }

      const barHeight = height * barHeightRatio;
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      // Fill color with anti-aliased gradient
      if (isWordActive) {
        const activeGrad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        activeGrad.addColorStop(0, '#38bdf8');
        activeGrad.addColorStop(1, '#818cf8');
        ctx.fillStyle = activeGrad;
      } else if (matchingWord) {
        ctx.fillStyle = isPast ? '#818cf8' : '#4f46e5';
      } else {
        ctx.fillStyle = isPast ? '#334155' : '#1e293b';
      }

      if (style === 'bars') {
        ctx.beginPath();
        ctx.roundRect(x + 1, y, Math.max(1.5, barWidth - 1.5), barHeight, 2);
        ctx.fill();
      } else if (style === 'wave') {
        ctx.beginPath();
        ctx.ellipse(x + barWidth / 2, height / 2, barWidth / 2, barHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (style === 'circles') {
        ctx.beginPath();
        ctx.arc(x + barWidth / 2, height / 2, barHeight / 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

    // Draw Playhead cursor line
    const playheadX = (currentTime / effectiveDuration) * width;
    
    // Playhead glow
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.fillRect(playheadX - 3, 0, 6, height);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(playheadX - 1, 0, 2, height);

    // Playhead circle
    ctx.beginPath();
    ctx.arc(playheadX, 5, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [duration, currentTime, words, pauses, activeWordId, config.visualizerStyle, config.visualizerSensitivity]);

  const updateScrubTime = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * duration;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  }, [duration, setCurrentTime]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    updateScrubTime(e.clientX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (isDraggingRef.current) {
        updateScrubTime(moveEvent.clientX);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      isDraggingRef.current = true;
      updateScrubTime(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current && e.touches.length > 0) {
      updateScrubTime(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const seekRelative = (delta: number) => {
    const next = Math.max(0, Math.min(duration, currentTime + delta));
    setCurrentTime(next);
    if (audioRef.current) {
      audioRef.current.currentTime = next;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00.00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  return (
    <div className="relative overflow-hidden glass-panel rounded-2xl p-5 sm:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] space-y-4 max-w-full box-border">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(duration);
          }}
          onError={() => {
            console.warn('Audio playback source unavailable or interrupted.');
            setIsPlaying(false);
          }}
        />
      )}

      {/* Waveform Seeker Canvas with Drag & Click Scrubbing */}
      <div className="relative mb-3 z-10">
        <canvas
          ref={canvasRef}
          width={800}
          height={75}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full h-[75px] rounded-xl cursor-ew-resize bg-slate-950/90 border border-white/5 shadow-inner select-none touch-none"
        />

        {/* Legend pills over waveform */}
        <div className="absolute top-2 right-2 flex items-center gap-2 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-medium pointer-events-none">
          <span className="flex items-center gap-1 text-indigo-300">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" /> Word Sync
          </span>
          <span className="flex items-center gap-1 text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" /> Pause ({pauses.length})
          </span>
        </div>
      </div>

      {/* Bottom control row */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1 z-10 relative">
        {/* Playback action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => seekRelative(-5)}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/60 border border-white/5 rounded-xl transition-all cursor-pointer active:scale-95"
            title="Rewind 5s (Left Arrow / J)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-11 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-all cursor-pointer active:scale-95 ring-1 ring-white/20"
            title={isPlaying ? 'Pause (Space / K)' : 'Play (Space / K)'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => seekRelative(5)}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/60 border border-white/5 rounded-xl transition-all cursor-pointer active:scale-95"
            title="Forward 5s (Right Arrow / L)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Timecode display with frosted badge */}
          <div className="ml-2 font-mono text-xs text-slate-200 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
            <span className="text-cyan-400 font-bold tracking-wider">{formatTime(currentTime)}</span>
            <span className="text-slate-600 mx-1.5">/</span>
            <span className="text-slate-400 tracking-wider">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Speed and Shortcuts controls */}
        <div className="flex items-center gap-2.5">
          {/* Shortcuts Info Toggle */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer text-xs flex items-center gap-1 ${
              showShortcuts
                ? 'bg-indigo-600/90 text-white border-indigo-400/40 shadow-sm'
                : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border-white/10'
            }`}
            title="Keyboard Shortcuts Guide"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="w-24">
            <CustomSelect
              value={playbackRate}
              onChange={(v) => setPlaybackRate(v as number)}
              options={[
                { label: '0.5x', value: 0.5 },
                { label: '0.75x', value: 0.75 },
                { label: '1.0x', value: 1.0 },
                { label: '1.25x', value: 1.25 },
                { label: '1.5x', value: 1.5 },
                { label: '2.0x', value: 2.0 },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts popup banner */}
      {showShortcuts && (
        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-200">Space</kbd> Play/Pause</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-200">←</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-200">→</kbd> Seek 5s</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-200">↑</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-200">↓</kbd> Volume</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-200">M</kbd> Mute</span>
          </div>
          <span className="text-cyan-400">Drag waveform to scrub smoothly</span>
        </div>
      )}
    </div>
  );
};
