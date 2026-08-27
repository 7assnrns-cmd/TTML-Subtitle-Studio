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
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
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
      agents: {
        type: import_genai.Type.ARRAY,
        description: "List of distinct vocalists, singers, or vocal roles detected in the audio for Apple Music TTML head metadata",
        items: {
          type: import_genai.Type.OBJECT,
          properties: {
            id: { type: import_genai.Type.STRING, description: 'Agent ID e.g. "v1" (Lead), "v2" (Featured/Duet), "v_bg" (Backing Vocals/Choir)' },
            name: { type: import_genai.Type.STRING, description: 'Human-readable name or role e.g. "Lead Vocalist", "Singer 2", "Backing Harmonies"' },
            type: { type: import_genai.Type.STRING, description: 'Agent type: "person", "group", or "other"' },
            role: { type: import_genai.Type.STRING, description: 'Vocal role: "lead", "featured", "background", "harmony", or "adlib"' }
          },
          required: ["id", "name", "type"]
        }
      },
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
            agentId: { type: import_genai.Type.STRING, description: 'Assigned singer agent ID (e.g. "v1" for lead singer, "v2" for second singer, "v_bg" for backing vocals)' },
            role: { type: import_genai.Type.STRING, description: 'Vocal line role: "lead", "featured", "background", "harmony", or "adlib"' },
            isBackground: { type: import_genai.Type.BOOLEAN, description: "True if this line represents secondary vocal layers, overlapping harmonies, or background ad-libs" },
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
                  lang: { type: import_genai.Type.STRING, description: "Word-level ISO language code if code-switched" },
                  agentId: { type: import_genai.Type.STRING, description: "Singer ID for this specific word/span" },
                  isBackground: { type: import_genai.Type.BOOLEAN, description: "True if sung by background/harmony" }
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
Analyze this audio file thoroughly for Apple Music TTML lyric generation with STRICT WORD-LEVEL GRANULARITY, ZERO WORD CONCATENATION, MULTI-SINGER AGENT IDENTIFICATION, and BACKGROUND HARMONIES DETECTION:

MANDATORY RULES:
1. CRITICAL: STRICT WHITESPACE SEPARATION - NEVER concatenate or glue words together. Output "You can't run", NEVER "Youcantrun" or "Youcan'trun". Output "into the blue", NEVER "intotheblue". Output "I lost it I will wait at the end", NEVER "ilostitlwilwaitattheend".
2. Every distinct spoken or sung word MUST be an isolated, individual element in the "words" array with its own micro-timestamps ("start" and "end" in seconds as precision floats, e.g. 1.340 to 1.720).
3. NEVER combine multiple words into a single span (e.g. "I love you" must be 3 separate entries: "I", "love", "you").
4. MULTI-SINGER & AGENTS:
   - Identify distinct singers in the audio.
   - Assign "agentId" to each paragraph and word ("v1" for primary lead vocalist, "v2" for secondary/featured singer, "v_bg" for backing vocals/choir/harmonies).
   - In "agents", provide a list of all detected singers with their name and type (e.g. [{ "id": "v1", "name": "Lead Vocalist", "type": "person", "role": "lead" }]).
5. BACKGROUND VOCALS & HARMONIES:
   - Accurately detect secondary vocal layers, overlapping harmonies, ad-libs, and background singing.
   - For background vocal phrases or simultaneous harmonies, set "isBackground": true, "role": "harmony" (or "background"), and "agentId": "v_bg".
   - Note that background vocal paragraphs CAN overlap in start/end time with lead vocal paragraphs when sung simultaneously!
