export default function ArchivePage() {
  return (
    <main className="min-h-screen bg-black text-green-400 p-6">
      <div className="mx-auto max-w-4xl border border-green-500 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-green-500 mb-4">
          Archive
        </p>

        <h1 className="text-3xl font-bold mb-6">Past Practice Days</h1>

        <div className="space-y-4">
          <div className="border border-green-700 p-4">
            <p className="text-sm text-green-300">2026-03-14 — Sudoku + Kakuro</p>
          </div>

          <div className="border border-green-700 p-4">
            <p className="text-sm text-green-300">2026-03-15 — Sudoku + Kakuro</p>
          </div>

          <div className="border border-green-700 p-4">
            <p className="text-sm text-green-300">2026-03-16 — Sudoku + Kakuro</p>
          </div>
        </div>
      </div>
    </main>
  );
}
