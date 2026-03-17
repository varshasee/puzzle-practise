"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitAttempt } from "@/app/play/actions";

type PlayGridProps = {
  type: "sudoku" | "kakuro";
  initialGrid: string[][];
  solutionGrid: string[][];
  assignmentId: string;
  puzzleId: string;
};

type ResultState =
  | { kind: "idle" }
  | { kind: "success"; elapsed: number; mistakes: number }
  | { kind: "retry"; wrongCells: Set<string> };

export function PlayGrid({
  type,
  initialGrid,
  solutionGrid,
  assignmentId,
  puzzleId,
}: PlayGridProps) {
  const router = useRouter();
  const [grid, setGrid] = useState(initialGrid);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [notes, setNotes] = useState<Record<string, Set<number>>>({});
  const [mistakes, setMistakes] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<ResultState>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const columnCount = useMemo(() => initialGrid[0]?.length ?? 0, [initialGrid]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!paused && result.kind === "idle") {
        setElapsed((e) => e + 1);
      }
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [paused, result.kind]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // ── Cell helpers ───────────────────────────────────────────────────────────
  const isPlayable = useCallback((row: number, col: number) => {
    const v = initialGrid[row][col];
    if (type === "sudoku") return v === "";
    return v !== "#" && !v.includes("\\");
  }, [initialGrid, type]);

  const noteKey = (r: number, c: number) => `${r}-${c}`;

  // ── Keyboard navigation ────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (result.kind !== "idle" || paused) return;

      const n = parseInt(e.key);
      if (n >= 1 && n <= 9) { enterNumber(n); return; }
      if (e.key === "Backspace" || e.key === "Delete") { clearSelected(); return; }
      if (!selected) return;

      const { row, col } = selected;
      if (e.key === "ArrowRight") setSelected({ row, col: Math.min(columnCount - 1, col + 1) });
      if (e.key === "ArrowLeft")  setSelected({ row, col: Math.max(0, col - 1) });
      if (e.key === "ArrowDown")  setSelected({ row: Math.min(initialGrid.length - 1, row + 1), col });
      if (e.key === "ArrowUp")    setSelected({ row: Math.max(0, row - 1), col });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, result.kind, paused, notesMode]);

  // ── Enter number ───────────────────────────────────────────────────────────
  function enterNumber(num: number) {
    if (!selected || result.kind !== "idle") return;
    const { row, col } = selected;
    if (!isPlayable(row, col)) return;

    if (notesMode) {
      const key = noteKey(row, col);
      setNotes((prev) => {
        const cur = new Set(prev[key] ?? []);
        if (cur.has(num)) cur.delete(num); else cur.add(num);
        return { ...prev, [key]: cur };
      });
      return;
    }

    // Check correctness immediately
    const correct = solutionGrid[row]?.[col];
    if (correct && String(num) !== String(correct)) {
      setMistakes((m) => m + 1);
    }

    setGrid((prev) =>
      prev.map((r, ri) =>
        r.map((cell, ci) => (ri === row && ci === col ? String(num) : cell))
      )
    );
    // Clear notes for this cell
    setNotes((prev) => { const n = { ...prev }; delete n[noteKey(row, col)]; return n; });
  }

  function clearSelected() {
    if (!selected || result.kind !== "idle") return;
    const { row, col } = selected;
    if (!isPlayable(row, col)) return;
    setGrid((prev) =>
      prev.map((r, ri) =>
        r.map((cell, ci) => (ri === row && ci === col ? "" : cell))
      )
    );
    setNotes((prev) => { const n = { ...prev }; delete n[noteKey(row, col)]; return n; });
  }

  // ── Board state ────────────────────────────────────────────────────────────
  const isFilled = grid.every((row, ri) =>
    row.every((cell, ci) => !isPlayable(ri, ci) || cell !== "")
  );

  function getWrongCells(): Set<string> {
    const wrong = new Set<string>();
    grid.forEach((row, ri) =>
      row.forEach((cell, ci) => {
        if (isPlayable(ri, ci) && String(cell) !== String(solutionGrid[ri]?.[ci])) {
          wrong.add(noteKey(ri, ci));
        }
      })
    );
    return wrong;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  function handleSubmit() {
    if (!isFilled) return;
    const wrong = getWrongCells();
    if (wrong.size > 0) {
      setResult({ kind: "retry", wrongCells: wrong });
      return;
    }
    clearInterval(timerRef.current!);
    setResult({ kind: "success", elapsed, mistakes });
    startTransition(async () => {
      await submitAttempt({ assignmentId, puzzleId, elapsedSeconds: elapsed, mistakesCount: mistakes });
    });
  }

  // ── Retry: clear wrong cells ───────────────────────────────────────────────
  function handleKeepTrying() {
    if (result.kind !== "retry") return;
    const { wrongCells } = result;
    setGrid((prev) =>
      prev.map((row, ri) =>
        row.map((cell, ci) =>
          wrongCells.has(noteKey(ri, ci)) ? "" : cell
        )
      )
    );
    setResult({ kind: "idle" });
    setSelected(null);
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  function handleReset() {
    setGrid(initialGrid);
    setNotes({});
    setMistakes(0);
    setElapsed(0);
    setSelected(null);
    setResult({ kind: "idle" });
    setPaused(false);
  }

  // ── Related cell highlight (sudoku only) ────────────────────────────────────
  function isRelated(row: number, col: number) {
    if (!selected || type !== "sudoku") return false;
    const { row: sr, col: sc } = selected;
    if (row === sr && col === col) return false;
    return (
      row === sr ||
      col === sc ||
      (Math.floor(row / 3) === Math.floor(sr / 3) &&
        Math.floor(col / 3) === Math.floor(sc / 3))
    );
  }

  function isConflict(row: number, col: number) {
    if (result.kind !== "retry") return false;
    return result.wrongCells.has(noteKey(row, col));
  }

  // ── Performance label ──────────────────────────────────────────────────────
  function perfLabel(m: number) {
    if (m === 0) return "Clean solve — no mistakes.";
    if (m <= 2) return "Good solve — keep working on accuracy.";
    return "Review this puzzle type to reduce errors.";
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const gridRows = type === "sudoku" ? 9 : initialGrid.length;
  const gridCols = type === "sudoku" ? 9 : columnCount;

  return (
    <div>
      {/* ── HUD ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: "1px",
          background: "var(--border-faint)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          marginBottom: "20px",
        }}
      >
        {[
          { label: "Time", value: formatTime(elapsed), color: "var(--accent)" },
          { label: "Mistakes", value: String(mistakes), color: mistakes > 0 ? "var(--warn)" : "var(--text-primary)" },
          { label: "Filled", value: `${grid.flat().filter((c, i) => { const r = Math.floor(i / gridCols); const col = i % gridCols; return isPlayable(r, col) && c !== ""; }).length}/${grid.flat().filter((c, i) => { const r = Math.floor(i / gridCols); const col = i % gridCols; return isPlayable(r, col); }).length}`, color: "var(--text-primary)" },
          { label: "Mode", value: notesMode ? "Notes" : "Normal", color: notesMode ? "var(--warn)" : "var(--text-primary)" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 0",
              background: "var(--bg-raised)",
              gap: "2px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "8px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "18px",
                fontWeight: 300,
                letterSpacing: "-0.5px",
                color,
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* ── Board + Controls ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 180px",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* Board */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              gap: "1px",
              background: "var(--border-subtle)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--r-lg)",
              overflow: "hidden",
              boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
            }}
          >
            {grid.flat().map((cell, index) => {
              const row = Math.floor(index / gridCols);
              const col = index % gridCols;
              const isSelected = selected?.row === row && selected?.col === col;
              const playable = isPlayable(row, col);
              const isGiven = !playable;
              const isBlock = type === "kakuro" && initialGrid[row][col] === "#";
              const isClue = type === "kakuro" && initialGrid[row][col].includes("\\");
              const conflict = isConflict(row, col);
              const related = isRelated(row, col);
              const userFilled = playable && cell !== "";
              const cellNotes = notes[noteKey(row, col)];
              const hasNotes = cellNotes && cellNotes.size > 0 && cell === "";

              // Block right border for 3x3 sections (sudoku)
              const blockRight = type === "sudoku" && col === 2 || col === 5;
              const blockBottom = type === "sudoku" && row === 2 || row === 5;

              let bg = "var(--bg-raised)";
              if (isBlock) bg = "#0A0A0A";
              else if (isSelected) bg = "var(--accent-dim)";
              else if (conflict) bg = "rgba(255,87,87,0.16)";
              else if (related) bg = "rgba(168,255,87,0.055)";

              let textColor = "var(--text-primary)";
              if (isGiven && !isBlock && !isClue) textColor = "var(--text-primary)";
              else if (userFilled && !conflict) textColor = "var(--accent)";
              else if (conflict) textColor = "var(--danger)";
              else if (isClue) textColor = "var(--text-secondary)";

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    if (!playable || result.kind === "success") return;
                    setSelected({ row, col });
                  }}
                  style={{
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    aspectRatio: "1",
                    fontFamily: "var(--font-mono)",
                    fontSize: type === "sudoku" ? "17px" : "13px",
                    fontWeight: isGiven ? 500 : 400,
                    color: textColor,
                    cursor: playable && result.kind !== "success" ? "pointer" : "default",
                    border: "none",
                    outline: isSelected ? "2px solid var(--accent)" : "none",
                    outlineOffset: "-2px",
                    zIndex: isSelected ? 2 : 1,
                    position: "relative",
                    borderRight: blockRight ? "2px solid rgba(255,255,255,0.18)" : undefined,
                    borderBottom: blockBottom ? "2px solid rgba(255,255,255,0.18)" : undefined,
                    transition: "background 90ms ease",
                  }}
                >
                  {hasNotes ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3,1fr)",
                        gridTemplateRows: "repeat(3,1fr)",
                        position: "absolute",
                        inset: "2px",
                        pointerEvents: "none",
                      }}
                    >
                      {[1,2,3,4,5,6,7,8,9].map((n) => (
                        <span
                          key={n}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "7px",
                            fontFamily: "var(--font-mono)",
                            color: cellNotes.has(n) ? "rgba(240,240,242,0.45)" : "transparent",
                          }}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span>{isBlock ? "" : cell}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Paused overlay */}
          {paused && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(12,12,13,0.95)",
                backdropFilter: "blur(8px)",
                borderRadius: "var(--r-lg)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                }}
              >
                Paused
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "48px",
                  fontWeight: 300,
                  color: "var(--text-secondary)",
                  letterSpacing: "-2px",
                }}
              >
                {formatTime(elapsed)}
              </div>
              <button
                onClick={() => setPaused(false)}
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-text)",
                  border: "none",
                  borderRadius: "var(--r-md)",
                  padding: "0 20px",
                  height: "36px",
                  fontFamily: "var(--font-ui)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Resume
              </button>
            </div>
          )}

          {/* Success overlay */}
          {result.kind === "success" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(12,12,13,0.92)",
                backdropFilter: "blur(10px)",
                borderRadius: "var(--r-lg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  background: "var(--bg-float)",
                  border: "1px solid var(--border-accent)",
                  borderRadius: "var(--r-xl)",
                  padding: "36px 40px",
                  textAlign: "center",
                  maxWidth: "300px",
                  width: "100%",
                  animation: "panelIn 280ms cubic-bezier(.16,1,.3,1) both",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "32px",
                    color: "var(--accent)",
                    marginBottom: "8px",
                  }}
                >
                  ✓
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "20px",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    marginBottom: "4px",
                  }}
                >
                  {result.mistakes === 0 ? "Clean Solve" : "Solved"}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    marginBottom: "20px",
                    lineHeight: 1.5,
                  }}
                >
                  {perfLabel(result.mistakes)}
                </div>

                {/* Stats */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "28px",
                    marginBottom: "24px",
                  }}
                >
                  {[
                    { val: formatTime(result.elapsed), lbl: "Time" },
                    { val: String(result.mistakes), lbl: "Mistakes" },
                  ].map(({ val, lbl }) => (
                    <div key={lbl} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "22px",
                          fontWeight: 300,
                          letterSpacing: "-0.5px",
                          color: "var(--accent)",
                        }}
                      >
                        {val}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "9px",
                          letterSpacing: "0.8px",
                          textTransform: "uppercase",
                          color: "var(--text-tertiary)",
                        }}
                      >
                        {lbl}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => router.push("/today")}
                  disabled={isPending}
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-text)",
                    border: "none",
                    borderRadius: "var(--r-md)",
                    padding: "0 24px",
                    height: "40px",
                    fontFamily: "var(--font-ui)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    width: "100%",
                    opacity: isPending ? 0.6 : 1,
                  }}
                >
                  {isPending ? "Saving..." : "Back to Today"}
                </button>
              </div>
            </div>
          )}

          {/* Retry panel — shown below board, not as overlay */}
        </div>

        {/* Controls panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Numpad */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                marginBottom: "8px",
              }}
            >
              Numbers
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "5px" }}>
              {[1,2,3,4,5,6,7,8,9].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => enterNumber(n)}
                  style={{
                    aspectRatio: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: "18px",
                    fontWeight: 300,
                    color: "var(--text-primary)",
                    background: "var(--bg-float)",
                    border: "1px solid var(--border-faint)",
                    borderRadius: "var(--r-md)",
                    cursor: "pointer",
                    transition: "all 90ms ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.background = "var(--bg-overlay)";
                    (e.target as HTMLButtonElement).style.color = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.background = "var(--bg-float)";
                    (e.target as HTMLButtonElement).style.color = "var(--text-primary)";
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Mode toggle */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                marginBottom: "8px",
              }}
            >
              Mode
            </div>
            <div style={{ display: "flex", gap: "5px" }}>
              {(["Normal", "Notes"] as const).map((m) => {
                const active = (m === "Notes") === notesMode;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setNotesMode(m === "Notes")}
                    style={{
                      flex: 1,
                      height: "30px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      letterSpacing: "0.8px",
                      textTransform: "uppercase",
                      background: active ? "var(--accent-dim)" : "var(--bg-float)",
                      border: active ? "1px solid var(--border-accent)" : "1px solid var(--border-faint)",
                      borderRadius: "var(--r-md)",
                      color: active ? "var(--accent)" : "var(--text-tertiary)",
                      cursor: "pointer",
                      transition: "all 90ms ease",
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <button
              type="button"
              onClick={clearSelected}
              style={{
                height: "30px",
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                background: "transparent",
                border: "1px solid var(--border-faint)",
                borderRadius: "var(--r-md)",
                color: "var(--text-tertiary)",
                cursor: "pointer",
                transition: "all 90ms ease",
              }}
            >
              Clear cell
            </button>

            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              style={{
                height: "30px",
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                background: "transparent",
                border: "1px solid var(--border-faint)",
                borderRadius: "var(--r-md)",
                color: "var(--text-tertiary)",
                cursor: "pointer",
              }}
            >
              {paused ? "Resume" : "Pause"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              style={{
                height: "30px",
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                background: "transparent",
                border: "1px solid rgba(255,87,87,0.3)",
                borderRadius: "var(--r-md)",
                color: "var(--danger)",
                cursor: "pointer",
              }}
            >
              Reset
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isFilled || result.kind === "success"}
              style={{
                height: "38px",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                background: isFilled ? "var(--accent)" : "var(--bg-float)",
                border: isFilled ? "1px solid var(--accent)" : "1px solid var(--border-faint)",
                borderRadius: "var(--r-md)",
                color: isFilled ? "var(--accent-text)" : "var(--text-disabled)",
                cursor: isFilled ? "pointer" : "not-allowed",
                fontWeight: 600,
                transition: "all 90ms ease",
                marginTop: "4px",
              }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      {/* ── Retry panel (below board) ──────────────────────────────────────── */}
      {result.kind === "retry" && (
        <div
          style={{
            marginTop: "16px",
            background: "var(--bg-float)",
            border: "1px solid rgba(255,184,48,0.3)",
            borderRadius: "var(--r-xl)",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            animation: "panelIn 280ms cubic-bezier(.16,1,.3,1) both",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "15px",
                fontWeight: 500,
                color: "var(--text-primary)",
                marginBottom: "3px",
              }}
            >
              Not quite
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-tertiary)",
              }}
            >
              {result.wrongCells.size} cell{result.wrongCells.size !== 1 ? "s are" : " is"} incorrect — highlighted in red
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleKeepTrying}
              style={{
                height: "34px",
                padding: "0 16px",
                fontFamily: "var(--font-ui)",
                fontSize: "12px",
                fontWeight: 500,
                background: "transparent",
                border: "1px solid var(--border-muted)",
                borderRadius: "var(--r-md)",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              Keep trying
            </button>
            <button
              onClick={() => {
                // Reveal solution
                setGrid(solutionGrid.map((r) => r.map((c) => c)));
                setResult({ kind: "idle" });
                clearInterval(timerRef.current!);
              }}
              style={{
                height: "34px",
                padding: "0 16px",
                fontFamily: "var(--font-ui)",
                fontSize: "12px",
                background: "transparent",
                border: "1px solid rgba(255,87,87,0.3)",
                borderRadius: "var(--r-md)",
                color: "var(--danger)",
                cursor: "pointer",
              }}
            >
              Reveal
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}