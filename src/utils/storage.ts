import { AudioAnalysisResult } from '../types';

export interface SavedAnalysis {
  id: string;
  filename: string;
  date: number;
  data: AudioAnalysisResult;
}

const STORAGE_KEY = 'ttml_studio_history';
const MAX_HISTORY = 10;

export function saveToHistory(filename: string, data: AudioAnalysisResult) {
  try {
    const history = getHistory();
    const newEntry: SavedAnalysis = {
      id: Date.now().toString(),
      filename,
      date: Date.now(),
      data,
    };
    
    // Remove if already exists with same filename
    const filtered = history.filter(h => h.filename !== filename);
    filtered.unshift(newEntry);
    
    if (filtered.length > MAX_HISTORY) {
      filtered.pop();
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to save history to localStorage. Storage might be full.', err);
  }
}

export function getHistory(): SavedAnalysis[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function removeHistoryItem(id: string) {
  try {
    const history = getHistory();
    const filtered = history.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to remove history item', err);
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear history', err);
  }
}
