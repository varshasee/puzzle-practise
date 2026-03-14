// Training phases for CAT 2026 program: Mar 14 – Nov 29, 2026

export interface Phase {
  name: string;
  start: string;  // YYYY-MM-DD
  end: string;
  startDiff: number;
  endDiff: number;
}

export const PHASES: Phase[] = [
  { name: 'Foundation',          start: '2026-03-14', end: '2026-04-12', startDiff: 2.0, endDiff: 3.5 },
  { name: 'Core Build',          start: '2026-04-13', end: '2026-06-14', startDiff: 3.5, endDiff: 5.0 },
  { name: 'Speed + Patterning',  start: '2026-06-15', end: '2026-08-16', startDiff: 5.0, endDiff: 6.5 },
  { name: 'Advanced Reasoning',  start: '2026-08-17', end: '2026-10-04', startDiff: 6.5, endDiff: 8.0 },
  { name: 'CAT Simulation Ramp', start: '2026-10-05', end: '2026-11-15', startDiff: 8.0, endDiff: 9.5 },
  { name: 'Taper + Maintenance', start: '2026-11-16', end: '2026-11-29', startDiff: 8.0, endDiff: 7.5 },
];

export const PROGRAM_START = '2026-03-14';
export const PROGRAM_END   = '2026-11-29';

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

export function getPhaseForDate(dateStr: string): Phase | null {
  return PHASES.find(p => dateStr >= p.start && dateStr <= p.end) ?? null;
}

/** Base difficulty target for a given calendar date, before adaptation */
export function baseDifficultyForDate(dateStr: string): number {
  const phase = getPhaseForDate(dateStr);
  if (!phase) return 2.0;

  const total = daysBetween(phase.start, phase.end);
  const elapsed = daysBetween(phase.start, dateStr);
  const t = total > 0 ? elapsed / total : 0;
  const base = phase.startDiff + t * (phase.endDiff - phase.startDiff);

  // Weekly sine wave: lighter on Sundays, heavier mid-week to reduce burnout
  const dayN = daysBetween(PROGRAM_START, dateStr);
  const wave = Math.sin((dayN * Math.PI) / 3.5) * 0.3;

  return Math.round(Math.max(1, Math.min(10, base + wave)) * 10) / 10;
}

export function getDifficultyBand(score: number): string {
  if (score <= 2) return 'Easy';
  if (score <= 4) return 'Easy-Medium';
  if (score <= 6) return 'Medium';
  if (score <= 8) return 'Hard';
  return 'Expert';
}

/** Readiness score: composite of 4 dimensions, each 0–100 */
export function computeReadiness(
  consistency: number,   // % days completed — weight 35%
  accuracy: number,      // avg correctness — weight 30%
  speed: number,         // solve time vs target — weight 20%
  diffTolerance: number  // ability to do harder puzzles — weight 15%
): number {
  return Math.round(
    0.35 * consistency +
    0.30 * accuracy +
    0.20 * speed +
    0.15 * diffTolerance
  );
}

/** Whether a given date should include a challenge puzzle (every 2–3 days) */
export function hasChallengePuzzle(dateStr: string): boolean {
  const dayN = daysBetween(PROGRAM_START, dateStr);
  const phase = getPhaseForDate(dateStr);
  if (!phase) return false;
  // Heavy phases: every 2 days; lighter phases: every 3 days
  const interval = ['Foundation', 'Taper + Maintenance'].includes(phase.name) ? 3 : 2;
  return dayN % interval === 0;
}
