export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Strips markdown code block wrappers (such as ```json, ```xml, ```, etc.)
 * and accidental leading/trailing conversational filler or backticks.
 */
export function stripMarkdownWrappers(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let cleaned = rawText.trim();

  // Strip leading markdown block (```json, ```xml, ```txt, ```, etc.)
  cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\s*\n?/i, '');

  // Strip trailing markdown block (```)
  cleaned = cleaned.replace(/\n?\s*```\s*$/i, '');

  // Handle nested or remaining inline fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\s*/i, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\s*```$/i, '');
  }

  return cleaned.trim();
}

/**
 * Robust JSON repair utility that cleanly extracts JSON, strips markdown fences,
 * and fixes unclosed strings or truncated arrays/objects caused by token cutoffs.
 */
export function repairAndParseJson(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response from AI engine');
  }

  // 1. Clean whitespace and markdown fences with robust regex
  let cleaned = stripMarkdownWrappers(rawText);

  // 2. Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch {
    console.warn('[TTML Repair] Direct JSON parse failed, attempting deep structural recovery...');
  }

  // 3. Extract from first '{' or '[' to the last '}' or ']'
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = 0;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  let endIdx = cleaned.length;
  const maxEnd = Math.max(lastBrace, lastBracket);
  if (maxEnd !== -1) {
    endIdx = maxEnd + 1;
  }

  let coreJson = cleaned.substring(startIdx, endIdx).trim();

  // Try direct parse of core extracted slice
  try {
    return JSON.parse(coreJson);
  } catch {
    // Proceed to token-cutoff balancing
  }

  // 4. Progressive truncation and structural balancing for cutoff recovery
  for (let truncateOffset = 0; truncateOffset <= Math.min(coreJson.length - 10, 800); truncateOffset += 1) {
    let candidate = truncateOffset === 0 ? coreJson : coreJson.substring(0, coreJson.length - truncateOffset).trim();

    // Clean trailing colons, commas, or unclosed string tails
    candidate = candidate
      .replace(/,\s*$/, '')
      .replace(/:\s*$/, '')
      .replace(/"[^"]*$/, '');

    let inString = false;
    let escapeNext = false;
    const stack: ('{' | '[')[] = [];

    for (let i = 0; i < candidate.length; i++) {
      const char = candidate[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') stack.push('{');
        else if (char === '[') stack.push('[');
        else if (char === '}') {
          if (stack.length > 0 && stack[stack.length - 1] === '{') stack.pop();
        } else if (char === ']') {
          if (stack.length > 0 && stack[stack.length - 1] === '[') stack.pop();
        }
      }
    }

    if (inString) {
      candidate += '"';
    }

    candidate = candidate.replace(/,\s*$/, '');

    while (stack.length > 0) {
      const last = stack.pop();
      if (last === '{') candidate += '}';
      else if (last === '[') candidate += ']';
    }

    candidate = candidate.replace(/,\s*([}\]])/g, '$1');

    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch {
      // Continue search
    }
  }

  // Final failure: Log raw response for debugging as requested by user
  console.error('[TTML Repair Failure] All recovery attempts failed.');
  console.error('[RAW TEXT START]\n' + rawText + '\n[RAW TEXT END]');
  
  throw new Error('Unable to parse phonetic timing data from AI engine. Please retry.');
}

