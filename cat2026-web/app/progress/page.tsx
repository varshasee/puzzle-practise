export default function ProgressPage() {
  return (
    <main className="min-h-screen bg-black text-green-400 p-6">
      <div className="mx-auto max-w-4xl border border-green-500 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-green-500 mb-4">
          Progress
        </p>

        <h1 className="text-3xl font-bold mb-6">Consistency Tracker</h1>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="border border-green-700 p-4">
            <p className="text-xs uppercase text-green-500 mb-2">Current Streak</p>
            <p className="text-2xl font-bold">0</p>
          </div>

          <div className="border border-green-700 p-4">
            <p className="text-xs uppercase text-green-500 mb-2">Best Streak</p>
            <p className="text-2xl font-bold">0</p>
          </div>

          <div className="border border-green-700 p-4">
            <p className="text-xs uppercase text-green-500 mb-2">Readiness</p>
            <p className="text-2xl font-bold">0%</p>
          </div>
        </div>
      </div>
    </main>
  );
}