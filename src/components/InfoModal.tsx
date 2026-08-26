import React from 'react';
import { X, BookOpen, CheckCircle2, FileCode, Cpu, Sparkles } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-slate-100">
              W3C TTML Architecture &amp; Acoustic Analysis
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-200">
            <h4 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              What is TTML (Timed Text Markup Language)?
            </h4>
            <p className="text-xs text-indigo-300/90 leading-normal">
              TTML is the official W3C XML standard for authoring, exchanging, and delivering synchronized text, subtitles, and captions across broadcast television, streaming platforms (Netflix, Apple, BBC, EBU), and media players.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-100 text-sm">Key Structural Elements in this Studio:</h4>
            <ul className="space-y-2 pl-2">
              <li className="flex items-start gap-2">
                <span className="font-mono text-cyan-400 font-bold shrink-0">&lt;tt&gt;</span>
                <span>The XML root container with standard namespaces (<code className="text-indigo-300">ttp:</code>, <code className="text-indigo-300">tts:</code>, <code className="text-indigo-300">ttm:</code>) and media timebase configuration.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-cyan-400 font-bold shrink-0">&lt;head&gt;</span>
                <span>Defines document metadata, global <code className="text-indigo-300">&lt;styling&gt;</code> rules (font families, text outline, background opacity), and <code className="text-indigo-300">&lt;layout&gt;</code> display regions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-cyan-400 font-bold shrink-0">&lt;p&gt;</span>
                <span>Paragraph tags representing full sentences or phrases with high-level <code className="text-indigo-300">begin</code> and <code className="text-indigo-300">end</code> timestamps.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-cyan-400 font-bold shrink-0">&lt;span&gt;</span>
                <span>Individual word wrappers containing precise millisecond-accurate word start/end bounds and optional pause metadata attributes (<code className="text-indigo-300">ttm:pauseAfter</code>).</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h4 className="font-bold text-slate-100 text-sm">Acoustic Pause Detection Engine:</h4>
            <p className="text-slate-400">
              The Gemini audio model processes the audio waveform, detecting pauses and silences categorized as:
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <strong className="text-rose-400 block mb-0.5">Sentence Boundary (&gt;0.6s)</strong>
                Terminal pause separating thoughts and paragraph blocks.
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <strong className="text-amber-400 block mb-0.5">Syntactic Pause (0.3s - 0.6s)</strong>
                Comma, clause boundary, or rhetorical punctuation.
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <strong className="text-slate-300 block mb-0.5">Breath / Micro Pause (0.1s - 0.3s)</strong>
                Natural respiratory pause or phonetic transition.
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <strong className="text-emerald-400 block mb-0.5">Continuous Speech (&lt;0.1s)</strong>
                Smooth, uninterrupted phonetic liaison between words.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
