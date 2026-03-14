// Sudoku puzzle generator with backtracking solver and unique-solution validator

export interface SudokuPuzzle {
  grid: number[][];       // 0 = empty
  solution: number[][];   // fully solved
  metadata: {
    difficulty_score: number;
    clue_count: number;
    technique_depth: number;
  };
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isValid(board: number[][], r: number, c: number, n: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[r][i] === n || board[i][c] === n) return false;
    const br = 3 * Math.floor(r / 3) + Math.floor(i / 3);
    const bc = 3 * Math.floor(c / 3) + (i % 3);
    if (board[br][bc] === n) return false;
  }
  return true;
}

function buildSolvedBoard(): number[][] {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  const fill = (pos: number): boolean => {
    if (pos === 81) return true;
    const r = Math.floor(pos / 9), c = pos % 9;
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const n of nums) {
      if (isValid(board, r, c, n)) {
        board[r][c] = n;
        if (fill(pos + 1)) return true;
        board[r][c] = 0;
      }
    }
    return false;
  };
  fill(0);
  return board;
}

// Returns number of solutions — stops counting at `limit`
function countSolutions(board: number[][], limit: number): number {
  let count = 0;
  const copy = board.map(r => [...r]);
  const solve = (pos: number): void => {
    if (count >= limit) return;
    if (pos === 81) { count++; return; }
    const r = Math.floor(pos / 9), c = pos % 9;
    if (copy[r][c] !== 0) { solve(pos + 1); return; }
    for (let n = 1; n <= 9; n++) {
      if (isValid(copy, r, c, n)) {
        copy[r][c] = n;
        solve(pos + 1);
        copy[r][c] = 0;
      }
      if (count >= limit) return;
    }
  };
  solve(0);
  return count;
}

function difficultyToClues(diff: number): number {
  // diff 1 → 45 clues, diff 10 → 22 clues
  return Math.round(45 - ((diff - 1) / 9) * 23);
}

function scoreDifficulty(grid: number[][]): number {
  const empty = grid.flat().filter(n => n === 0).length;
  // Simple heuristic: more empty = harder
  if (empty <= 36) return 2.0;
  if (empty <= 42) return 4.0;
  if (empty <= 50) return 6.0;
  if (empty <= 56) return 8.0;
  return 9.5;
}

export function generateSudoku(targetDifficulty: number, maxRetries = 20): SudokuPuzzle {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const solution = buildSolvedBoard();
    const clueCount = difficultyToClues(targetDifficulty);
    const removeCount = 81 - clueCount;

    const grid = solution.map(r => [...r]);
    const positions = shuffle(Array.from({ length: 81 }, (_, i) => i));

    let removed = 0;
    for (const idx of positions) {
      if (removed >= removeCount) break;
      const r = Math.floor(idx / 9), c = idx % 9;
      const backup = grid[r][c];
      grid[r][c] = 0;
      // Validate unique solution — revert if not
      if (countSolutions(grid, 2) !== 1) {
        grid[r][c] = backup;
      } else {
        removed++;
      }
    }

    const score = scoreDifficulty(grid);
    return {
      grid,
      solution,
      metadata: { difficulty_score: score, clue_count: 81 - removed, technique_depth: removed },
    };
  }
  throw new Error('generateSudoku: could not generate valid puzzle after retries');
}
