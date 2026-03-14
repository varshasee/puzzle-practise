// Adaptive difficulty adjustment based on trailing 7-day performance

import { baseDifficultyForDate } from './phases';

export interface TrailingStats {
  completionRate: number;  // 0–1 (fraction of assigned puzzles completed)
  accuracy: number;        // 0–1 (fraction of cells correct on first try)
  medianSolveMs: number;   // median solve time in milliseconds
  targetSolveMs: number;   // expected solve time for current difficulty
  missedDays: number;      // days with 0 completions in last 7
}

/**
 * Returns the delta to apply to base difficulty.
 * Bounded to ±1.5 from the calendar target.
 */
export function adaptationDelta(stats: TrailingStats, dateStr: string): number {
  const { completionRate, accuracy, medianSolveMs, targetSolveMs, missedDays } = stats;
  const base = baseDifficultyForDate(dateStr);

  // If 3+ missed days: hold current difficulty, reduce volume (handled by scheduler)
  if (missedDays >= 3) return 0;

  let rawDelta = 0;
  const speedAhead = medianSolveMs < targetSolveMs * 0.85;

  if (completionRate >= 0.85 && accuracy >= 0.95 && speedAhead) {
    rawDelta = +0.5;  // Too easy — ramp up
  } else if (completionRate < 0.60 || accuracy < 0.85) {
    rawDelta = -0.5;  // Too hard — ease off
  }

  // Clamp: effective difficulty must stay within ±1.5 of the calendar target
  const proposed = base + rawDelta;
  const clamped = Math.max(base - 1.5, Math.min(base + 1.5, proposed));
  return Math.round((clamped - base) * 10) / 10;
}

/** Build default trailing stats for a new user with no history */
export function defaultTrailingStats(): TrailingStats {
  return {
    completionRate: 0,
    accuracy: 0,
    medianSolveMs: 999_999,
    targetSolveMs: 600_000,  // 10 minutes default target
    missedDays: 7,
  };
}
