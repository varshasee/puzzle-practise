export default function TodayPage() {
  return (
    <main className="min-h-screen bg-black text-green-400 p-6">
      <div className="mx-auto max-w-4xl border border-green-500 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-green-500 mb-4">
          Today
        </p>

        <h1 className="text-3xl font-bold mb-6">Daily Practice</h1>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-green-700 p-4">
            <p className="text-xs uppercase text-green-500 mb-2">Sudoku</p>
            <p className="text-sm text-green-300">Warm-up puzzle</p>
          </div>

          <div className="border border-green-700 p-4">
            <p className="text-xs uppercase text-green-500 mb-2">Kakuro</p>
            <p className="text-sm text-green-300">Main timed puzzle</p>
          </div>
        </div>
      </div>
    </main>
  );
}