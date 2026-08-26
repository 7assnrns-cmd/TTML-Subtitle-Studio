import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, FastForward, Gauge, Activity } from 'lucide-react';
import { WordTiming, PauseEvent } from '../types';
import { UILanguage, getTranslation } from '../utils/i18n';

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
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);

  const t = (key: string) => getTranslation(uiLanguage, key);

  // Sync internal audio element with external currentTime changes (if not playing or seeking)
  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 0.3) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Sync isPlaying state
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.warn('Audio playback error:', err);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, setIsPlaying]);

  // Sync playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Draw interactive waveform canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const effectiveDuration = duration > 0 ? duration : 1;

    ctx.clearRect(0, 0, width, height);

    // Draw background track
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw pause intervals (amber / rose subtle shading)
    pauses.forEach((p) => {
      const startX = (p.start / effectiveDuration) * width;
      const endX = (p.end / effectiveDuration) * width;
      const pauseWidth = Math.max(2, endX - startX);

      ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
      ctx.fillRect(startX, 0, pauseWidth, height);

      // Top indicator tick
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(startX, 0, pauseWidth, 3);
    });

    // Draw word waveform bars
    const totalBars = 120;
    const barWidth = width / totalBars;

    for (let i = 0; i < totalBars; i++) {
      const barTime = (i / totalBars) * effectiveDuration;

      // Find if this time slice matches any word
      const matchingWord = words.find((w) => barTime >= w.start && barTime <= w.end);
      const isWordActive = matchingWord && activeWordId === matchingWord.id;

      // Generate synthetic rhythmic height based on index & word density
      let barHeightRatio = 0.2 + (Math.sin(i * 0.45) * 0.15 + Math.cos(i * 0.8) * 0.15);
      if (matchingWord) {
        barHeightRatio = Math.min(0.9, barHeightRatio + 0.4);
      } else {
        barHeightRatio = Math.max(0.08, barHeightRatio * 0.3); // quieter during pauses
      }

      const barHeight = height * barHeightRatio;
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      // Fill color
      if (isWordActive) {
        ctx.fillStyle = '#38bdf8'; // bright sky blue for active word
      } else if (matchingWord) {
        ctx.fillStyle = '#6366f1'; // indigo for words
      } else {
        ctx.fillStyle = '#334155'; // dark slate for pauses/silence
      }

      ctx.beginPath();
      ctx.roundRect(x + 1, y, Math.max(1, barWidth - 2), barHeight, 2);
      ctx.fill();
    }

    // Draw Playhead cursor
    const playheadX = (currentTime / effectiveDuration) * width;
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(playheadX - 1.5, 0, 3, height);

    // Playhead handle
    ctx.beginPath();
    ctx.arc(playheadX, 6, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
  }, [duration, currentTime, words, pauses, activeWordId]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * duration;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Hidden or managed Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(duration);
          }}
          onError={(e) => {
            console.error('Audio playback error', e);
          }}
        />
      )}

      {/* Waveform Seeker Canvas */}
      <div className="relative mb-3">
        <canvas
          ref={canvasRef}
          width={800}
          height={70}
          onClick={handleCanvasClick}
          className="w-full h-[70px] rounded-xl cursor-pointer bg-slate-950 border border-slate-800/80 shadow-inner"
        />

        {/* Legend pills over waveform */}
        <div className="absolute top-2 right-2 flex items-center gap-2 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-800 text-[10px] font-medium pointer-events-none">
          <span className="flex items-center gap-1 text-indigo-300">
            <span className="w-2 h-2 rounded-full bg-indigo-500" /> Speech
          </span>
          <span className="flex items-center gap-1 text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Pause ({pauses.length})
          </span>
        </div>
      </div>

      {/* Bottom control row */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Playback action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => seekRelative(-5)}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Rewind 5s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-colors cursor-pointer"
            title={isPlaying ? t('pause') : t('play')}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => seekRelative(5)}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Forward 5s"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Timecode display */}
          <div className="ml-2 font-mono text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-cyan-400 font-bold">{formatTime(currentTime)}</span>
            <span className="text-slate-600 mx-1">/</span>
            <span className="text-slate-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Speed & Volume controls */}
        <div className="flex items-center gap-3">
          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="0.5" className="bg-slate-900">0.5x</option>
              <option value="0.75" className="bg-slate-900">0.75x</option>
              <option value="1.0" className="bg-slate-900">1.0x</option>
              <option value="1.25" className="bg-slate-900">1.25x</option>
              <option value="1.5" className="bg-slate-900">1.5x</option>
              <option value="2.0" className="bg-slate-900">2.0x</option>
            </select>
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-400 hover:text-slate-200 cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-16 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