export const WORD_FREQUENCIES: Record<string, number> = {
  the: 100, be: 95, to: 95, of: 95, and: 95, a: 95, in: 95, that: 90, have: 90,
  i: 95, it: 95, for: 90, not: 90, on: 90, with: 90, he: 90, as: 90, you: 95,
  do: 90, at: 90, this: 85, but: 85, his: 85, by: 85, from: 85, they: 85, we: 90,
  say: 80, her: 85, she: 85, or: 85, an: 85, will: 90, my: 90, one: 85, all: 85,
  would: 80, there: 80, their: 80, what: 85, so: 85, up: 85, out: 85, if: 85,
  about: 80, who: 80, get: 80, which: 80, go: 80, me: 90, when: 80, make: 80,
  can: 85, like: 80, time: 80, no: 85, just: 80, him: 80, know: 80, take: 80,
  people: 75, into: 80, year: 75, your: 85, good: 75, some: 75, could: 75,
  them: 80, see: 80, other: 75, than: 75, then: 75, now: 80, look: 75, only: 75,
  come: 75, its: 80, over: 75, think: 75, also: 70, back: 75, after: 75, use: 70,
  two: 75, how: 75, our: 80, work: 70, first: 70, well: 75, way: 75, even: 70,
  new: 70, want: 75, because: 70, any: 70, these: 70, give: 70, most: 70,
  us: 80, are: 90, is: 95, was: 90, were: 85, been: 85, am: 85, has: 85, had: 85,
  lost: 75, wait: 75, waiting: 75, end: 75, ending: 70, start: 70, started: 70,
  love: 85, lover: 75, lovers: 70, loving: 75, loved: 75, heart: 80, hearts: 75,
  soul: 75, souls: 70, mind: 75, minds: 70, dream: 75, dreams: 75, dreamer: 70,
  dreaming: 75, night: 80, nights: 75, day: 80, days: 75, dawn: 70, dusk: 70,
  sun: 75, moon: 75, star: 75, stars: 75, sky: 80, skies: 75, light: 80, lights: 75,
  dark: 75, darkness: 70, shadow: 70, shadows: 70, shade: 65, glow: 70, glowing: 70,
  shine: 75, shining: 75, bright: 70, brighter: 65, brightest: 65, clear: 70,
  wind: 75, winds: 70, breeze: 65, air: 75, breath: 70, breathe: 70, breathing: 70,
  whisper: 75, whispers: 75, whispering: 75, whispered: 70, write: 75, writes: 70,
  writing: 75, written: 70, wrote: 70, ear: 70, ears: 70, eye: 75, eyes: 75,
  hear: 75, hears: 70, hearing: 70, heard: 75, listen: 75, listening: 70,
  voice: 75, voices: 75, sound: 75, sounds: 70, silent: 70, silence: 70,
  echo: 70, echoes: 70, echoing: 70, flame: 70, flames: 70, fire: 75, fires: 70,
  burn: 70, burns: 65, burning: 70, burned: 65, spark: 65, sparks: 65, smoke: 65,
  rain: 75, raining: 70, storm: 70, storms: 65, thunder: 65, lightning: 65,
  cloud: 70, clouds: 70, snow: 65, ice: 65, cold: 70, warm: 70, heat: 65,
  ocean: 70, oceans: 65, sea: 75, seas: 70, wave: 70, waves: 70, river: 70,
  water: 75, deep: 75, deeper: 65, deepest: 65, depth: 65, depths: 65,
  fly: 75, flying: 70, flew: 65, flown: 65, wing: 70, wings: 70, feather: 60,
  soar: 65, soaring: 65, run: 75, runs: 70, running: 75, ran: 70, walk: 70,
  walking: 70, walked: 65, step: 70, steps: 65, sing: 75, sings: 70, singing: 75,
  sang: 65, sung: 65, song: 80, songs: 75, melody: 70, melodies: 65, rhythm: 65,
  beat: 70, beats: 65, harmony: 70, harmonies: 65, chord: 60, tune: 65,
  life: 80, lives: 75, living: 75, alive: 75, die: 70, dying: 65, dead: 70,
  death: 70, born: 70, world: 80, worlds: 70, earth: 70, land: 70, ground: 70,
  space: 70, universe: 65, cosmos: 60, horizon: 65, hold: 75, holds: 70,
  holding: 75, held: 70, touch: 75, touches: 65, touching: 70, touched: 70,
  feel: 80, feels: 75, feeling: 80, felt: 75, stand: 75, stands: 70, standing: 75,
  stood: 70, fall: 75, falls: 70, falling: 75, fell: 70, fallen: 70, rise: 70,
  rising: 70, rose: 70, stay: 75, stays: 65, staying: 70, stayed: 65,
  leave: 75, leaves: 70, leaving: 70, left: 75, gone: 75, went: 75,
  bring: 75, brings: 70, bringing: 70, brought: 75, find: 75, finds: 70,
  finding: 70, found: 75, seek: 65, search: 65, break: 70, breaks: 65,
  breaking: 70, broke: 70, broken: 75, keep: 75, keeps: 70, keeping: 70, kept: 70,
  save: 70, saves: 65, saving: 65, saved: 65, tell: 75, tells: 70, telling: 70,
  told: 75, speak: 70, speaks: 65, speaking: 70, spoke: 65, spoken: 65,
  call: 75, calls: 70, calling: 75, called: 70, shout: 65, scream: 65,
  cry: 70, cries: 65, crying: 70, tear: 70, tears: 75, smile: 70, smiles: 65,
  laugh: 65, laughter: 65, hope: 75, hopes: 70, hoping: 70, faith: 70,
  trust: 70, truth: 75, true: 75, lie: 70, lies: 70, lying: 65,
  free: 75, freedom: 70, again: 80, blue: 75, red: 75, white: 75, black: 75,
  gold: 70, golden: 70, silver: 65, forever: 75, always: 80, never: 80,
  together: 80, alone: 75, lonely: 70, away: 80, down: 80, under: 75,
  inside: 75, outside: 75, within: 75, without: 75, before: 75, while: 75,
  where: 80, here: 85, everywhere: 70, nowhere: 65, somewhere: 70,
  something: 75, nothing: 75, everything: 80, anything: 75, someone: 75,
  nobody: 70, everybody: 70, anyone: 70, noone: 65,
  better: 75, best: 75, bad: 70, worse: 65, worst: 65, sweet: 70, bitter: 65,
  wild: 70, calm: 65, high: 75, higher: 70, highest: 65, low: 70, lower: 65,
  far: 75, near: 70, close: 75, pure: 65, holy: 65, magic: 70, magical: 65,
  wonder: 70, wonders: 65, wonderful: 70, secret: 70, secrets: 70, hidden: 70,
  eternal: 70, endless: 70, boundless: 65, timeless: 65, strong: 70, weak: 65,
  brave: 65, fear: 70, fears: 65, afraid: 70, bravery: 60, courage: 65,
  peace: 70, war: 70, battle: 65, fight: 70, fighting: 65, fought: 65,
  champion: 70, champions: 70, hero: 70, heroes: 65,
  moment: 75, moments: 70, second: 70, seconds: 70, minute: 70, minutes: 70,
  hour: 70, hours: 70, friend: 75, friends: 70, home: 75, house: 70,
  city: 70, street: 70, road: 70, path: 70, track: 70, door: 70,
  window: 65, wall: 65, gate: 65, bridge: 70, head: 75, face: 75,
  hand: 80, hands: 80, arm: 70, arms: 75, body: 75, blood: 70,
  word: 75, words: 80, story: 75, stories: 70, line: 75, lines: 70,
  morning: 75, evening: 70, midnight: 70, tonight: 80, today: 80, tomorrow: 75,
  yesterday: 70, summer: 70, winter: 70, autumn: 65, spring: 70, season: 65,
  flower: 70, flowers: 70, roses: 70, tree: 70, trees: 70,
  angel: 70, angels: 70, heaven: 70, paradise: 65, hell: 65, destiny: 70,
  fate: 70, pulse: 65, vibe: 65, vibes: 65, energy: 70, power: 75, spirit: 70,
  cant: 80, "can't": 85, dont: 80, "don't": 85, wont: 75, "won't": 80,
  isnt: 75, "isn't": 80, lets: 75, "let's": 80, youre: 80, "you're": 85,
  theyre: 75, "they're": 80, weve: 75, "we've": 80, ive: 80, "i've": 85,
  im: 85, "i'm": 90, didnt: 75, "didn't": 80, couldnt: 70, "couldn't": 75,
  shouldnt: 70, "shouldn't": 75, wouldnt: 70, "wouldn't": 75, wasnt: 75, "wasn't": 80,
  thats: 80, "that's": 85, theres: 75, "there's": 80, whats: 75, "what's": 80,
  hes: 75, "he's": 80, shes: 75, "she's": 80, itll: 70, "it'll": 75,
  youll: 75, "you'll": 80, ill: 75, "i'll": 80, "we'll": 80,
  gonna: 80, wanna: 80, gotta: 75, kinda: 70, tryna: 70, bout: 70, "'bout": 70,
  cause: 75, "'cause": 75, cuz: 70, cos: 70, til: 70, till: 75,
  yeah: 80, oh: 85, ah: 80, ooh: 75, wow: 70, hey: 75, yo: 65, la: 70, na: 70,
  wil: 75,
};

