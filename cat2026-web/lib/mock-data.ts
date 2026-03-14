export const todaysPuzzles = [
  {
    id: "sudoku-warmup",
    title: "Warm-up Grid",
    type: "Sudoku",
    difficulty: "Easy",
    status: "Not Started",
  },
  {
    id: "kakuro-main",
    title: "Main Timed Puzzle",
    type: "Kakuro",
    difficulty: "Medium",
    status: "Not Started",
  },
  {
    id: "sudoku-challenge",
    title: "Challenge Puzzle",
    type: "Sudoku",
    difficulty: "Hard",
    status: "Not Started",
  },
];

export const archiveDays = [
  { date: "2026-03-14", status: "Completed" },
  { date: "2026-03-15", status: "Completed" },
  { date: "2026-03-16", status: "Missed" },
  { date: "2026-03-17", status: "Completed" },
  { date: "2026-03-18", status: "In Progress" },
];

export const consistencyDays = Array.from({ length: 21 }, (_, i) => ({
  id: i,
  done: i % 3 !== 0,
}));