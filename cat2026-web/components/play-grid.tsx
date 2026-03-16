"use client";

import { useMemo, useState, useTransition } from "react";
import { submitAttempt } from "@/app/play/actions";

type PlayGridProps = {
  type: "sudoku" | "kakuro";
  initialGrid: string[][];
  solutionGrid: string[][];
  assignmentId: string;
  puzzleId: string;
};

export function PlayGrid({
  type,
  initialGrid,
  solutionGrid,
  assignmentId,
  puzzleId,
}: PlayGridProps) {
  const [grid, setGrid] = useState(initialGrid);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const columnCount = useMemo(() => {
    return initialGrid[0]?.length ?? 0;
  }, [initialGrid]);

  function isPlayableCell(row: number, col: number) {
    const value = initialGrid[row][col];

    if (type === "sudoku") {
      return value === "";
    }

    if (type === "kakuro") {
      return value !== "#" && !value.includes("\\");
    }

    return false;
  }

  function handleCellClick(row: number, col: number) {
    if (!isPlayableCell(row, col)) return;
    setSelectedCell({ row, col });
  }

  function handleNumberClick(num: number) {
    if (!selectedCell) return;

    const { row, col } = selectedCell;

    setGrid((prev) =>
      prev.map((r, rIndex) =>
        r.map((cell, cIndex) => {
          if (rIndex === row && cIndex === col) {
            return String(num);
          }
          return cell;
        })
      )
    );
  }

  function handleClear() {
    if (!selectedCell) return;

    const { row, col } = selectedCell;

    if (!isPlayableCell(row, col)) return;

    setGrid((prev) =>
      prev.map((r, rIndex) =>
        r.map((cell, cIndex) => {
          if (rIndex === row && cIndex === col) {
            return "";
          }
          return cell;
        })
      )
    );
  }

  const isBoardFilled = grid.every((row, rowIndex) =>
    row.every((cell, colIndex) => {
      if (!isPlayableCell(rowIndex, colIndex)) return true;
      return cell !== "";
    })
  );

  function isBoardCorrect() {
    return grid.every((row, rowIndex) =>
      row.every((cell, colIndex) => {
        if (!isPlayableCell(rowIndex, colIndex)) return true;
        return cell === solutionGrid[rowIndex]?.[colIndex];
      })
    );
  }

  function handleSubmit() {
    setMessage("");

    if (!isBoardFilled) {
      setMessage("Fill all playable cells before submitting.");
      return;
    }

    if (!isBoardCorrect()) {
      setMessage("Some entries are incorrect. Check and try again.");
      return;
    }

    setMessage("Good job. Puzzle completed.");

    startTransition(async () => {
      await submitAttempt({
        assignmentId,
        puzzleId,
      });
    });
  }

  if (type === "sudoku") {
    return (
      <div className="grid gap-8 md:grid-cols-[1fr_220px]">
        <div>
          <div className="grid grid-cols-9 border border-green-500">
            {grid.flat().map((cell, index) => {
              const row = Math.floor(index / 9);
              const col = index % 9;
              const isSelected =
                selectedCell?.row === row && selectedCell?.col === col;
              const isFixed = !isPlayableCell(row, col);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleCellClick(row, col)}
                  className={`flex aspect-square items-center justify-center border border-green-900 text-lg font-semibold ${
                    isSelected ? "bg-green-500 text-black" : ""
                  } ${isFixed ? "text-green-300" : "text-green-100"}`}
                >
                  {cell}
                </button>
              );
            })}
          </div>

          {message ? (
            <p className="mt-4 text-sm text-green-300">{message}</p>
          ) : null}
        </div>

        <div className="border border-green-700 p-4">
          <p className="mb-4 text-xs uppercase text-green-500">Controls</p>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumberClick(num)}
                className="border border-green-700 py-3 hover:border-green-400"
              >
                {num}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={handleClear}
              className="w-full border border-green-700 px-4 py-2 text-xs uppercase hover:border-green-400"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isBoardFilled || isPending}
              className="w-full border border-green-500 px-4 py-2 text-xs uppercase disabled:opacity-50 hover:bg-green-500 hover:text-black"
            >
              {isPending ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_220px]">
      <div>
        <div
          className="grid border border-green-500"
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
        >
          {grid.flat().map((cell, index) => {
            const row = Math.floor(index / columnCount);
            const col = index % columnCount;
            const isSelected =
              selectedCell?.row === row && selectedCell?.col === col;
            const isBlock = initialGrid[row][col] === "#";
            const isClue =
              typeof initialGrid[row][col] === "string" &&
              initialGrid[row][col].includes("\\");
            const isPlayable = isPlayableCell(row, col);

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleCellClick(row, col)}
                className={`flex aspect-square items-center justify-center border border-green-900 text-xs font-semibold ${
                  isBlock ? "bg-green-950" : ""
                } ${isClue ? "bg-green-900 text-green-200" : ""} ${
                  isSelected ? "bg-green-500 text-black" : ""
                }`}
                disabled={!isPlayable}
              >
                {isBlock ? "" : cell}
              </button>
            );
          })}
        </div>

        {message ? (
          <p className="mt-4 text-sm text-green-300">{message}</p>
        ) : null}
      </div>

      <div className="border border-green-700 p-4">
        <p className="mb-4 text-xs uppercase text-green-500">Controls</p>

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleNumberClick(num)}
              className="border border-green-700 py-3 hover:border-green-400"
            >
              {num}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={handleClear}
            className="w-full border border-green-700 px-4 py-2 text-xs uppercase hover:border-green-400"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isBoardFilled || isPending}
            className="w-full border border-green-500 px-4 py-2 text-xs uppercase disabled:opacity-50 hover:bg-green-500 hover:text-black"
          >
            {isPending ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}