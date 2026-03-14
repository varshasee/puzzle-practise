const sudokuGrid = [
  ["5", "3", "", "", "7", "", "", "", ""],
  ["6", "", "", "1", "9", "5", "", "", ""],
  ["", "9", "8", "", "", "", "", "6", ""],
  ["8", "", "", "", "6", "", "", "", "3"],
  ["4", "", "", "8", "", "3", "", "", "1"],
  ["7", "", "", "", "2", "", "", "", "6"],
  ["", "6", "", "", "", "", "2", "8", ""],
  ["", "", "", "4", "1", "9", "", "", "5"],
  ["", "", "", "", "8", "", "", "7", "9"],
];

export default function PlayPage() {
  return (
    <main className="min-h-screen bg-black text-green-400 p-6">
      <div className="mx-auto max-w-5xl border border-green-500 p-6">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-green-500 mb-2">
              Play
            </p>
            <h1 className="text-3xl font-bold">Sudoku Practice</h1>
            <p className="text-sm text-green-300 mt-2">
              Difficulty: Medium · Timer: 08:42 · Mistakes: 0
            </p>
          </div>

          <div className="flex gap-2">
            <button className="border border-green-700 px-4 py-2 text-xs uppercase hover:border-green-400">
              Pause
            </button>
            <button className="border border-green-700 px-4 py-2 text-xs uppercase hover:border-green-400">
              Reset
            </button>
            <button className="border border-green-500 px-4 py-2 text-xs uppercase hover:bg-green-500 hover:text-black">
              Submit
            </button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_220px]">
          <div className="grid grid-cols-9 border border-green-500">
            {sudokuGrid.flat().map((cell, index) => (
              <div
                key={index}
                className="flex aspect-square items-center justify-center border border-green-900 text-lg font-semibold"
              >
                {cell}
              </div>
            ))}
          </div>

          <div className="border border-green-700 p-4">
            <p className="text-xs uppercase text-green-500 mb-4">Controls</p>

            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  className="border border-green-700 py-3 hover:border-green-400"
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <button className="w-full border border-green-700 px-4 py-2 text-xs uppercase hover:border-green-400">
                Pencil Mode
              </button>
              <button className="w-full border border-green-700 px-4 py-2 text-xs uppercase hover:border-green-400">
                Hint
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}