6. In line text, ensure standard spaces separate every word.
7. Identify Apple Music song parts for each line/block: "Verse", "Chorus", "Bridge", "Intro", or "Outro".
${languageDirective}
${contextHint ? `
Context note: ${contextHint}` : ""}`;
    const candidateModels = ["gemini-3.7-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-3.5-transcribe"];
    let lastError = null;
    let responseText = "";
    const sysInstruction = "You are an acoustic alignment engine that transcribes multilingual songs and speech, calculating exact word-level start/end timestamps and Apple Music song parts (Verse/Chorus) for TTML subtitles. NEVER clump words into sentence blocks. Every word must have separate begin and end micro-timestamps. Output strict JSON.";
    for (const modelName of candidateModels) {
      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`[TTML Backend] Running acoustic alignment with ${modelName} (attempt ${attempts}/${maxAttempts})...`);
          const configObj = {
            maxOutputTokens: 8192,
            temperature: 0.1
          };
          if (!modelName.includes("transcribe")) {
            configObj.systemInstruction = sysInstruction;
          }
          const userPromptText = modelName.includes("transcribe") ? `${sysInstruction}

${prompt}` : prompt;
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
                  text: userPromptText
                }
              ]
            },
            config: configObj
          });
          if (response && response.text) {
            responseText = response.text;
            console.log(`[TTML Backend] Successfully received timing data from ${modelName}`);
            break;
          }
        } catch (err) {
          lastError = err;
          const errMsg = err?.message || String(err);
          const isNotFound404 = err.status === 404 || err.code === 404 || errMsg.includes("404") || errMsg.includes("NOT_FOUND") || errMsg.includes("no longer available");
          const isInvalidArgument400 = err.status === 400 || err.code === 400 || errMsg.includes("400") || errMsg.includes("INVALID_ARGUMENT") || errMsg.includes("Developer instruction") || errMsg.includes("not enabled");
          const isQuotaExhausted = err.status === 429 || err.code === 429 || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota") || errMsg.includes("Quota exceeded") || errMsg.includes("429");
          const isTransient503 = err.status === 503 || err.code === 503 || errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE") || errMsg.includes("temporary");
          console.warn(`[TTML Backend] Model ${modelName} attempt ${attempts} encountered: ${errMsg.substring(0, 150)}`);
          if (isNotFound404 || isInvalidArgument400) {
            break;
          } else if (isQuotaExhausted) {
            break;
          } else if (isTransient503) {
            if (attempts < maxAttempts) {
              const backoffMs = 1500 * attempts + Math.floor(Math.random() * 500);
              console.log(`[TTML Backend] 503 High Demand on ${modelName}. Backing off for ${backoffMs}ms before retry...`);
              await sleep(backoffMs);
            } else {
              console.log(`[TTML Backend] ${modelName} remains busy after ${maxAttempts} attempts. Failing over to next candidate model...`);
              break;
            }
          } else {
            if (attempts < maxAttempts) {
              await sleep(1e3 * attempts);
            } else {
              break;
            }
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
  const WORD_FREQUENCIES = {
    the: 100,
    be: 95,
    to: 95,
    of: 95,
    and: 95,
    a: 95,
    in: 95,
    that: 90,
    have: 90,
    i: 95,
    it: 95,
    for: 90,
    not: 90,
    on: 90,
    with: 90,
    he: 90,
    as: 90,
    you: 95,
    do: 90,
    at: 90,
    this: 85,
    but: 85,
    his: 85,
    by: 85,
    from: 85,
    they: 85,
    we: 90,
    say: 80,
    her: 85,
    she: 85,
    or: 85,
    an: 85,
    will: 90,
    my: 90,
    one: 85,
    all: 85,
    would: 80,
    there: 80,
    their: 80,
    what: 85,
    so: 85,
    up: 85,
    out: 85,
    if: 85,
    about: 80,
    who: 80,
    get: 80,
    which: 80,
    go: 80,
    me: 90,
    when: 80,
    make: 80,
    can: 85,
    like: 80,
    time: 80,
    no: 85,
    just: 80,
    him: 80,
    know: 80,
    take: 80,
    people: 75,
    into: 80,
    year: 75,
    your: 85,
    good: 75,
    some: 75,
    could: 75,
    them: 80,
    see: 80,
    other: 75,
    than: 75,
    then: 75,
    now: 80,
    look: 75,
    only: 75,
    come: 75,
    its: 80,
    over: 75,
    think: 75,
    also: 70,
    back: 75,
    after: 75,
    use: 70,
    two: 75,
    how: 75,
    our: 80,
    work: 70,
    first: 70,
    well: 75,
    way: 75,
    even: 70,
    new: 70,
    want: 75,
    because: 70,
    any: 70,
    these: 70,
    give: 70,
    most: 70,
    us: 80,
    are: 90,
    is: 95,
    was: 90,
    were: 85,
    been: 85,
    am: 85,
    has: 85,
    had: 85,
    lost: 75,
    wait: 75,
    waiting: 75,
    end: 75,
    ending: 70,
    start: 70,
    started: 70,
    love: 85,
    lover: 75,
    lovers: 70,
    loving: 75,
    loved: 75,
    heart: 80,
    hearts: 75,
    soul: 75,
    souls: 70,
    mind: 75,
    minds: 70,
    dream: 75,
    dreams: 75,
    dreamer: 70,
    dreaming: 75,
    night: 80,
    nights: 75,
    day: 80,
    days: 75,
    dawn: 70,
    dusk: 70,
    sun: 75,
    moon: 75,
    star: 75,
    stars: 75,
    sky: 80,
    skies: 75,
    light: 80,
    lights: 75,
    dark: 75,
    darkness: 70,
    shadow: 70,
    shadows: 70,
    shade: 65,
    glow: 70,
    glowing: 70,
    shine: 75,
    shining: 75,
    bright: 70,
    brighter: 65,
    brightest: 65,
    clear: 70,
    wind: 75,
    winds: 70,
    breeze: 65,
    air: 75,
    breath: 70,
    breathe: 70,
    breathing: 70,
    whisper: 75,
    whispers: 75,
    whispering: 75,
    whispered: 70,
    write: 75,
    writes: 70,
    writing: 75,
    written: 70,
    wrote: 70,
    ear: 70,
    ears: 70,
    eye: 75,
    eyes: 75,
    hear: 75,
    hears: 70,
    hearing: 70,
    heard: 75,
    listen: 75,
    listening: 70,
    voice: 75,
    voices: 75,
    sound: 75,
    sounds: 70,
    silent: 70,
    silence: 70,
    echo: 70,
    echoes: 70,
    echoing: 70,
    flame: 70,
    flames: 70,
    fire: 75,
    fires: 70,
    burn: 70,
    burns: 65,
    burning: 70,
    burned: 65,
    spark: 65,
    sparks: 65,
    smoke: 65,
    rain: 75,
    raining: 70,
    storm: 70,
    storms: 65,
    thunder: 65,
    lightning: 65,
    cloud: 70,
    clouds: 70,
    snow: 65,
    ice: 65,
    cold: 70,
    warm: 70,
    heat: 65,
    ocean: 70,
    oceans: 65,
    sea: 75,
    seas: 70,
    wave: 70,
    waves: 70,
    river: 70,
    water: 75,
    deep: 75,
    deeper: 65,
    deepest: 65,
    depth: 65,
    depths: 65,
    fly: 75,
    flying: 70,
    flew: 65,
    flown: 65,
    wing: 70,
    wings: 70,
    feather: 60,
    soar: 65,
    soaring: 65,
    run: 75,
    runs: 70,
    running: 75,
    ran: 70,
    walk: 70,
    walking: 70,
    walked: 65,
    step: 70,
    steps: 65,
    sing: 75,
    sings: 70,
    singing: 75,
    sang: 65,
    sung: 65,
    song: 80,
    songs: 75,
    melody: 70,
    melodies: 65,
    rhythm: 65,
    beat: 70,
    beats: 65,
    harmony: 70,
    harmonies: 65,
    chord: 60,
    tune: 65,
    life: 80,
    lives: 75,
    living: 75,
    alive: 75,
    die: 70,
    dying: 65,
    dead: 70,
    death: 70,
    born: 70,
    world: 80,
    worlds: 70,
    earth: 70,
    land: 70,
    ground: 70,
    space: 70,
    universe: 65,
    cosmos: 60,
    horizon: 65,
    hold: 75,
    holds: 70,
    holding: 75,
    held: 70,
    touch: 75,
    touches: 65,
    touching: 70,
    touched: 70,
    feel: 80,
    feels: 75,
    feeling: 80,
    felt: 75,
    stand: 75,
    stands: 70,
    standing: 75,
    stood: 70,
    fall: 75,
    falls: 70,
    falling: 75,
    fell: 70,
    fallen: 70,
    rise: 70,
    rising: 70,
    rose: 70,
    stay: 75,
    stays: 65,
    staying: 70,
    stayed: 65,
    leave: 75,
    leaves: 70,
    leaving: 70,
    left: 75,
    gone: 75,
    went: 75,
    bring: 75,
    brings: 70,
    bringing: 70,
    brought: 75,
    find: 75,
    finds: 70,
    finding: 70,
    found: 75,
    seek: 65,
    search: 65,
    break: 70,
    breaks: 65,
    breaking: 70,
    broke: 70,
    broken: 75,
    keep: 75,
    keeps: 70,
    keeping: 70,
    kept: 70,
    save: 70,
    saves: 65,
    saving: 65,
    saved: 65,
    tell: 75,
    tells: 70,
    telling: 70,
    told: 75,
    speak: 70,
    speaks: 65,
    speaking: 70,
    spoke: 65,
    spoken: 65,
    call: 75,
    calls: 70,
    calling: 75,
    called: 70,
    shout: 65,
    scream: 65,
    cry: 70,
    cries: 65,
    crying: 70,
    tear: 70,
    tears: 75,
    smile: 70,
    smiles: 65,
    laugh: 65,
    laughter: 65,
    hope: 75,
    hopes: 70,
    hoping: 70,
    faith: 70,
    trust: 70,
    truth: 75,
    true: 75,
    lie: 70,
    lies: 70,
    lying: 65,
    free: 75,
    freedom: 70,
    again: 80,
    blue: 75,
    red: 75,
    white: 75,
    black: 75,
    gold: 70,
    golden: 70,
    silver: 65,
    forever: 75,
    always: 80,
    never: 80,
    together: 80,
    alone: 75,
    lonely: 70,
    away: 80,
    down: 80,
    under: 75,
    inside: 75,
    outside: 75,
    within: 75,
    without: 75,
    before: 75,
    while: 75,
    where: 80,
    here: 85,
    everywhere: 70,
    nowhere: 65,
    somewhere: 70,
    something: 75,
    nothing: 75,
    everything: 80,
    anything: 75,
    someone: 75,
    nobody: 70,
    everybody: 70,
    anyone: 70,
    noone: 65,
    better: 75,
    best: 75,
    bad: 70,
    worse: 65,
    worst: 65,
    sweet: 70,
    bitter: 65,
    wild: 70,
    calm: 65,
    high: 75,
    higher: 70,
    highest: 65,
    low: 70,
    lower: 65,
    far: 75,
    near: 70,
    close: 75,
    pure: 65,
    holy: 65,
    magic: 70,
    magical: 65,
    wonder: 70,
    wonders: 65,
    wonderful: 70,
    secret: 70,
    secrets: 70,
    hidden: 70,
    eternal: 70,
    endless: 70,
    boundless: 65,
    timeless: 65,
    strong: 70,
    weak: 65,
    brave: 65,
    fear: 70,
    fears: 65,
    afraid: 70,
    bravery: 60,
    courage: 65,
    peace: 70,
    war: 70,
    battle: 65,
    fight: 70,
    fighting: 65,
    fought: 65,
    champion: 70,
    champions: 70,
    hero: 70,
    heroes: 65,
    moment: 75,
    moments: 70,
    second: 70,
    seconds: 70,
    minute: 70,
    minutes: 70,
    hour: 70,
    hours: 70,
    friend: 75,
    friends: 70,
    home: 75,
    house: 70,
    city: 70,
    street: 70,
    road: 70,
    path: 70,
    track: 70,
    door: 70,
    window: 65,
    wall: 65,
    gate: 65,
    bridge: 70,
    head: 75,
    face: 75,
    hand: 80,
    hands: 80,
    arm: 70,
    arms: 75,
    body: 75,
    blood: 70,
    word: 75,
    words: 80,
    story: 75,
    stories: 70,
    line: 75,
    lines: 70,
    morning: 75,
    evening: 70,
    midnight: 70,
    tonight: 80,
    today: 80,
    tomorrow: 75,
    yesterday: 70,
    summer: 70,
    winter: 70,
    autumn: 65,
    spring: 70,
    season: 65,
    flower: 70,
    flowers: 70,
    roses: 70,
    tree: 70,
    trees: 70,
    angel: 70,
    angels: 70,
    heaven: 70,
    paradise: 65,
    hell: 65,
    destiny: 70,
    fate: 70,
    pulse: 65,
    vibe: 65,
    vibes: 65,
    energy: 70,
    power: 75,
    spirit: 70,
    cant: 80,
    "can't": 85,
    dont: 80,
    "don't": 85,
    wont: 75,
    "won't": 80,
    isnt: 75,
    "isn't": 80,
    lets: 75,
    "let's": 80,
    youre: 80,
    "you're": 85,
    theyre: 75,
    "they're": 80,
    weve: 75,
    "we've": 80,
    ive: 80,
    "i've": 85,
    im: 85,
    "i'm": 90,
    didnt: 75,
    "didn't": 80,
    couldnt: 70,
    "couldn't": 75,
    shouldnt: 70,
    "shouldn't": 75,
    wouldnt: 70,
    "wouldn't": 75,
    wasnt: 75,
    "wasn't": 80,
    thats: 80,
    "that's": 85,
    theres: 75,
    "there's": 80,
    whats: 75,
    "what's": 80,
    hes: 75,
    "he's": 80,
    shes: 75,
    "she's": 80,
    itll: 70,
    "it'll": 75,
    youll: 75,
    "you'll": 80,
    ill: 75,
    "i'll": 80,
    "we'll": 80,
    gonna: 80,
    wanna: 80,
    gotta: 75,
    kinda: 70,
    tryna: 70,
    bout: 70,
    "'bout": 70,
    cause: 75,
    "'cause": 75,
    cuz: 70,
    cos: 70,
    til: 70,
    till: 75,
    yeah: 80,
    oh: 85,
    ah: 80,
    ooh: 75,
    wow: 70,
    hey: 75,
    yo: 65,
    la: 70,
    na: 70,
    wil: 75
  };
  const COMMON_WORDS_SET = new Set(Object.keys(WORD_FREQUENCIES));
  function decomposeConcatenatedWord(rawToken) {
    if (!rawToken || typeof rawToken !== "string") return null;
    const punctMatch = rawToken.match(/^([(\[{'"]*)([a-zA-Z0-9'_-]+)([)\]}'".,!?:;]*)$/);
    const prefixPunct = punctMatch ? punctMatch[1] : "";
    const coreString = punctMatch ? punctMatch[2] : rawToken;
    const suffixPunct = punctMatch ? punctMatch[3] : "";
    const clean = coreString.replace(/[^a-zA-Z]/g, "").toLowerCase();
    const n = clean.length;
    if (n < 2) return null;
    if (COMMON_WORDS_SET.has(clean) && clean.length <= 5 && !["init", "atme", "tome", "inmy", "onmy", "goto", "seeme"].includes(clean)) {
      return null;
    }
    const memo = /* @__PURE__ */ new Map();
    function solve(startIndex) {
      if (startIndex === n) return { words: [], score: 0 };
      if (memo.has(startIndex)) return memo.get(startIndex);
      let bestResult = null;
      for (let len = 1; len <= Math.min(22, n - startIndex); len++) {
        const end = startIndex + len;
        const sub = clean.slice(startIndex, end);
        let isSingleLetterValid = false;
        let singleLetterScore = 0;
        if (len === 1) {
          if (sub === "a" || sub === "i") {
            isSingleLetterValid = true;
            singleLetterScore = 80;
          } else if (sub === "l") {
            isSingleLetterValid = true;
            singleLetterScore = 60;
          } else {
            continue;
          }
        }
        const freq = WORD_FREQUENCIES[sub];
        const isRecognized = Boolean(freq) || isSingleLetterValid;
        if (isRecognized) {
          const subScore = freq ? freq * (len >= 3 ? 1.5 : 1) : singleLetterScore;
          const rest = solve(end);
          if (rest !== null) {
            const totalScore = subScore + rest.score + 50;
            if (bestResult === null || totalScore > bestResult.score) {
              let actualWord = coreString.slice(startIndex, end);
              if (sub === "l" && len === 1) actualWord = "i";
              if (sub === "wil") actualWord = "will";
              if (sub === "cant") actualWord = "can't";
              if (sub === "dont") actualWord = "don't";
              if (sub === "im") actualWord = "i'm";
              if (sub === "ive") actualWord = "i've";
              if (sub === "youre") actualWord = "you're";
              if (sub === "thats") actualWord = "that's";
              bestResult = {
                words: [actualWord, ...rest.words],
                score: totalScore
              };
            }
          }
        }
      }
      memo.set(startIndex, bestResult);
      return bestResult;
    }
    const result = solve(0);
    if (result && result.words.length > 1) {
      const tokens = [...result.words];
      if (prefixPunct) tokens[0] = prefixPunct + tokens[0];
      if (suffixPunct) tokens[tokens.length - 1] = tokens[tokens.length - 1] + suffixPunct;
      return tokens;
    }
    return null;
  }
  function separateGluedWords(rawWord) {
    if (!rawWord || typeof rawWord !== "string") return [];
    let s = rawWord.trim();
    if (!s) return [];
    s = s.replace(/([a-zA-Z0-9])([\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\u0600-\u06ff\u0900-\u097f\u0400-\u04ff])/g, "$1 $2");
    s = s.replace(/([\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\u0600-\u06ff\u0900-\u097f\u0400-\u04ff])([a-zA-Z0-9])/g, "$1 $2");
    s = s.replace(/([!?,;:।~—–\)\(\]\[\}\{\/\\])([a-zA-Z0-9\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\u0600-\u06ff])/g, "$1 $2");
    s = s.replace(/([a-zA-Z0-9\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\u0600-\u06ff])([(\[{])/g, "$1 $2");
    s = s.replace(/([0-9])([a-zA-Z])/g, "$1 $2");
    s = s.replace(/([a-zA-Z])([0-9])/g, "$1 $2");
    s = s.replace(/([a-z])([A-Z])/g, "$1 $2");
    s = s.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
    const initialTokens = s.split(/\s+/).map((t) => t.trim()).filter(Boolean);
    const finalTokens = [];
    for (const token of initialTokens) {
      const cleanAlpha = token.replace(/[^a-zA-Z]/g, "").toLowerCase();
      if (cleanAlpha.length >= 3) {
        const decomposed = decomposeConcatenatedWord(token);
        if (decomposed && decomposed.length > 1) {
          finalTokens.push(...decomposed);
          continue;
        }
      }
      finalTokens.push(token);
    }
    return finalTokens.length > 0 ? finalTokens : [s];
  }
  function normalizeExtractedParagraphs(rawParagraphs, primaryLang = "en", timeOffset = 0, startWordIndex = 1, startParaIndex = 1) {
    let wordCounter = startWordIndex;
    let paraCounter = startParaIndex;
    const detectedLanguagesSet = /* @__PURE__ */ new Set();
    if (primaryLang) detectedLanguagesSet.add(primaryLang);
    const detectedAgentIds = /* @__PURE__ */ new Set();
    const paragraphs = (rawParagraphs || []).map((p) => {
      const pId = `p${paraCounter++}`;
      const pLang = p.lang || primaryLang;
      if (pLang) detectedLanguagesSet.add(pLang);
      const isBg = Boolean(p.isBackground || p.role === "harmony" || p.role === "background" || String(p.text || "").startsWith("("));
      const pRole = p.role || (isBg ? "harmony" : "lead");
      const pAgentId = p.agentId || (isBg ? "v_bg" : "v1");
      detectedAgentIds.add(pAgentId);
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
            pauseAfter: Number((wordDuration * 0.05).toFixed(3)),
            agentId: pAgentId,
            isBackground: isBg
          });
        });
      } else {
        rawWords.forEach((w) => {
          const wordStr = String(w.word || "").trim();
          if (!wordStr) return;
          const wStart = (Number(w.start) || 0) + timeOffset;
          const wEnd = (Number(w.end) > (Number(w.start) || 0) ? Number(w.end) : (Number(w.start) || 0) + 0.3) + timeOffset;
          const subWords = separateGluedWords(wordStr);
          const wAgentId = w.agentId || pAgentId;
          const wIsBg = w.isBackground !== void 0 ? Boolean(w.isBackground) : isBg;
          if (subWords.length > 1) {
            const weights = subWords.map((sw) => {
              const vowels = (sw.match(/[aeiouy]/gi) || []).length;
              return Math.max(1, sw.length + vowels * 0.5);
            });
            const totalWeight = weights.reduce((a, b) => a + b, 0) || subWords.length;
            const totalInterval = wEnd - wStart;
            let currentSubStart = wStart;
            subWords.forEach((sw, idx) => {
              const charWeight = weights[idx] / totalWeight;
              const subDuration = Math.max(0.06, totalInterval * charWeight);
              const subEnd = idx === subWords.length - 1 ? wEnd : Math.min(wEnd, currentSubStart + subDuration * 0.95);
              unpackedWordEntries.push({
                word: sw.trim(),
                start: Number(currentSubStart.toFixed(3)),
                end: Number(subEnd.toFixed(3)),
                lang: w.lang || pLang,
                confidence: Number(w.confidence ?? 0.95),
                pauseAfter: idx === subWords.length - 1 ? Number(w.pauseAfter || 0) : 0.02,
                agentId: wAgentId,
                isBackground: wIsBg
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
              pauseAfter: Number(w.pauseAfter || 0),
              agentId: wAgentId,
              isBackground: wIsBg
            });
          }
        });
      }
      let runningWordEnd = pStart;
      const words = unpackedWordEntries.map((w) => {
        const wId = `${pId}_w${wordCounter++}`;
        const start = Math.max(runningWordEnd, w.start);
        const end = Math.max(start + 0.04, w.end);
        const duration = Number((end - start).toFixed(3));
        runningWordEnd = end;
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
          lang: wLang !== primaryLang ? wLang : void 0,
          agentId: w.agentId || pAgentId,
          isBackground: w.isBackground ?? isBg
        };
      });
      for (let i = 0; i < words.length - 1; i++) {
        const currentWord = words[i];
        const nextWord = words[i + 1];
        const actualGap = Number((nextWord.start - currentWord.end).toFixed(3));
        if (actualGap > 0.03) {
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
        agentId: pAgentId,
        role: pRole,
        isBackground: isBg,
        words
      };
    });
    return {
      paragraphs,
      nextWordIndex: wordCounter,
      nextParaIndex: paraCounter,
      detectedLanguages: Array.from(detectedLanguagesSet),
      detectedAgentIds: Array.from(detectedAgentIds)
    };
  }
  function buildAgentsList(parsedAgents = [], paragraphs = [], detectedAgentIds = []) {
    const agentsMap = /* @__PURE__ */ new Map();
    agentsMap.set("v1", { id: "v1", name: "Lead Vocalist", type: "person", role: "lead" });
    if (Array.isArray(parsedAgents)) {
      parsedAgents.forEach((a) => {
        if (a && a.id) {
          agentsMap.set(a.id, {
            id: String(a.id),
            name: a.name || (a.id === "v1" ? "Lead Vocalist" : a.id === "v_bg" ? "Backing Harmonies" : `Singer ${a.id}`),
            type: a.type === "group" || a.type === "other" ? a.type : "person",
            role: a.role || (a.id === "v_bg" ? "background" : a.id === "v1" ? "lead" : "featured")
          });
        }
      });
    }
    paragraphs.forEach((p) => {
      if (p.agentId && !agentsMap.has(p.agentId)) {
        if (p.agentId === "v_bg" || p.isBackground) {
          agentsMap.set("v_bg", { id: "v_bg", name: "Backing Harmonies", type: "group", role: "background" });
        } else if (p.agentId === "v2") {
          agentsMap.set("v2", { id: "v2", name: "Duet Vocalist", type: "person", role: "featured" });
        } else {
          agentsMap.set(p.agentId, { id: p.agentId, name: `Singer ${p.agentId}`, type: "person", role: p.role || "featured" });
        }
      }
      if (p.isBackground && !agentsMap.has("v_bg")) {
        agentsMap.set("v_bg", { id: "v_bg", name: "Backing Harmonies", type: "group", role: "background" });
      }
    });
    detectedAgentIds.forEach((id) => {
      if (!agentsMap.has(id)) {
        if (id === "v_bg") {
          agentsMap.set("v_bg", { id: "v_bg", name: "Backing Harmonies", type: "group", role: "background" });
        } else {
          agentsMap.set(id, { id, name: `Singer ${id}`, type: "person", role: "featured" });
        }
      }
    });
    return Array.from(agentsMap.values());
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
        selectedLanguage = "en",
        lyricsText = ""
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
      const contextHint = `Chunk ${chunkIndex + 1} of ${totalChunks}. Global time offset: ${timeOffset}s. Track: ${titleHint}.${lyricsText ? "\nReference Lyrics:\n" + lyricsText : ""}`;
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
      const agents = buildAgentsList(parsedData.agents || [], normalized.paragraphs, normalized.detectedAgentIds);
      res.json({
        chunkIndex,
        totalChunks,
        timeOffset,
        title: parsedData.title || titleHint,
        primaryLanguage: defaultLang,
        detectedLanguages: normalized.detectedLanguages,
        isCodeSwitched: parsedData.isCodeSwitched || normalized.detectedLanguages.length > 1,
        agents,
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
      const agents = buildAgentsList(
        parsedData.agents || [],
        normalized.paragraphs,
        normalized.detectedAgentIds
      );
      const result = {
        title: parsedData.title || filename.replace(/\.[^/.]+$/, ""),
        language: defaultLang,
        detectedLanguages: detectedLanguagesList,
        isCodeSwitched,
        agents,
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
  app.get("/api/youtube/search", async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.json({ results: [] });
    }
    try {
      const ytSearch = (await import("yt-search")).default;
      const searchResult = await ytSearch(q);
      const videos = searchResult.videos.slice(0, 10);
      const results = videos.map((v) => ({
        id: v.videoId,
        title: v.title,
        artist: v.author?.name || "Unknown Artist",
        duration: v.timestamp || "0:00",
        thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`,
        url: v.url
      }));
      res.json({ results });
    } catch (err) {
      console.error("YouTube Search Error:", err);
      res.status(500).json({ error: "Failed to search YouTube" });
    }
  });
  app.get("/api/youtube/import", (req, res) => {
    const videoId = String(req.query.id || "dQw4w9WgXcQ");
    res.setHeader("Content-Type", "audio/mpeg");
    const buffer = new Uint8Array(16384);
    res.send(Buffer.from(buffer));
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
