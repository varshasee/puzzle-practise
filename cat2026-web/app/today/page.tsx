import Link from "next/link";
import { todaysPuzzles } from "@/lib/mock-data";


export default function TodayPage() {
  const today = new Date().toLocaleDateString("en-CA");

  return (
    <main className="min-h-screen bg-black text-green-400 p-6">
      <div className="mx-auto max-w-5xl border border-green-500 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-green-500 mb-4">
          Today
        </p>

        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Daily Practice</h1>
            <p className="text-sm text-green-300 mt-2">
              Your CAT 2026 training set for {today}
            </p>
          </div>

          <div className="border border-green-700 px-4 py-3 text-sm">
            <p className="text-green-500 uppercase text-xs mb-1">Target</p>
            <p className="text-green-300">2 core puzzles + 1 challenge</p>
          </div>
        </div>

        <div className="grid gap-4">
          {todaysPuzzles.map((puzzle) => (
            <div
              key={puzzle.id}
              className="border border-green-700 p-4 md:p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-green-500 mb-2">
                    {puzzle.type}
                  </p>
                  <h2 className="text-xl font-bold mb-2">{puzzle.title}</h2>

                  <div className="flex flex-wrap gap-3 text-sm text-green-300">
                    <span>Difficulty: {puzzle.difficulty}</span>
                    <span>Status: {puzzle.status}</span>
                  </div>
                </div>

                <Link
                  href={`/play?puzzle=${puzzle.id}`}
                  className="border border-green-500 px-4 py-2 text-sm uppercase tracking-[0.2em] hover:bg-green-500 hover:text-black transition inline-block"
                >
                  Start
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}