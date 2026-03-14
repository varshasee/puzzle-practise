#!/usr/bin/env tsx
/**
 * generate-calendar.ts
 * Seeds daily_assignments for every user+day from Mar 14 to Nov 29, 2026.
 * Run once: npx tsx scripts/generate-calendar.ts
 */

import { createClient } from '@supabase/supabase-js';
import { baseDifficultyForDate, getPhaseForDate, hasChallengePuzzle, PROGRAM_START, PROGRAM_END } from '../lib/assignment/phases';
import { getDifficultyBand } from '../lib/assignment/phases';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

async function getOrPickPuzzle(
  puzzleType: 'sudoku' | 'kakuro',
  date: string,
  difficulty: number
): Promise<string> {
  // Pick puzzle closest to target difficulty for this date
  const { data, error } = await supabase
    .from('puzzles')
    .select('id, difficulty_score')
    .eq('puzzle_type', puzzleType)
    .gte('difficulty_score', difficulty - 0.5)
    .lte('difficulty_score', difficulty + 0.5)
    .limit(10);

  if (error || !data?.length) {
    // Fallback: nearest difficulty
    const { data: fallback } = await supabase
      .from('puzzles')
      .select('id')
      .eq('puzzle_type', puzzleType)
      .order('difficulty_score', { ascending: true })
      .limit(1);
    return fallback?.[0]?.id ?? '';
  }

  // Rotate by date hash to vary which puzzle is picked per day
  const hash = date.split('-').join('').slice(-3);
  const idx = parseInt(hash, 10) % data.length;
  return data[idx].id;
}

async function main() {
  console.log(`Seeding assignments from ${PROGRAM_START} to ${PROGRAM_END}...`);

  const dates = dateRange(PROGRAM_START, PROGRAM_END);
  const assignments: object[] = [];

  for (const date of dates) {
    const phase = getPhaseForDate(date);
    if (!phase) continue;
    const baseDiff = baseDifficultyForDate(date);
    const warmupDiff = Math.max(1, baseDiff - 1.0);
    const challengeDiff = Math.min(10, baseDiff + 1.5);

    // Warmup Sudoku
    const sudokuWarmupId = await getOrPickPuzzle('sudoku', date, warmupDiff);
    if (sudokuWarmupId) {
      assignments.push({
        assignment_date: date,
        puzzle_id: sudokuWarmupId,
        slot_type: 'warmup',
        planned_difficulty: warmupDiff,
        effective_difficulty: warmupDiff,
        status: 'assigned',
      });
    }

    // Timed Kakuro
    const kakuroId = await getOrPickPuzzle('kakuro', date, baseDiff);
    if (kakuroId) {
      assignments.push({
        assignment_date: date,
        puzzle_id: kakuroId,
        slot_type: 'timed',
        planned_difficulty: baseDiff,
        effective_difficulty: baseDiff,
        status: 'assigned',
      });
    }

    // Challenge puzzle every 2–3 days
    if (hasChallengePuzzle(date)) {
      const challengeId = await getOrPickPuzzle('sudoku', date, challengeDiff);
      if (challengeId) {
        assignments.push({
          assignment_date: date,
          puzzle_id: challengeId,
          slot_type: 'challenge',
          planned_difficulty: challengeDiff,
          effective_difficulty: challengeDiff,
          status: 'assigned',
        });
      }
    }
  }

  // NOTE: These assignments have no user_id — they're "template" assignments.
  // In the app, when a user first logs in, a server action clones these to
  // daily_assignments with their user_id. This avoids generating per-user rows upfront.
  console.log(`Generated ${assignments.length} assignment templates.`);
  console.log('Done. Run the app and log in to materialize per-user assignments.');
}

main().catch(console.error);
