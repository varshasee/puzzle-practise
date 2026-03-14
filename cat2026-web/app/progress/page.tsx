import { consistencyDays } from "@/lib/mock-data";

export default function ProgressPage() {
  return (
    <main className="min-h-screen bg-black text-green-400 p-6">
      <div className="mx-auto max-w-5xl border border-green-500 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-green-500 mb-4">
          Progress
        </p>

        <h1 className="text-3xl font-bold mb-6">Consistency Tracker</h1>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="border border-green-700 p-4">
            <p className="text-xs uppercase text-green-500 mb-2">Current Streak</p>
            <p className="text-3xl font-bold">6</p>
          </div>

          <div className="border border-green-700 p-4">
            <p className="text-xs uppercase text-green-500 mb-2">Best Streak</p>
            <p className="text-3xl font-bold">11</p>
          </div>

          <div className="border border-green-700 p-4">
            <p className="text-xs uppercase text-green-500 mb-2">Readiness</p>
            <p className="text-3xl font-bold">72%</p>
          </div>
        </div>

        <div className="border border-green-700 p-4">
          <p className="text-xs uppercase text-green-500 mb-4">
            Last 21 Days
          </p>

          <div className="grid grid-cols-7 gap-2">
            {consistencyDays.map((day) => (
              <div
                key={day.id}
                className={`h-10 border ${
                  day.done
                    ? "border-green-400 bg-green-500/20"
                    : "border-green-900 bg-black"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}