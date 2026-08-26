import { AudioAnalysisResult } from '../types';

export interface SampleAudio {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: number;
  data: AudioAnalysisResult;
}

export const SAMPLE_DATASETS: SampleAudio[] = [
  {
    id: 'tech-keynote',
    title: 'Technology Keynote on Quantum AI',
    category: 'Keynote (EN)',
    description: 'Natural presentation with deliberate pauses between major announcements and technical terms.',
    duration: 14.85,
    data: {
      title: 'Technology Keynote on Quantum AI',
      language: 'en',
      detectedLanguages: ['en'],
      isCodeSwitched: false,
      duration: 14.85,
      rawTranscript: 'Welcome everyone. Today, we are thrilled to introduce a groundbreaking breakthrough in quantum artificial intelligence. By combining quantum coherence with neural networks, we have achieved unprecedented computing velocity.',
      paragraphs: [
        {
          id: 'p1',
          text: 'Welcome everyone.',
          start: 0.42,
          end: 1.85,
          lang: 'en',
          songPart: 'Verse',
          words: [
            { id: 'p1_w1', word: 'Welcome', start: 0.42, end: 0.95, duration: 0.53, pauseAfter: 0.12, pauseType: 'short', confidence: 0.98 },
            { id: 'p1_w2', word: 'everyone.', start: 1.07, end: 1.85, duration: 0.78, pauseAfter: 0.75, pauseType: 'sentence', confidence: 0.99 },
          ],
        },
        {
          id: 'p2',
          text: 'Today, we are thrilled to introduce a groundbreaking breakthrough in quantum artificial intelligence.',
          start: 2.60,
          end: 8.90,
          lang: 'en',
          songPart: 'Verse',
          words: [
            { id: 'p2_w1', word: 'Today,', start: 2.60, end: 3.12, duration: 0.52, pauseAfter: 0.38, pauseType: 'syntactic', confidence: 0.97 },
            { id: 'p2_w2', word: 'we', start: 3.50, end: 3.68, duration: 0.18, pauseAfter: 0.04, pauseType: 'none', confidence: 0.99 },
            { id: 'p2_w3', word: 'are', start: 3.72, end: 3.90, duration: 0.18, pauseAfter: 0.05, pauseType: 'none', confidence: 0.99 },
            { id: 'p2_w4', word: 'thrilled', start: 3.95, end: 4.45, duration: 0.50, pauseAfter: 0.08, pauseType: 'none', confidence: 0.96 },
            { id: 'p2_w5', word: 'to', start: 4.53, end: 4.68, duration: 0.15, pauseAfter: 0.04, pauseType: 'none', confidence: 0.99 },
            { id: 'p2_w6', word: 'introduce', start: 4.72, end: 5.35, duration: 0.63, pauseAfter: 0.15, pauseType: 'short', confidence: 0.98 },
            { id: 'p2_w7', word: 'a', start: 5.50, end: 5.60, duration: 0.10, pauseAfter: 0.05, pauseType: 'none', confidence: 0.99 },
            { id: 'p2_w8', word: 'groundbreaking', start: 5.65, end: 6.45, duration: 0.80, pauseAfter: 0.08, pauseType: 'none', confidence: 0.95 },
            { id: 'p2_w9', word: 'breakthrough', start: 6.53, end: 7.20, duration: 0.67, pauseAfter: 0.22, pauseType: 'short', confidence: 0.97 },
            { id: 'p2_w10', word: 'in', start: 7.42, end: 7.55, duration: 0.13, pauseAfter: 0.05, pauseType: 'none', confidence: 0.99 },
            { id: 'p2_w11', word: 'quantum', start: 7.60, end: 8.05, duration: 0.45, pauseAfter: 0.06, pauseType: 'none', confidence: 0.98 },
            { id: 'p2_w12', word: 'artificial', start: 8.11, end: 8.52, duration: 0.41, pauseAfter: 0.04, pauseType: 'none', confidence: 0.98 },
            { id: 'p2_w13', word: 'intelligence.', start: 8.56, end: 9.35, duration: 0.79, pauseAfter: 0.85, pauseType: 'sentence', confidence: 0.99 },
          ],
        },
        {
          id: 'p3',
          text: 'By combining quantum coherence with neural networks, we have achieved unprecedented computing velocity.',
          start: 10.20,
          end: 14.85,
          lang: 'en',
          songPart: 'Chorus',
          words: [
            { id: 'p3_w1', word: 'By', start: 10.20, end: 10.38, duration: 0.18, pauseAfter: 0.04, pauseType: 'none', confidence: 0.99 },
            { id: 'p3_w2', word: 'combining', start: 10.42, end: 10.95, duration: 0.53, pauseAfter: 0.06, pauseType: 'none', confidence: 0.97 },
            { id: 'p3_w3', word: 'quantum', start: 11.01, end: 11.45, duration: 0.44, pauseAfter: 0.05, pauseType: 'none', confidence: 0.98 },
            { id: 'p3_w4', word: 'coherence', start: 11.50, end: 12.08, duration: 0.58, pauseAfter: 0.18, pauseType: 'short', confidence: 0.96 },
            { id: 'p3_w5', word: 'with', start: 12.26, end: 12.44, duration: 0.18, pauseAfter: 0.04, pauseType: 'none', confidence: 0.99 },
            { id: 'p3_w6', word: 'neural', start: 12.48, end: 12.85, duration: 0.37, pauseAfter: 0.05, pauseType: 'none', confidence: 0.98 },
            { id: 'p3_w7', word: 'networks,', start: 12.90, end: 13.48, duration: 0.58, pauseAfter: 0.32, pauseType: 'syntactic', confidence: 0.97 },
            { id: 'p3_w8', word: 'we', start: 13.80, end: 13.95, duration: 0.15, pauseAfter: 0.03, pauseType: 'none', confidence: 0.99 },
            { id: 'p3_w9', word: 'have', start: 13.98, end: 14.15, duration: 0.17, pauseAfter: 0.04, pauseType: 'none', confidence: 0.99 },
            { id: 'p3_w10', word: 'achieved', start: 14.19, end: 14.58, duration: 0.39, pauseAfter: 0.08, pauseType: 'none', confidence: 0.98 },
            { id: 'p3_w11', word: 'unprecedented', start: 14.66, end: 15.35, duration: 0.69, pauseAfter: 0.06, pauseType: 'none', confidence: 0.97 },
            { id: 'p3_w12', word: 'computing', start: 15.41, end: 15.92, duration: 0.51, pauseAfter: 0.05, pauseType: 'none', confidence: 0.98 },
            { id: 'p3_w13', word: 'velocity.', start: 15.97, end: 16.55, duration: 0.58, pauseAfter: 0, pauseType: 'none', confidence: 0.99 },
          ],
        },
      ],
      words: [],
      pauses: [
        { id: 'pause_1', start: 1.85, end: 2.60, duration: 0.75, prevWord: 'everyone.', nextWord: 'Today,', type: 'sentence-break' },
        { id: 'pause_2', start: 3.12, end: 3.50, duration: 0.38, prevWord: 'Today,', nextWord: 'we', type: 'syntactic' },
        { id: 'pause_3', start: 6.45, end: 6.53, duration: 0.08, prevWord: 'groundbreaking', nextWord: 'breakthrough', type: 'breath' },
        { id: 'pause_4', start: 7.20, end: 7.42, duration: 0.22, prevWord: 'breakthrough', nextWord: 'in', type: 'syntactic' },
        { id: 'pause_5', start: 9.35, end: 10.20, duration: 0.85, prevWord: 'intelligence.', nextWord: 'By', type: 'sentence-break' },
        { id: 'pause_6', start: 12.08, end: 12.26, duration: 0.18, prevWord: 'coherence', nextWord: 'with', type: 'syntactic' },
        { id: 'pause_7', start: 13.48, end: 13.80, duration: 0.32, prevWord: 'networks,', nextWord: 'we', type: 'syntactic' },
      ],
      stats: {
        totalWords: 28,
        totalSpeechDuration: 12.8,
        totalPauseDuration: 2.78,
        pauseCount: 7,
        wordsPerMinute: 118,
        speechToSilenceRatio: 4.6,
        averageWordDuration: 0.457,
        longestPause: 0.85,
        detectedLanguagesCount: 1,
      },
    },
  },
  {
    id: 'japanese-english-song',
    title: 'Anime J-Pop & English Code-Switching Track',
    category: 'Japanese + English (Code-Switching)',
    description: 'Bilingual track showcasing seamless code-switching between Japanese lyrics and English phrases with millisecond alignment.',
    duration: 12.4,
    data: {
      title: 'Anime J-Pop & English Code-Switching Track',
      language: 'ja',
      detectedLanguages: ['ja', 'en'],
      isCodeSwitched: true,
      duration: 12.4,
      rawTranscript: '未来への Journey, 諦めないで never give up! 心の Flame を燃やして、Let us fly to the sky!',
      paragraphs: [
        {
          id: 'p1',
          text: '未来への Journey, 諦めないで never give up!',
          start: 0.35,
          end: 5.60,
          lang: 'ja',
          songPart: 'Verse',
          words: [
            { id: 'p1_w1', word: '未来への', start: 0.35, end: 1.10, duration: 0.75, pauseAfter: 0.15, pauseType: 'short', confidence: 0.98, lang: 'ja' },
            { id: 'p1_w2', word: 'Journey,', start: 1.25, end: 1.95, duration: 0.70, pauseAfter: 0.35, pauseType: 'syntactic', confidence: 0.99, lang: 'en' },
            { id: 'p1_w3', word: '諦めないで', start: 2.30, end: 3.40, duration: 1.10, pauseAfter: 0.20, pauseType: 'short', confidence: 0.97, lang: 'ja' },
            { id: 'p1_w4', word: 'never', start: 3.60, end: 4.15, duration: 0.55, pauseAfter: 0.08, pauseType: 'none', confidence: 0.99, lang: 'en' },
            { id: 'p1_w5', word: 'give', start: 4.23, end: 4.70, duration: 0.47, pauseAfter: 0.05, pauseType: 'none', confidence: 0.99, lang: 'en' },
            { id: 'p1_w6', word: 'up!', start: 4.75, end: 5.40, duration: 0.65, pauseAfter: 0.70, pauseType: 'sentence', confidence: 0.99, lang: 'en' },
          ],
        },
        {
          id: 'p2',
          text: '心の Flame を燃やして、Let us fly to the sky!',
          start: 6.10,
          end: 12.40,
          lang: 'ja',
          songPart: 'Chorus',
          words: [
            { id: 'p2_w1', word: '心の', start: 6.10, end: 6.65, duration: 0.55, pauseAfter: 0.10, pauseType: 'none', confidence: 0.98, lang: 'ja' },
            { id: 'p2_w2', word: 'Flame', start: 6.75, end: 7.35, duration: 0.60, pauseAfter: 0.08, pauseType: 'none', confidence: 0.99, lang: 'en' },
            { id: 'p2_w3', word: 'を燃やして、', start: 7.43, end: 8.45, duration: 1.02, pauseAfter: 0.40, pauseType: 'syntactic', confidence: 0.97, lang: 'ja' },
            { id: 'p2_w4', word: 'Let', start: 8.85, end: 9.15, duration: 0.30, pauseAfter: 0.05, pauseType: 'none', confidence: 0.99, lang: 'en' },
            { id: 'p2_w5', word: 'us', start: 9.20, end: 9.45, duration: 0.25, pauseAfter: 0.05, pauseType: 'none', confidence: 0.99, lang: 'en' },
            { id: 'p2_w6', word: 'fly', start: 9.50, end: 10.15, duration: 0.65, pauseAfter: 0.12, pauseType: 'short', confidence: 0.99, lang: 'en' },
            { id: 'p2_w7', word: 'to', start: 10.27, end: 10.45, duration: 0.18, pauseAfter: 0.05, pauseType: 'none', confidence: 0.99, lang: 'en' },
            { id: 'p2_w8', word: 'the', start: 10.50, end: 10.70, duration: 0.20, pauseAfter: 0.05, pauseType: 'none', confidence: 0.99, lang: 'en' },
            { id: 'p2_w9', word: 'sky!', start: 10.75, end: 11.60, duration: 0.85, pauseAfter: 0, pauseType: 'none', confidence: 0.99, lang: 'en' },
          ],
        },
      ],
      words: [],
      pauses: [
        { id: 'jp_p1', start: 1.95, end: 2.30, duration: 0.35, prevWord: 'Journey,', nextWord: '諦めないで', type: 'syntactic' },
        { id: 'jp_p2', start: 5.40, end: 6.10, duration: 0.70, prevWord: 'up!', nextWord: '心の', type: 'sentence-break' },
        { id: 'jp_p3', start: 8.45, end: 8.85, duration: 0.40, prevWord: 'を燃やして、', nextWord: 'Let', type: 'syntactic' },
      ],
      stats: {
        totalWords: 15,
        totalSpeechDuration: 8.47,
        totalPauseDuration: 1.45,
        pauseCount: 3,
        wordsPerMinute: 73,
        speechToSilenceRatio: 5.84,
        averageWordDuration: 0.565,
        longestPause: 0.70,
        detectedLanguagesCount: 2,
      },
    },
  },
  {
    id: 'arabic-english-tech',
    title: 'Arabic & English Cloud Architecture Discussion',
    category: 'Arabic + English (Code-Switching)',
    description: 'Technical discussion mixing Arabic dialogue with English cloud & machine learning terminology.',
    duration: 13.5,
    data: {
      title: 'Arabic & English Cloud Architecture Discussion',
      language: 'ar',
      detectedLanguages: ['ar', 'en'],
      isCodeSwitched: true,
      duration: 13.5,
      rawTranscript: 'أهلاً بكم جميعاً. سنناقش اليوم الـ AI pipeline والـ latency في السيرفرات. سنقوم بعمل deploy للـ model على Kubernetes.',
      paragraphs: [
        {
          id: 'p1',
          text: 'أهلاً بكم جميعاً. سنناقش اليوم الـ AI pipeline والـ latency في السيرفرات.',
          start: 0.40,
          end: 6.80,
          lang: 'ar',
          songPart: 'Verse',
          words: [
            { id: 'p1_w1', word: 'أهلاً', start: 0.40, end: 0.85, duration: 0.45, pauseAfter: 0.08, pauseType: 'short', confidence: 0.99, lang: 'ar' },
            { id: 'p1_w2', word: 'بكم', start: 0.93, end: 1.25, duration: 0.32, pauseAfter: 0.05, pauseType: 'none', confidence: 0.99, lang: 'ar' },
            { id: 'p1_w3', word: 'جميعاً.', start: 1.30, end: 1.95, duration: 0.65, pauseAfter: 0.65, pauseType: 'sentence', confidence: 0.98, lang: 'ar' },
            { id: 'p1_w4', word: 'سنناقش', start: 2.60, end: 3.15, duration: 0.55, pauseAfter: 0.08, pauseType: 'none', confidence: 0.97, lang: 'ar' },
            { id: 'p1_w5', word: 'اليوم', start: 3.23, end: 3.65, duration: 0.42, pauseAfter: 0.12, pauseType: 'short', confidence: 0.99, lang: 'ar' },
            { id: 'p1_w6', word: 'الـ', start: 3.77, end: 3.95, duration: 0.18, pauseAfter: 0.03, pauseType: 'none', confidence: 0.96, lang: 'ar' },
            { id: 'p1_w7', word: 'AI', start: 3.98, end: 4.40, duration: 0.42, pauseAfter: 0.06, pauseType: 'none', confidence: 0.99, lang: 'en' },
            { id: 'p1_w8', word: 'pipeline', start: 4.46, end: 5.10, duration: 0.64, pauseAfter: 0.18, pauseType: 'short', confidence: 0.98, lang: 'en' },
            { id: 'p1_w9', word: 'والـ', start: 5.28, end: 5.50, duration: 0.22, pauseAfter: 0.04, pauseType: 'none', confidence: 0.96, lang: 'ar' },
            { id: 'p1_w10', word: 'latency', start: 5.54, end: 6.15, duration: 0.61, pauseAfter: 0.10, pauseType: 'none', confidence: 0.98, lang: 'en' },
            { id: 'p1_w11', word: 'في', start: 6.25, end: 6.45, duration: 0.20, pauseAfter: 0.04, pauseType: 'none', confidence: 0.99, lang: 'ar' },
            { id: 'p1_w12', word: 'السيرفرات.', start: 6.49, end: 7.20, duration: 0.71, pauseAfter: 0.80, pauseType: 'sentence', confidence: 0.98, lang: 'ar' },
          ],
        },
        {
          id: 'p2',
          text: 'سنقوم بعمل deploy للـ model على Kubernetes.',
          start: 8.00,
          end: 13.50,
          lang: 'ar',
          songPart: 'Chorus',
          words: [
            { id: 'p2_w1', word: 'سنقوم', start: 8.00, end: 8.50, duration: 0.50, pauseAfter: 0.08, pauseType: 'none', confidence: 0.98, lang: 'ar' },
            { id: 'p2_w2', word: 'بعمل', start: 8.58, end: 8.95, duration: 0.37, pauseAfter: 0.10, pauseType: 'short', confidence: 0.98, lang: 'ar' },
            { id: 'p2_w3', word: 'deploy', start: 9.05, end: 9.60, duration: 0.55, pauseAfter: 0.12, pauseType: 'short', confidence: 0.99, lang: 'en' },
            { id: 'p2_w4', word: 'للـ', start: 9.72, end: 9.95, duration: 0.23, pauseAfter: 0.04, pauseType: 'none', confidence: 0.97, lang: 'ar' },
            { id: 'p2_w5', word: 'model', start: 9.99, end: 10.45, duration: 0.46, pauseAfter: 0.15, pauseType: 'short', confidence: 0.99, lang: 'en' },
            { id: 'p2_w6', word: 'على', start: 10.60, end: 10.90, duration: 0.30, pauseAfter: 0.08, pauseType: 'none', confidence: 0.99, lang: 'ar' },
            { id: 'p2_w7', word: 'Kubernetes.', start: 10.98, end: 11.95, duration: 0.97, pauseAfter: 0, pauseType: 'none', confidence: 0.99, lang: 'en' },
          ],
        },
      ],
      words: [],
      pauses: [
        { id: 'ar_p1', start: 1.95, end: 2.60, duration: 0.65, prevWord: 'جميعاً.', nextWord: 'سنناقش', type: 'sentence-break' },
        { id: 'ar_p2', start: 7.20, end: 8.00, duration: 0.80, prevWord: 'السيرفرات.', nextWord: 'سنقوم', type: 'sentence-break' },
      ],
      stats: {
        totalWords: 19,
        totalSpeechDuration: 8.78,
        totalPauseDuration: 1.45,
        pauseCount: 2,
        wordsPerMinute: 84,
        speechToSilenceRatio: 6.05,
        averageWordDuration: 0.462,
        longestPause: 0.80,
        detectedLanguagesCount: 2,
      },
    },
  },
  {
    id: 'broadcast-news',
    title: 'Global Weather & Environmental Dispatch',
    category: 'News (EN)',
    description: 'Brisk, rhythmic broadcast cadence with sharp sentence boundaries and distinct acoustic intervals.',
    duration: 11.2,
    data: {
      title: 'Global Weather & Environmental Dispatch',
      language: 'en',
      detectedLanguages: ['en'],
      isCodeSwitched: false,
      duration: 11.2,
      rawTranscript: 'Good evening. Meteorologists report unprecedented atmospheric river systems moving across the Pacific coastline. High winds and heavy precipitation are forecasted through Thursday morning.',
      paragraphs: [
        {
          id: 'p1',
          text: 'Good evening.',
          start: 0.30,
          end: 1.25,
          lang: 'en',
          songPart: 'Intro',
          words: [
            { id: 'p1_w1', word: 'Good', start: 0.30, end: 0.65, duration: 0.35, pauseAfter: 0.08, pauseType: 'short', confidence: 0.99 },
            { id: 'p1_w2', word: 'evening.', start: 0.73, end: 1.25, duration: 0.52, pauseAfter: 0.65, pauseType: 'sentence', confidence: 0.99 },
          ],
        },
        {
          id: 'p2',
          text: 'Meteorologists report unprecedented atmospheric river systems moving across the Pacific coastline.',
          start: 1.90,
          end: 6.80,
          lang: 'en',
          songPart: 'Verse',
          words: [
            { id: 'p2_w1', word: 'Meteorologists', start: 1.90, end: 2.65, duration: 0.75, pauseAfter: 0.05, pauseType: 'none', confidence: 0.98 },
            { id: 'p2_w2', word: 'report', start: 2.70, end: 3.08, duration: 0.38, pauseAfter: 0.12, pauseType: 'short', confidence: 0.97 },
            { id: 'p2_w3', word: 'unprecedented', start: 3.20, end: 3.85, duration: 0.65, pauseAfter: 0.05, pauseType: 'none', confidence: 0.96 },
            { id: 'p2_w4', word: 'atmospheric', start: 3.90, end: 4.52, duration: 0.62, pauseAfter: 0.06, pauseType: 'none', confidence: 0.98 },
            { id: 'p2_w5', word: 'river', start: 4.58, end: 4.90, duration: 0.32, pauseAfter: 0.05, pauseType: 'none', confidence: 0.99 },
            { id: 'p2_w6', word: 'systems', start: 4.95, end: 5.42, duration: 0.47, pauseAfter: 0.18, pauseType: 'short', confidence: 0.97 },
            { id: 'p2_w7', word: 'moving', start: 5.60, end: 5.95, duration: 0.35, pauseAfter: 0.04, pauseType: 'none', confidence: 0.99 },
            { id: 'p2_w8', word: 'across', start: 5.99, end: 6.32, duration: 0.33, pauseAfter: 0.04, pauseType: 'none', confidence: 0.99 },
            { id: 'p2_w9', word: 'the', start: 6.36, end: 6.48, duration: 0.12, pauseAfter: 0.03, pauseType: 'none', confidence: 0.99 },
            { id: 'p2_w10', word: 'Pacific', start: 6.51, end: 6.95, duration: 0.44, pauseAfter: 0.05, pauseType: 'none', confidence: 0.98 },
            { id: 'p2_w11', word: 'coastline.', start: 7.00, end: 7.62, duration: 0.62, pauseAfter: 0.58, pauseType: 'sentence', confidence: 0.99 },
          ],
        },
        {
          id: 'p3',
          text: 'High winds and heavy precipitation are forecasted through Thursday morning.',
          start: 8.20,
          end: 11.20,
          lang: 'en',
          songPart: 'Chorus',
          words: [
            { id: 'p3_w1', word: 'High', start: 8.20, end: 8.52, duration: 0.32, pauseAfter: 0.04, pauseType: 'none', confidence: 0.99 },
            { id: 'p3_w2', word: 'winds', start: 8.56, end: 8.95, duration: 0.39, pauseAfter: 0.06, pauseType: 'none', confidence: 0.98 },
            { id: 'p3_w3', word: 'and', start: 9.01, end: 9.15, duration: 0.14, pauseAfter: 0.04, pauseType: 'none', confidence: 0.99 },
            { id: 'p3_w4', word: 'heavy', start: 9.19, end: 9.52, duration: 0.33, pauseAfter: 0.05, pauseType: 'none', confidence: 0.98 },
            { id: 'p3_w5', word: 'precipitation', start: 9.57, end: 10.25, duration: 0.68, pauseAfter: 0.12, pauseType: 'short', confidence: 0.97 },
            { id: 'p3_w6', word: 'are', start: 10.37, end: 10.50, duration: 0.13, pauseAfter: 0.03, pauseType: 'none', confidence: 0.99 },
            { id: 'p3_w7', word: 'forecasted', start: 10.53, end: 11.05, duration: 0.52, pauseAfter: 0.06, pauseType: 'none', confidence: 0.98 },
            { id: 'p3_w8', word: 'through', start: 11.11, end: 11.35, duration: 0.24, pauseAfter: 0.04, pauseType: 'none', confidence: 0.99 },
            { id: 'p3_w9', word: 'Thursday', start: 11.39, end: 11.82, duration: 0.43, pauseAfter: 0.05, pauseType: 'none', confidence: 0.99 },
            { id: 'p3_w10', word: 'morning.', start: 11.87, end: 12.35, duration: 0.48, pauseAfter: 0, pauseType: 'none', confidence: 0.99 },
          ],
        },
      ],
      words: [],
      pauses: [
        { id: 'p_1', start: 1.25, end: 1.90, duration: 0.65, prevWord: 'evening.', nextWord: 'Meteorologists', type: 'sentence-break' },
        { id: 'p_2', start: 3.08, end: 3.20, duration: 0.12, prevWord: 'report', nextWord: 'unprecedented', type: 'breath' },
        { id: 'p_3', start: 5.42, end: 5.60, duration: 0.18, prevWord: 'systems', nextWord: 'moving', type: 'syntactic' },
        { id: 'p_4', start: 7.62, end: 8.20, duration: 0.58, prevWord: 'coastline.', nextWord: 'High', type: 'sentence-break' },
        { id: 'p_5', start: 10.25, end: 10.37, duration: 0.12, prevWord: 'precipitation', nextWord: 'are', type: 'breath' },
      ],
      stats: {
        totalWords: 23,
        totalSpeechDuration: 9.75,
        totalPauseDuration: 1.65,
        pauseCount: 5,
        wordsPerMinute: 135,
        speechToSilenceRatio: 5.9,
        averageWordDuration: 0.424,
        longestPause: 0.65,
        detectedLanguagesCount: 1,
      },
    },
  },
];

