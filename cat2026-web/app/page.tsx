import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-green-400 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl border border-green-500 p-8">
        <p className="text-xs tracking-[0.3em] uppercase mb-4 text-green-500">
          CAT 2026 Practice System
        </p>

        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Sudoku + Kakuro
        </h1>

        <p className="text-base md:text-lg text-green-300 mb-8 leading-7">
          Daily puzzle practice. Progressive difficulty. Consistency tracking.
          Built for focused CAT 2026 preparation.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/today"
            className="border border-green-700 p-4 block hover:border-green-400"
          >
            <p className="text-xs uppercase mb-2 text-green-500">Today</p>
            <p className="text-sm text-green-300">Start today&apos;s puzzles</p>
          </Link>

          <Link
            href="/progress"
            className="border border-green-700 p-4 block hover:border-green-400"
          >
            <p className="text-xs uppercase mb-2 text-green-500">Progress</p>
            <p className="text-sm text-green-300">View streaks and readiness</p>
          </Link>

          <Link
            href="/archive"
            className="border border-green-700 p-4 block hover:border-green-400"
          >
            <p className="text-xs uppercase mb-2 text-green-500">Archive</p>
            <p className="text-sm text-green-300">Browse past practice days</p>
          </Link>
        </div>
      </div>
    </main>
  );
}