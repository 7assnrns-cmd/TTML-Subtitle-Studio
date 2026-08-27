var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_meta = {};
import_dotenv.default.config();
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function repairAndParseJson(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Empty response from AI engine");
  }
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7).trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3).trim();
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3).trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch {
  }
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let startIdx = 0;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }
  const lastBrace = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");
  let endIdx = cleaned.length;
  const maxEnd = Math.max(lastBrace, lastBracket);
  if (maxEnd !== -1) {
    endIdx = maxEnd + 1;
  }
  let coreJson = cleaned.substring(startIdx, endIdx).trim();
  try {
    return JSON.parse(coreJson);
  } catch {
  }
  for (let truncateOffset = 0; truncateOffset <= Math.min(coreJson.length - 10, 800); truncateOffset += 1) {
    let candidate = truncateOffset === 0 ? coreJson : coreJson.substring(0, coreJson.length - truncateOffset).trim();
    candidate = candidate.replace(/,\s*$/, "").replace(/:\s*$/, "").replace(/"[^"]*$/, "");
    let inString = false;
    let escapeNext = false;
    const stack = [];
    for (let i = 0; i < candidate.length; i++) {
      const char = candidate[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === "\\") {
        escapeNext = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === "{") stack.push("{");
        else if (char === "[") stack.push("[");
        else if (char === "}") {
          if (stack.length > 0 && stack[stack.length - 1] === "{") stack.pop();
        } else if (char === "]") {
          if (stack.length > 0 && stack[stack.length - 1] === "[") stack.pop();
        }
      }
    }
    if (inString) {
      candidate += '"';
    }
    candidate = candidate.replace(/,\s*$/, "");
    while (stack.length > 0) {
      const last = stack.pop();
      if (last === "{") candidate += "}";
      else if (last === "[") candidate += "]";
    }
    candidate = candidate.replace(/,\s*([}\]])/g, "$1");
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch {
    }
  }
  throw new Error("Unable to parse phonetic timing data from AI engine. Please retry.");
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "64mb" }));
  app.use(import_express.default.urlencoded({ extended: true, limit: "64mb" }));
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  const responseSchema = {
    type: import_genai.Type.OBJECT,
    properties: {
      title: { type: import_genai.Type.STRING, description: "Derived title or topic of the audio/song" },
      primaryLanguage: { type: import_genai.Type.STRING, description: "Primary ISO 639-1 language code e.g. en, ja, ar, es, fr, de, ko, zh, hi, pt, it, ru, tr, vi, etc." },
      detectedLanguages: {
        type: import_genai.Type.ARRAY,
        description: "List of all detected ISO language codes present in the audio",
        items: { type: import_genai.Type.STRING }
      },
      isCodeSwitched: { type: import_genai.Type.BOOLEAN, description: "True if multiple languages or mixed terms are spoken/sung" },
      duration: { type: import_genai.Type.NUMBER, description: "Estimated audio duration in seconds" },
      paragraphs: {
        type: import_genai.Type.ARRAY,
        description: "Sentences, lyric lines, or logical paragraphs for <p> tags with clean whitespace separation between all words",
        items: {
          type: import_genai.Type.OBJECT,
          properties: {
            text: { type: import_genai.Type.STRING, description: `Sentence or lyric line text with spaces between every word (e.g. "You can't run", NEVER "Youcantrun")` },
            start: { type: import_genai.Type.NUMBER, description: "Start time in seconds relative to this chunk (0-based)" },
            end: { type: import_genai.Type.NUMBER, description: "End time in seconds relative to this chunk" },
            lang: { type: import_genai.Type.STRING, description: "ISO language code for this paragraph" },
            songPart: { type: import_genai.Type.STRING, description: "Apple Music song part e.g. Verse, Chorus, Bridge, Intro, Outro" },
            words: {
              type: import_genai.Type.ARRAY,
              description: "STRICT single word-by-word micro-timing. EVERY SINGLE WORD MUST BE A SEPARATE ENTRY (DO NOT MERGE OR GLUE WORDS).",
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  word: { type: import_genai.Type.STRING, description: `Single spoken/sung word or lyric token (e.g. "You", "can't", "run"). Strictly one word per object.` },
                  start: { type: import_genai.Type.NUMBER, description: "Word acoustic start time in seconds" },
                  end: { type: import_genai.Type.NUMBER, description: "Word acoustic end time in seconds" },
                  pauseAfter: { type: import_genai.Type.NUMBER, description: "Silence gap in seconds until next word starts" },
                  confidence: { type: import_genai.Type.NUMBER, description: "Confidence between 0.0 and 1.0" },
                  lang: { type: import_genai.Type.STRING, description: "Word-level ISO language code if code-switched" }
                },
                required: ["word", "start", "end"]
              }
            }
          },
          required: ["text", "start", "end", "words"]
        }
      }
    },
    required: ["title", "primaryLanguage", "paragraphs"]
  };
  async function performAcousticAnalysis(ai, audioBase64, cleanMimeType, options = {}) {
    const { contextHint = "", languageMode = "auto", selectedLanguage = "en" } = options;
    let languageDirective = "";
    if (languageMode === "manual" && selectedLanguage) {
      languageDirective = `
TARGET LANGUAGE SPECIFIED:
- The user has designated '${selectedLanguage.toUpperCase()}' as the primary spoken/sung language.
- Specialize phonetic boundary alignment for '${selectedLanguage}'.
- Still transcribe any incidental code-switched words in their native script and tag their ISO code if language switches.`;
    } else {
      languageDirective = `
UNIVERSAL MULTILINGUAL & CODE-SWITCHING DETECTION (ANY COMBINATION WORLDWIDE):
- Universally analyze and detect ANY combination of languages spoken or sung in the audio (e.g. Japanese + English + Korean, French + Arabic + Spanish, Hindi + English, Chinese Mandarin + Cantonese, Russian, Portuguese, etc.).
- Transcribe every word in its authentic native script (Kanji/Kana for Japanese, Arabic script, Hangul for Korean, Simplified/Traditional Chinese, Devanagari for Hindi, Cyrillic for Russian, Greek, Hebrew, Latin with accents, etc.).
- Tag every individual code-switched word with its ISO language code ('en', 'ja', 'ar', 'es', 'fr', 'de', 'ko', 'zh', 'hi', 'pt', 'it', 'ru', 'tr', 'vi', etc.).`;
    }
    const prompt = `You are a world-class acoustic phonetician and Apple Music lyric synchronization specialist.
Analyze this audio file thoroughly for Apple Music TTML lyric generation with STRICT WORD-LEVEL GRANULARITY and ZERO WORD CONCATENATION:

MANDATORY WORD-LEVEL & WHITESPACE RULES (NEVER GLUE WORDS):
1. CRITICAL: STRICT WHITESPACE SEPARATION - NEVER concatenate or glue words together. Output "You can't run", NEVER "Youcantrun" or "Youcan'trun". Output "into the blue", NEVER "intotheblue".
2. Every distinct spoken or sung word MUST be an isolated, individual element in the "words" array with its own micro-timestamps ("start" and "end" in seconds as precision floats, e.g. 1.340 to 1.720).
3. NEVER combine multiple words into a single span (e.g. "I love you" must be 3 separate entries: "I", "love", "you").
4. For fast singing, rapid rap vocal tracks, or code-switched phrases, pinpoint exact acoustic boundaries for each individual word/syllable token.
5. In line text, ensure standard spaces separate every word.
6. Identify Apple Music song parts for each line/block: "Verse", "Chorus", "Bridge", "Intro", or "Outro".
${languageDirective}
${contextHint ? `
Context note: ${contextHint}` : ""}`;
    const candidateModels = ["gemini-2.5-flash", "gemini-2.5-pro"];
    let lastError = null;
    let responseText = "";
    for (const modelName of candidateModels) {
      let attempts = 0;
      const maxAttempts = 2;
      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`[TTML Backend] Running acoustic alignment with ${modelName} (attempt ${attempts})...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    data: audioBase64,
                    mimeType: cleanMimeType
                  }
                },
                {
                  text: prompt
                }
              ]
            },
            config: {
              systemInstruction: "You are an acoustic alignment engine that transcribes multilingual songs and speech, calculating exact word-level start/end timestamps and Apple Music song parts (Verse/Chorus) for TTML subtitles. NEVER clump words into sentence blocks. Every word must have separate begin and end micro-timestamps. Output strict JSON.",
              responseMimeType: "application/json",
              responseSchema,
              maxOutputTokens: 8192,
              temperature: 0.1
            }
          });
          if (response && response.text) {
            responseText = response.text;
            console.log(`[TTML Backend] Successfully received timing data from ${modelName}`);
            break;
          }
        } catch (err) {
          lastError = err;
          const errMsg = err?.message || String(err);
          const isQuotaExhausted = err.status === 429 || err.code === 429 || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota") || errMsg.includes("Quota exceeded") || errMsg.includes("429");
          const isTransient503 = err.status === 503 || err.code === 503 || errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE");
          console.warn(`[TTML Backend] Model ${modelName} encountered: ${errMsg.substring(0, 150)}`);
          if (isQuotaExhausted) {
            break;
          } else if (isTransient503 && attempts < maxAttempts) {
            await sleep(1e3 * attempts);
          } else {
            break;
          }
        }
      }
      if (responseText) {
        break;
      }
    }
    if (!responseText) {
      throw lastError || new Error("Unable to analyze audio with AI acoustic engine. Candidate models were unavailable.");
    }
    return repairAndParseJson(responseText);
  }
  function separateGluedWords(rawWord) {
    if (!rawWord || typeof rawWord !== "string") return [];
    let s = rawWord.trim();
    if (!s) return [];
    s = s.replace(/([a-zA-Z0-9])([\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\u0600-\u06ff])/g, "$1 $2");
    s = s.replace(/([\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\u0600-\u06ff])([a-zA-Z0-9])/g, "$1 $2");
    s = s.replace(/([!?,;:।])([a-zA-Z0-9\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\u0600-\u06ff])/g, "$1 $2");
    const tokens = s.split(/\s+/).map((t) => t.trim()).filter(Boolean);
    return tokens.length > 0 ? tokens : [s];
  }
  function normalizeExtractedParagraphs(rawParagraphs, primaryLang = "en", timeOffset = 0, startWordIndex = 1, startParaIndex = 1) {
    let wordCounter = startWordIndex;
    let paraCounter = startParaIndex;
    const detectedLanguagesSet = /* @__PURE__ */ new Set();
    if (primaryLang) detectedLanguagesSet.add(primaryLang);
    const paragraphs = (rawParagraphs || []).map((p) => {
      const pId = `p${paraCounter++}`;
      const pLang = p.lang || primaryLang;
      if (pLang) detectedLanguagesSet.add(pLang);
      const rawWords = Array.isArray(p.words) ? p.words : [];
      const pStart = (Number(p.start) || 0) + timeOffset;
      const pEnd = (Number(p.end) > (Number(p.start) || 0) ? Number(p.end) : (Number(p.start) || 0) + 1) + timeOffset;
      const unpackedWordEntries = [];
      if (rawWords.length === 0 && p.text) {
        const splitWords = separateGluedWords(p.text);
        const wordDuration = Math.max(0.1, (pEnd - pStart) / (splitWords.length || 1));
        splitWords.forEach((sw, idx) => {
          const wStart = pStart + idx * wordDuration;
          const wEnd = Math.min(pEnd, wStart + wordDuration * 0.95);
          unpackedWordEntries.push({
            word: sw.trim(),
            start: Number(wStart.toFixed(3)),
            end: Number(wEnd.toFixed(3)),
            lang: pLang,
            confidence: 0.95,
            pauseAfter: Number((wordDuration * 0.05).toFixed(3))
          });
        });
      } else {
        rawWords.forEach((w) => {
          const wordStr = String(w.word || "").trim();
          if (!wordStr) return;
          const wStart = (Number(w.start) || 0) + timeOffset;
          const wEnd = (Number(w.end) > (Number(w.start) || 0) ? Number(w.end) : (Number(w.start) || 0) + 0.3) + timeOffset;
          const subWords = separateGluedWords(wordStr);
          if (subWords.length > 1) {
            const totalChars = subWords.reduce((acc, sw) => acc + sw.length, 0) || subWords.length;
            const totalInterval = wEnd - wStart;
            let currentSubStart = wStart;
            subWords.forEach((sw) => {
              const charWeight = sw.length / totalChars;
              const subDuration = Math.max(0.08, totalInterval * charWeight);
              const subEnd = Math.min(wEnd, currentSubStart + subDuration);
              unpackedWordEntries.push({
                word: sw.trim(),
                start: Number(currentSubStart.toFixed(3)),
                end: Number(subEnd.toFixed(3)),
                lang: w.lang || pLang,
                confidence: Number(w.confidence ?? 0.95),
                pauseAfter: 0
              });
              currentSubStart = subEnd;
            });
          } else {
            unpackedWordEntries.push({
              word: wordStr.trim(),
              start: Number(wStart.toFixed(3)),
              end: Number(wEnd.toFixed(3)),
              lang: w.lang || pLang,
              confidence: Number(w.confidence ?? 0.95),
              pauseAfter: Number(w.pauseAfter || 0)
            });
          }
        });
      }
      const words = unpackedWordEntries.map((w) => {
        const wId = `${pId}_w${wordCounter++}`;
        const start = Math.max(0, w.start);
        const end = Math.max(start + 0.06, w.end);
        const duration = Number((end - start).toFixed(3));
        const wLang = w.lang || pLang;
        if (wLang) detectedLanguagesSet.add(wLang);
        return {
          id: wId,
          word: w.word.trim(),
          start: Number(start.toFixed(3)),
          end: Number(end.toFixed(3)),
          duration,
          pauseAfter: Number((w.pauseAfter || 0).toFixed(3)),
          pauseType: (w.pauseAfter || 0) > 0.6 ? "sentence" : (w.pauseAfter || 0) > 0.3 ? "syntactic" : (w.pauseAfter || 0) > 0.1 ? "short" : "none",
          confidence: Number((w.confidence ?? 0.95).toFixed(2)),
          lang: wLang !== primaryLang ? wLang : void 0
        };
      });
      for (let i = 0; i < words.length - 1; i++) {
        const currentWord = words[i];
        const nextWord = words[i + 1];
        const actualGap = Number((nextWord.start - currentWord.end).toFixed(3));
        if (actualGap > 0.04) {
          currentWord.pauseAfter = actualGap;
          currentWord.pauseType = actualGap > 0.6 ? "sentence" : actualGap > 0.3 ? "syntactic" : "short";
        }
      }
      const lineText = words.map((w) => w.word.trim()).join(" ").replace(/\s+/g, " ").trim();
      return {
        id: pId,
        text: lineText || p.text || "",
        start: words[0]?.start ?? pStart,
        end: words[words.length - 1]?.end ?? pEnd,
        lang: pLang,
        songPart: p.songPart || void 0,
        words
      };
    });
    return {
      paragraphs,
      nextWordIndex: wordCounter,
      nextParaIndex: paraCounter,
      detectedLanguages: Array.from(detectedLanguagesSet)
    };
  }
  app.post("/api/analyze-chunk", async (req, res) => {
    req.setTimeout(3e5);
    res.setTimeout(3e5);
    try {
      const {
        audioBase64,
        mimeType = "audio/wav",
        chunkIndex = 0,
        totalChunks = 1,
        timeOffset = 0,
        startWordIndex = 1,
        startParaIndex = 1,
        titleHint = "",
        languageMode = "auto",
        selectedLanguage = "en"
      } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ error: "Audio data is required (audioBase64)." });
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured in server environment." });
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      const cleanMimeType = mimeType.split(";")[0].trim() || "audio/wav";
      const contextHint = `Chunk ${chunkIndex + 1} of ${totalChunks}. Global time offset: ${timeOffset}s. Track: ${titleHint}`;
      const parsedData = await performAcousticAnalysis(ai, audioBase64, cleanMimeType, {
        contextHint,
        languageMode,
        selectedLanguage
      });
      const defaultLang = languageMode === "manual" && selectedLanguage ? selectedLanguage : parsedData.primaryLanguage || "en";
      const normalized = normalizeExtractedParagraphs(
        parsedData.paragraphs || [],
        defaultLang,
        Number(timeOffset) || 0,
        Number(startWordIndex) || 1,
        Number(startParaIndex) || 1
      );
      res.json({
        chunkIndex,
        totalChunks,
        timeOffset,
        title: parsedData.title || titleHint,
        primaryLanguage: defaultLang,
        detectedLanguages: normalized.detectedLanguages,
        isCodeSwitched: parsedData.isCodeSwitched || normalized.detectedLanguages.length > 1,
        paragraphs: normalized.paragraphs,
        nextWordIndex: normalized.nextWordIndex,
        nextParaIndex: normalized.nextParaIndex
      });
    } catch (err) {
      console.error("[TTML Backend] Chunk Analysis Error:", err?.message || err);
      const errMsg = String(err?.message || err);
      const isQuota = errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota") || errMsg.includes("Quota exceeded") || errMsg.includes("429");
      const is503 = errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE");
      res.status(isQuota ? 429 : is503 ? 503 : 500).json({
        error: isQuota ? "Gemini API free-tier request limit reached for this minute. Please retry in 30-60 seconds, or load a built-in demo track." : is503 ? "The AI transcription service is temporarily busy. Please retry in a moment." : err.message || "Failed to process audio chunk."
      });
    }
  });
  app.post("/api/analyze-audio", async (req, res) => {
    req.setTimeout(3e5);
    res.setTimeout(3e5);
    try {
      const {
        audioBase64,
        mimeType = "audio/mp3",
        filename = "audio.mp3",
        pauseThreshold = 0.2,
        languageMode = "auto",
        selectedLanguage = "en"
      } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ error: "Audio data is required (audioBase64)." });
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured in server environment."
        });
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const cleanMimeType = mimeType.split(";")[0].trim() || "audio/mp3";
      const parsedData = await performAcousticAnalysis(ai, audioBase64, cleanMimeType, {
        contextHint: `Track title: ${filename}`,
        languageMode,
        selectedLanguage
      });
      const defaultLang = languageMode === "manual" && selectedLanguage ? selectedLanguage : parsedData.primaryLanguage || "en";
      const normalized = normalizeExtractedParagraphs(
        parsedData.paragraphs || [],
        defaultLang,
        0,
        1,
        1
      );
      const allWords = [];
      const pauseEvents = [];
      let totalSpeechDuration = 0;
      let totalPauseDuration = 0;
      let longestPause = 0;
      let maxEnd = Number(parsedData.duration) || 0;
      normalized.paragraphs.forEach((p) => {
        p.words.forEach((w) => {
          allWords.push(w);
          totalSpeechDuration += w.duration;
          if (w.end > maxEnd) maxEnd = w.end;
        });
      });
      for (let i = 0; i < allWords.length - 1; i++) {
        const current = allWords[i];
        const next = allWords[i + 1];
        const gap = Number((next.start - current.end).toFixed(3));
        if (gap >= pauseThreshold) {
          totalPauseDuration += gap;
          if (gap > longestPause) longestPause = gap;
          pauseEvents.push({
            id: `pause_${i + 1}`,
            start: current.end,
            end: next.start,
            duration: gap,
            prevWord: current.word,
            nextWord: next.word,
            type: gap > 0.8 ? "sentence-break" : gap > 0.4 ? "syntactic" : gap > 0.2 ? "breath" : "hesitation"
          });
        }
      }
      const totalWords = allWords.length;
      const minutes = (maxEnd || totalSpeechDuration + totalPauseDuration) / 60;
      const wordsPerMinute = minutes > 0 ? Math.round(totalWords / minutes) : 0;
      const speechToSilenceRatio = totalPauseDuration > 0 ? Number((totalSpeechDuration / totalPauseDuration).toFixed(2)) : 100;
      const detectedLanguagesList = normalized.detectedLanguages;
      const isCodeSwitched = parsedData.isCodeSwitched || detectedLanguagesList.length > 1;
      const result = {
        title: parsedData.title || filename.replace(/\.[^/.]+$/, ""),
        language: defaultLang,
        detectedLanguages: detectedLanguagesList,
        isCodeSwitched,
        duration: Number(maxEnd.toFixed(2)),
        paragraphs: normalized.paragraphs,
        words: allWords,
        pauses: pauseEvents,
        rawTranscript: parsedData.rawTranscript || normalized.paragraphs.map((p) => p.text).join("\n"),
        stats: {
          totalWords,
          totalSpeechDuration: Number(totalSpeechDuration.toFixed(2)),
          totalPauseDuration: Number(totalPauseDuration.toFixed(2)),
          pauseCount: pauseEvents.length,
          wordsPerMinute,
          speechToSilenceRatio,
          averageWordDuration: totalWords > 0 ? Number((totalSpeechDuration / totalWords).toFixed(3)) : 0,
          longestPause: Number(longestPause.toFixed(3)),
          detectedLanguagesCount: detectedLanguagesList.length
        }
      };
      res.json(result);
    } catch (err) {
      console.error("[TTML Backend] Audio Analysis Error:", err?.message || err);
      const errMsg = String(err?.message || err);
      const isQuota = errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota") || errMsg.includes("Quota exceeded") || errMsg.includes("429");
      const is503 = errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE");
      const errorMessage = isQuota ? "Gemini API free-tier request limit reached for this minute. Please retry in 30-60 seconds, or select an instant demo preset." : is503 ? 'The AI transcription service is temporarily experiencing peak load. Please try clicking "Retry" or test with our instant sample presets.' : err.message || "Failed to analyze audio and generate Apple Music TTML timings.";
      res.status(isQuota ? 429 : is503 ? 503 : 500).json({
        error: errorMessage,
        isUnavailable: is503 || isQuota,
        details: String(err)
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TTML Subtitle Studio server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