// Populate flattened words list
SAMPLE_DATASETS.forEach((sample) => {
  const allWords: any[] = [];
  sample.data.paragraphs.forEach((p) => {
    p.words.forEach((w) => allWords.push(w));
  });
  sample.data.words = allWords;
});

// Helper to synthesize a realistic speech/beeping melody audio buffer
export function createSyntheticAudioBuffer(words: any[], totalDuration: number): Blob {
  const sampleRate = 22050;
  const numSamples = Math.ceil(totalDuration * sampleRate);
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  words.forEach((w, wIdx) => {
    const startSample = Math.floor(w.start * sampleRate);
    const endSample = Math.min(numSamples, Math.floor(w.end * sampleRate));
    const baseFreq = 170 + (wIdx % 6) * 18;

    for (let i = startSample; i < endSample; i++) {
      const t = (i - startSample) / sampleRate;
      const wordProgress = (i - startSample) / (endSample - startSample);
      let envelope = 1;
      if (wordProgress < 0.15) envelope = wordProgress / 0.15;
      else if (wordProgress > 0.85) envelope = (1 - wordProgress) / 0.15;

      const harmonic1 = Math.sin(2 * Math.PI * baseFreq * t);
      const harmonic2 = 0.5 * Math.sin(2 * Math.PI * (baseFreq * 2.05) * t);
      const harmonic3 = 0.25 * Math.sin(2 * Math.PI * (baseFreq * 3.1) * t);
      const noise = (Math.random() * 2 - 1) * 0.04;

      data[i] = (harmonic1 + harmonic2 + harmonic3 + noise) * envelope * 0.32;
    }
  });

  return bufferToWave(buffer, numSamples);
}

function bufferToWave(abuffer: AudioBuffer, len: number): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const out = new ArrayBuffer(length);
  const view = new DataView(out);
  const channels: Float32Array[] = [];
  let sample: number;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);  // file length - 8
  setUint32(0x45564157); // "WAVE"

  // fmt sub-chunk
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16);          // SubChunk1Size (16 for PCM)
  setUint16(1);           // AudioFormat (1 for PCM)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2);                      // block align
  setUint16(16);                                 // bits per sample

  // data sub-chunk
  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}
