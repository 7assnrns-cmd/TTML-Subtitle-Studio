import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Mic,
  Square,
  Sparkles,
  Music,
  Loader2,
  AlertCircle,
  FileAudio,
  CheckCircle2,
  Globe2,
  SlidersHorizontal,
  X,
  Zap,
  Cpu,
} from 'lucide-react';
import { SAMPLE_DATASETS } from '../utils/audioSamples';
import { POPULAR_LANGUAGES } from '../utils/languages';
import { UILanguage, getTranslation } from '../utils/i18n';

interface AudioUploaderProps {
  onAnalyzeAudio: (
    file: File | Blob,
    filename: string,
    mimeType: string,
    pauseThreshold: number,
    languageMode: 'auto' | 'manual',
    selectedLanguage: string
  ) => Promise<void>;
  onSelectSample: (sampleId: string) => void;
  isAnalyzing: boolean;
  analysisStep: string;
  analysisProgress?: number;
  pauseThreshold: number;
  setPauseThreshold: (val: number) => void;
  languageMode: 'auto' | 'manual';
  setLanguageMode: (mode: 'auto' | 'manual') => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  lastFile?: { file: File | Blob; name: string; mime: string } | null;
  uiLanguage: UILanguage;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onAnalyzeAudio,
  onSelectSample,
  isAnalyzing,
  analysisStep,
  analysisProgress = 0,
  pauseThreshold,
  setPauseThreshold,
  languageMode,
  setLanguageMode,
  selectedLanguage,
  setSelectedLanguage,
  uiLanguage,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const t = (key: string) => getTranslation(uiLanguage, key);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleFile = (file: File) => {
    setUploadError(null);
    const validMimes = [
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4',
      'audio/aac',
      'audio/ogg',
      'audio/webm',
      'audio/flac',
    ];
    const hasValidExt = /\.(mp3|wav|m4a|aac|ogg|webm|flac)$/i.test(file.name);

    if (!validMimes.includes(file.type) && !hasValidExt) {
      setUploadError('Please select a supported audio format (MP3, WAV, M4A, OGG, AAC, FLAC, or WebM).');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadError('Audio file is larger than the 50MB limit. Please upload a shorter clip.');
      return;
    }

    onAnalyzeAudio(file, file.name, file.type || 'audio/mp3', pauseThreshold, languageMode, selectedLanguage);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const startRecording = async () => {
    setUploadError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        if (audioBlob.size > 1000) {
          onAnalyzeAudio(
            audioBlob,
            `Voice_Recording_${Date.now()}.webm`,
            'audio/webm',
            pauseThreshold,
            languageMode,
            selectedLanguage
          );
        } else {
          setUploadError('Recording was too short or empty. Please speak clearly into your microphone.');
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setUploadError('Microphone access denied or not available. Please grant mic permissions in your settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      audioChunksRef.current = [];
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="relative overflow-hidden backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-4 sm:p-7 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] space-y-5">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-80 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Main Ingestion Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 z-10 relative">
        <div>
          <h2 className="text-base sm:text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <FileAudio className="w-5 h-5 text-cyan-400" />
            {t('ingestionTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('ingestionSubtitle')}
          </p>
        </div>

        {/* Pause sensitivity control */}
        <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-xl px-3 sm:px-4 py-2 shadow-sm">
          <div>
            <div className="text-[11px] text-slate-400">{t('pauseGapSensitivity')}</div>
            <div className="text-xs font-bold text-cyan-400">
              {Math.round(pauseThreshold * 1000)} ms ({pauseThreshold.toFixed(2)}s)
            </div>
          </div>
          <input
            type="range"
            min="0.05"
            max="1.0"
            step="0.05"
            value={pauseThreshold}
            onChange={(e) => setPauseThreshold(parseFloat(e.target.value))}
            className="w-20 sm:w-24 accent-cyan-400 cursor-pointer"
            title="Silence threshold to register a pause event"
          />
        </div>
      </div>

      {/* Language Mode Selector Card */}
      <div className="bg-slate-950/75 backdrop-blur-xl border border-white/10 rounded-xl p-3.5 sm:p-4 space-y-3 z-10 relative">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Globe2 className="w-4 h-4 text-cyan-400" />
            <span>{t('languageAlignmentMode')}</span>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setLanguageMode('auto')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                languageMode === 'auto'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t('autoDetectUniversal')}
            </button>
            <button
              onClick={() => setLanguageMode('manual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                languageMode === 'manual'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t('manualLanguageSelector')}
            </button>
          </div>
        </div>

        {/* Mode Details & Dropdown */}
        {languageMode === 'auto' ? (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-400">
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{t('universalDesc')}</span>
            </p>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase shrink-0">
              {t('universalTag')}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                {t('targetLangLabel')}
              </label>
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-slate-900/90 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-cyan-400 cursor-pointer shadow-inner"
                >
                  {POPULAR_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-100">
                      {lang.name} ({lang.nativeName}) &bull; [{lang.code.toUpperCase()}] &bull; {lang.script} script
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 max-w-sm pt-2 sm:pt-4">
              {t('targetLangHint')}
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{uploadError}</span>
          </div>
          <button
            onClick={() => setUploadError(null)}
            className="p-1 text-rose-400 hover:text-rose-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isAnalyzing ? (
        /* Progress & Processing State */
        <div className="py-8 sm:py-10 px-4 sm:px-6 flex flex-col items-center justify-center text-center space-y-4 bg-slate-950/80 backdrop-blur-2xl border border-indigo-500/40 rounded-2xl shadow-2xl z-10 relative">
          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/25">
              <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin" />
            </div>
          </div>

          <div className="space-y-1 max-w-md w-full">
            <h3 className="text-sm sm:text-lg font-bold text-slate-100 flex items-center justify-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>{t('realtimeAnalyzer')}</span>
            </h3>
            <p className="text-xs sm:text-sm text-indigo-300 font-medium">
              {analysisStep || 'Aligning acoustic waveforms and word tokens...'}
            </p>

            {/* Visual Animated Progress Bar */}
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden mt-3 border border-white/10">
              <div
                className="h-full rounded-full transition-all duration-500 animate-pulse bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500"
                style={{ width: `${Math.max(15, analysisProgress)}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] text-slate-400 pt-2">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Multilingual Code-Switching
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Parallel Cloud Ingestion
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Micro-Timed Apple Music TTML
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 z-10 relative">
          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`lg:col-span-2 relative cursor-pointer border-2 border-dashed rounded-2xl p-6 sm:p-7 flex flex-col items-center justify-center text-center transition-all backdrop-blur-md ${
              isDragging
                ? 'border-cyan-400 bg-cyan-500/15 scale-[0.99]'
                : 'border-white/15 hover:border-cyan-400/60 bg-slate-950/50 hover:bg-slate-950/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.webm"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3 shadow-inner bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
              <UploadCloud className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-200">
              {t('dropzoneTitle')}{' '}
              <span className="text-cyan-400 underline decoration-cyan-400/50 underline-offset-4 font-bold">
                {t('browseFiles')}
              </span>
            </p>
            <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
              {t('dropzoneDesc')}
            </p>
          </div>

          {/* Right Column: Live Mic & Multilingual Preset Demo Buttons */}
          <div className="flex flex-col justify-between gap-3 sm:gap-4">
            {/* Live Mic Recording */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/75 backdrop-blur-xl border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-rose-400" />
                  {t('liveVoiceRecording')}
                </span>
                {isRecording && (
                  <span className="flex items-center gap-1.5 text-xs text-rose-400 font-mono font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    {formatTimer(recordSeconds)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {t('liveVoiceDesc')}
              </p>

              {isRecording ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={stopRecording}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    {t('stopAndAnalyze')}
                  </button>
                  <button
                    onClick={cancelRecording}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer border border-white/10"
                    title="Cancel recording"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={startRecording}
                  className="w-full py-2 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-white/10 transition-colors cursor-pointer backdrop-blur-md"
                >
                  <Mic className="w-3.5 h-3.5 text-rose-400" />
                  {t('startRecording')}
                </button>
              )}
            </div>

            {/* Multilingual Sample Demos */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/75 backdrop-blur-xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {t('instantDemos')}
                </span>
                <span className="text-[10px] text-cyan-300 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 font-mono">
                  {t('instantTestBadge')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_DATASETS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => onSelectSample(sample.id)}
                    className="p-2 text-left rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/5 hover:border-cyan-500/40 text-xs text-slate-200 transition-all group cursor-pointer"
                  >
                    <div className="font-semibold text-slate-200 group-hover:text-cyan-300 truncate text-[11px]">
                      {sample.category}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Music className="w-2.5 h-2.5 text-cyan-400" />
                      {sample.duration}s
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


