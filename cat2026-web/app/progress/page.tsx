import { consistencyDays } from "@/lib/mock-data";
import { StatsCard } from "@/components/stats-card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-black text-green-400 p-6">
      <div className="mx-auto max-w-5xl border border-green-500 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-green-500 mb-4">
          Progress
        </p>

        <h1 className="text-3xl font-bold mb-6">Consistency Tracker</h1>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <StatsCard label="Current Streak" value="6" />
          <StatsCard label="Best Streak" value="11" />
          <StatsCard label="Readiness" value="72%" />
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