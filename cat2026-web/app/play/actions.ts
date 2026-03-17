"use server";

import { createClient } from "@/lib/supabase/server";

export async function markAssignmentInProgress(assignmentId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("daily_assignments")
    .update({ status: "in_progress" })
    .eq("id", assignmentId)
    .eq("user_id", user.id)
    .neq("status", "completed");

  if (error) throw new Error(error.message);
}

export async function submitAttempt(input: {
  assignmentId: string;
  puzzleId: string;
  elapsedSeconds?: number;
  mistakesCount?: number;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Write the attempt row with real timing and mistake data
  const { error: attemptError } = await supabase.from("attempts").insert({
    user_id: user.id,
    puzzle_id: input.puzzleId,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    elapsed_seconds: input.elapsedSeconds ?? 0,
    mistakes_count: input.mistakesCount ?? 0,
    hints_used: 0,
    completed: true,
    success: true,
    final_state: {},
  });

  if (attemptError) throw new Error(attemptError.message);

  // Mark assignment completed
  const { error: assignmentError } = await supabase
    .from("daily_assignments")
    .update({ status: "completed" })
    .eq("id", input.assignmentId)
    .eq("user_id", user.id);

  if (assignmentError) throw new Error(assignmentError.message);

  // Upsert daily_stats so progress page reflects this immediately
  const today = new Date().toLocaleDateString("en-CA");

  const { data: todayAssignments } = await supabase
    .from("daily_assignments")
    .select("status")
    .eq("user_id", user.id)
    .eq("assignment_date", today);

  const assignedCount = todayAssignments?.length ?? 0;
  const completedCount = todayAssignments?.filter((a) => a.status === "completed").length ?? 0;

  const { data: todayAttempts } = await supabase
    .from("attempts")
    .select("elapsed_seconds, mistakes_count")
    .eq("user_id", user.id)
    .gte("completed_at", `${today}T00:00:00`)
    .lte("completed_at", `${today}T23:59:59`);

  const totalSeconds = todayAttempts?.reduce((sum, a) => sum + (a.elapsed_seconds ?? 0), 0) ?? 0;
  const totalMistakes = todayAttempts?.reduce((sum, a) => sum + (a.mistakes_count ?? 0), 0) ?? 0;
  const attemptCount = todayAttempts?.length ?? 1;
  const avgAccuracy = Math.max(0, Math.round(100 - (totalMistakes / attemptCount) * 10));

  // Compute streak by walking back through daily_stats
  const { data: recentStats } = await supabase
    .from("daily_stats")
    .select("stat_date, completed_count")
    .eq("user_id", user.id)
    .order("stat_date", { ascending: false })
    .limit(30);

  let currentStreak = completedCount > 0 ? 1 : 0;
  if (recentStats && recentStats.length > 0) {
    const doneSet = new Set(recentStats.filter((r) => r.completed_count > 0).map((r) => r.stat_date));
    let cursor = new Date(today);
    cursor.setDate(cursor.getDate() - 1);
    while (true) {
      const ds = cursor.toISOString().slice(0, 10);
      if (doneSet.has(ds)) {
        currentStreak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
  }

  const existingBest = recentStats?.[0] ? Math.max(...(recentStats.map((r) => 0))) : 0;
  const bestStreak = Math.max(currentStreak, existingBest);

  await supabase
    .from("daily_stats")
    .upsert(
      {
        user_id: user.id,
        stat_date: today,
        assigned_count: assignedCount,
        completed_count: completedCount,
        total_seconds: totalSeconds,
        avg_accuracy: avgAccuracy,
        streak_active: currentStreak,
        best_streak: bestStreak,
      },
      { onConflict: "user_id,stat_date" }
    );
}