export const COMMON_WORDS_SET = new Set(Object.keys(WORD_FREQUENCIES));

export function decomposeConcatenatedWord(rawToken: string): string[] | null {
  if (!rawToken || typeof rawToken !== 'string') return null;
  const punctMatch = rawToken.match(/^([(\[{'"]*)([a-zA-Z0-9'_-]+)([)\]}'".,!?:;]*)$/);
  const prefixPunct = punctMatch ? punctMatch[1] : '';
  const coreString = punctMatch ? punctMatch[2] : rawToken;
  const suffixPunct = punctMatch ? punctMatch[3] : '';

  const clean = coreString.replace(/[^a-zA-Z]/g, '').toLowerCase();
  const n = clean.length;
  if (n < 2) return null;

  if (COMMON_WORDS_SET.has(clean) && clean.length <= 5 && !['init', 'atme', 'tome', 'inmy', 'onmy', 'goto', 'seeme'].includes(clean)) {
    return null;
  }

  const memo = new Map<number, { words: string[]; score: number } | null>();

  function solve(startIndex: number): { words: string[]; score: number } | null {
    if (startIndex === n) return { words: [], score: 0 };
    if (memo.has(startIndex)) return memo.get(startIndex)!;

    let bestResult: { words: string[]; score: number } | null = null;

    for (let len = 1; len <= Math.min(22, n - startIndex); len++) {
      const end = startIndex + len;
      const sub = clean.slice(startIndex, end);

      let isSingleLetterValid = false;
      let singleLetterScore = 0;

      if (len === 1) {
        if (sub === 'a' || sub === 'i') {
          isSingleLetterValid = true;
          singleLetterScore = 80;
        } else if (sub === 'l') {
          isSingleLetterValid = true;
          singleLetterScore = 60;
        } else {
          continue;
        }
      }

      const freq = WORD_FREQUENCIES[sub];
      const isRecognized = Boolean(freq) || isSingleLetterValid;

      if (isRecognized) {
        const subScore = freq ? freq * (len >= 3 ? 1.5 : 1.0) : singleLetterScore;
        const rest = solve(end);

        if (rest !== null) {
          const totalScore = subScore + rest.score + 50;
          if (bestResult === null || totalScore > bestResult.score) {
            let actualWord = coreString.slice(startIndex, end);
            if (sub === 'l' && len === 1) actualWord = 'i';
            if (sub === 'wil') actualWord = 'will';
            if (sub === 'cant') actualWord = "can't";
            if (sub === 'dont') actualWord = "don't";
            if (sub === 'im') actualWord = "i'm";
            if (sub === 'ive') actualWord = "i've";
            if (sub === 'youre') actualWord = "you're";
            if (sub === 'thats') actualWord = "that's";

            bestResult = {
              words: [actualWord, ...rest.words],
              score: totalScore,
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

/**
 * Splits glued/concatenated words into clean, distinct word tokens with strict whitespace separation.
 */
export function separateGluedWords(rawWord: string): string[] {
  if (!rawWord || typeof rawWord !== 'string') return [];
  let s = rawWord.trim();
  if (!s) return [];

  // Script boundary separation
  s = s.replace(/([a-zA-Z0-9])([\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\u0600-\u06ff\u0900-\u097f\u0400-\u04ff])/g, '$1 $2');
  s = s.replace(/([\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\u0600-\u06ff\u0900-\u097f\u0400-\u04ff])([a-zA-Z0-9])/g, '$1 $2');

  // Punctuation boundary
  s = s.replace(/([!?,;:।~—–\)\(\]\[\}\{\/\\])([a-zA-Z0-9\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\u0600-\u06ff])/g, '$1 $2');
  s = s.replace(/([a-zA-Z0-9\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\u0600-\u06ff])([(\[{])/g, '$1 $2');

  // Digits <-> Letters boundary
  s = s.replace(/([0-9])([a-zA-Z])/g, '$1 $2');
  s = s.replace(/([a-zA-Z])([0-9])/g, '$1 $2');

  // PascalCase & camelCase
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
  s = s.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

  // Split on whitespace
  const initialTokens = s.split(/\s+/).map((t) => t.trim()).filter(Boolean);
  const finalTokens: string[] = [];

  for (const token of initialTokens) {
    const cleanAlpha = token.replace(/[^a-zA-Z]/g, '').toLowerCase();
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
