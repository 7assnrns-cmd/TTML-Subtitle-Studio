import { AudioAnalysisResult } from '../types';

export interface SavedAnalysis {
  id: string;
  filename: string;
  date: number;
  data: AudioAnalysisResult;
}

export interface StorageStats {
  itemCount: number;
  totalBytes: number;
  formattedSize: string;
  percentQuotaUsed: number;
}

const STORAGE_KEY = 'ttml_studio_history';
const MAX_HISTORY = 15;
const ESTIMATED_QUOTA_BYTES = 5 * 1024 * 1024; // ~5MB localStorage quota limit

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
  } catch (err: any) {
    console.warn('Failed to save history to localStorage:', err?.message || err);
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

export function getStorageStats(): StorageStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '';
    const totalBytes = new Blob([raw]).size;
    const history = getHistory();
    
    let formattedSize = `${(totalBytes / 1024).toFixed(1)} KB`;
    if (totalBytes > 1024 * 1024) {
      formattedSize = `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    
    const percentQuotaUsed = Math.min(100, Number(((totalBytes / ESTIMATED_QUOTA_BYTES) * 100).toFixed(1)));

    return {
      itemCount: history.length,
      totalBytes,
      formattedSize,
      percentQuotaUsed,
    };
  } catch {
    return {
      itemCount: 0,
      totalBytes: 0,
      formattedSize: '0 KB',
      percentQuotaUsed: 0,
    };
  }
}

export function removeHistoryItem(id: string) {
  try {
    const history = getHistory();
    const filtered = history.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err: any) {
    console.warn('Failed to remove history item:', err?.message || err);
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err: any) {
    console.warn('Failed to clear history:', err?.message || err);
  }
}

export function exportHistoryAsJson(): string {
  const history = getHistory();
  return JSON.stringify(history, null, 2);
}

