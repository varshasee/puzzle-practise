import { todaysPuzzles } from "@/lib/mock-data";
import { PuzzleCard } from "@/components/puzzle-card";

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
            <PuzzleCard
              key={puzzle.id}
              id={puzzle.id}
              title={puzzle.title}
              type={puzzle.type}
              difficulty={puzzle.difficulty}
              status={puzzle.status}
            />
          ))}
        </div>
      </div>
    </main>
  );
}