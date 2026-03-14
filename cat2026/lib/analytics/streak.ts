// Streak and consistency calculation

interface DayRecord {
  stat_date: string;   // YYYY-MM-DD
  completed_count: number;
}

export interface StreakResult {
  currentStreak: number;
  bestStreak: number;
  totalDaysCompleted: number;
  consistencyPct: number;  // 0–100 for readiness formula
}

export function calculateStreak(records: DayRecord[], today: string): StreakResult {
  if (!records.length) {
    return { currentStreak: 0, bestStreak: 0, totalDaysCompleted: 0, consistencyPct: 0 };
  }

  // Sort ascending
  const sorted = [...records].sort((a, b) => a.stat_date.localeCompare(b.stat_date));
  const doneSet = new Set(sorted.filter(r => r.completed_count > 0).map(r => r.stat_date));

  // Current streak: count backwards from today
  let currentStreak = 0;
  let cursor = new Date(today);
  while (true) {
    const ds = cursor.toISOString().slice(0, 10);
    if (doneSet.has(ds)) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  // Best streak: max consecutive
  let bestStreak = 0;
  let run = 0;
  for (const rec of sorted) {
    if (rec.completed_count > 0) {
      run++;
      if (run > bestStreak) bestStreak = run;
    } else {
      run = 0;
    }
  }

  const totalDaysCompleted = doneSet.size;
  const totalDays = sorted.length || 1;
  const consistencyPct = Math.round((totalDaysCompleted / totalDays) * 100);

  return { currentStreak, bestStreak, totalDaysCompleted, consistencyPct };
}
