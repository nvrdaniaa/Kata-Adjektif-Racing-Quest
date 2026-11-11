import { BestLapRecord } from '../types';

export const BEST_LAP_STORAGE_KEY = 'kata_adjektif_best_lap_time';

/**
 * Format milliseconds into MM:SS.cs (minutes:seconds.centiseconds)
 * E.g., 42350 -> "00:42.35", 75120 -> "01:15.12"
 */
export function formatLapTime(timeMs: number): string {
  if (isNaN(timeMs) || timeMs <= 0) {
    return '00:00.00';
  }

  const totalCentiseconds = Math.floor(timeMs / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const cs = String(centiseconds).padStart(2, '0');

  return `${mm}:${ss}.${cs}`;
}

/**
 * Check if a current lap time qualifies as a new best lap.
 * Must be greater than 1000ms (to prevent zero-time glitches)
 * and faster than existing record, or true if no record exists yet.
 */
export function isNewBestLap(
  currentLapTimeMs: number,
  existingRecord: BestLapRecord | null
): boolean {
  if (isNaN(currentLapTimeMs) || currentLapTimeMs < 1000) {
    return false;
  }
  if (!existingRecord || !existingRecord.timeMs || existingRecord.timeMs <= 0) {
    return true;
  }
  return currentLapTimeMs < existingRecord.timeMs;
}

/**
 * Calculate improvement delta between current time and previous best time.
 * Returns difference in ms, formatted string, and boolean if current is faster.
 */
export function calculateImprovement(
  currentTimeMs: number,
  previousTimeMs: number
): {
  diffMs: number;
  diffFormatted: string;
  isFaster: boolean;
} {
  const diffMs = currentTimeMs - previousTimeMs;
  const isFaster = diffMs < 0;
  const absDiff = Math.abs(diffMs);
  const seconds = (absDiff / 1000).toFixed(2);
  const sign = isFaster ? '-' : '+';

  return {
    diffMs,
    diffFormatted: `${sign}${seconds}s`,
    isFaster,
  };
}

/**
 * Retrieve the stored Best Lap Record from localStorage with validation.
 */
export function getStoredBestLap(
  storage?: Storage
): BestLapRecord | null {
  try {
    const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!store) return null;

    const raw = store.getItem(BEST_LAP_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.timeMs === 'number' &&
      parsed.timeMs > 0 &&
      typeof parsed.formattedTime === 'string'
    ) {
      return parsed as BestLapRecord;
    }
    return null;
  } catch (err) {
    console.warn('Failed to read best lap time from localStorage:', err);
    return null;
  }
}

/**
 * Save a new Best Lap Record to localStorage.
 */
export function saveBestLap(
  record: BestLapRecord,
  storage?: Storage
): boolean {
  try {
    const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!store) return false;

    store.setItem(BEST_LAP_STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch (err) {
    console.warn('Failed to save best lap time to localStorage:', err);
    return false;
  }
}

/**
 * Remove the stored Best Lap Record from localStorage.
 */
export function clearStoredBestLap(
  storage?: Storage
): boolean {
  try {
    const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!store) return false;

    store.removeItem(BEST_LAP_STORAGE_KEY);
    return true;
  } catch (err) {
    console.warn('Failed to clear best lap time from localStorage:', err);
    return false;
  }
}
