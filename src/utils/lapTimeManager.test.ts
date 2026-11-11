import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatLapTime,
  isNewBestLap,
  calculateImprovement,
  getStoredBestLap,
  saveBestLap,
  clearStoredBestLap,
  BEST_LAP_STORAGE_KEY,
} from './lapTimeManager';
import { BestLapRecord } from '../types';

test('formatLapTime formats milliseconds correctly', () => {
  assert.equal(formatLapTime(0), '00:00.00');
  assert.equal(formatLapTime(-100), '00:00.00');
  assert.equal(formatLapTime(NaN), '00:00.00');
  // 5 seconds and 42 centiseconds = 5420ms
  assert.equal(formatLapTime(5420), '00:05.42');
  // 42.35 seconds = 42350ms
  assert.equal(formatLapTime(42350), '00:42.35');
  // 1 minute, 15 seconds, 12 centiseconds = 75120ms
  assert.equal(formatLapTime(75120), '01:15.12');
  // 2 minutes, 0 seconds, 5 centiseconds = 120050ms
  assert.equal(formatLapTime(120050), '02:00.05');
});

test('isNewBestLap determines if a time qualifies as a new best lap', () => {
  // Ignored if less than 1000ms (glitch guard)
  assert.equal(isNewBestLap(500, null), false);
  assert.equal(isNewBestLap(NaN, null), false);

  // If no existing record, any valid time >= 1000ms is a new best
  assert.equal(isNewBestLap(45000, null), true);

  const existingRecord: BestLapRecord = {
    timeMs: 40000,
    formattedTime: '00:40.00',
    date: '10 Mac 2026',
    playerName: 'Pelumba 1',
  };

  // Faster time (lower ms) is a new best
  assert.equal(isNewBestLap(38500, existingRecord), true);

  // Slower time (higher ms) is NOT a new best
  assert.equal(isNewBestLap(42000, existingRecord), false);

  // Equal time is NOT a new best
  assert.equal(isNewBestLap(40000, existingRecord), false);
});

test('calculateImprovement computes accurate difference and flags', () => {
  // Faster by 2.34s (37660 vs 40000)
  const faster = calculateImprovement(37660, 40000);
  assert.equal(faster.isFaster, true);
  assert.equal(faster.diffMs, -2340);
  assert.equal(faster.diffFormatted, '-2.34s');

  // Slower by 1.50s (41500 vs 40000)
  const slower = calculateImprovement(41500, 40000);
  assert.equal(slower.isFaster, false);
  assert.equal(slower.diffMs, 1500);
  assert.equal(slower.diffFormatted, '+1.50s');
});

// Mock Storage implementation for Node.js test environment
class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] || null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
}

test('getStoredBestLap, saveBestLap, and clearStoredBestLap work with storage', () => {
  const mockStorage = new MockStorage();

  // Initially empty
  assert.equal(getStoredBestLap(mockStorage), null);

  const record: BestLapRecord = {
    timeMs: 35240,
    formattedTime: '00:35.24',
    date: '11 Mac 2026',
    playerName: 'Muhammad Haziq',
    carName: 'Merah Kilat',
    round: 1,
  };

  // Save
  const saved = saveBestLap(record, mockStorage);
  assert.equal(saved, true);

  // Retrieve
  const retrieved = getStoredBestLap(mockStorage);
  assert.notEqual(retrieved, null);
  assert.equal(retrieved?.timeMs, 35240);
  assert.equal(retrieved?.formattedTime, '00:35.24');
  assert.equal(retrieved?.playerName, 'Muhammad Haziq');
  assert.equal(retrieved?.carName, 'Merah Kilat');

  // Invalid JSON handling
  mockStorage.setItem(BEST_LAP_STORAGE_KEY, 'invalid-json');
  assert.equal(getStoredBestLap(mockStorage), null);

  // Clear
  saveBestLap(record, mockStorage);
  assert.notEqual(getStoredBestLap(mockStorage), null);
  clearStoredBestLap(mockStorage);
  assert.equal(getStoredBestLap(mockStorage), null);
});
