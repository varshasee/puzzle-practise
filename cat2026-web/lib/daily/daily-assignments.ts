import { createClient } from "@/lib/supabase/server";

export async function ensureTodayAssignments(userId: string): Promise<void> {
  const supabase = await createClient();
  const today = new Date().toLocaleDateString("en-CA");

  // Check if assignments already exist for today
  const { data: existing } = await supabase
    .from("daily_assignments")
    .select("id")
    .eq("user_id", userId)
    .eq("assignment_date", today)
    .limit(1);

  if (existing && existing.length > 0) return;

  // No assignments yet — pick from puzzle pool
  const { data: easyPuzzles } = await supabase
    .from("puzzles")
    .select("id, difficulty_score")
    .lte("difficulty_score", 3.5)
    .order("difficulty_score", { ascending: true })
    .limit(1);

  const { data: mediumPuzzles } = await supabase
    .from("puzzles")
    .select("id, difficulty_score")
    .gte("difficulty_score", 3.5)
    .lte("difficulty_score", 6.0)
    .order("difficulty_score", { ascending: true })
    .limit(1);

  const { data: hardPuzzles } = await supabase
    .from("puzzles")
    .select("id, difficulty_score")
    .gte("difficulty_score", 6.0)
    .order("difficulty_score", { ascending: true })
    .limit(1);

  const toInsert = [];

  if (easyPuzzles?.[0]) {
    toInsert.push({
      user_id: userId,
      assignment_date: today,
      puzzle_id: easyPuzzles[0].id,
      slot_type: "warmup",
      planned_difficulty: easyPuzzles[0].difficulty_score,
      effective_difficulty: easyPuzzles[0].difficulty_score,
      status: "assigned",
    });
  }

  if (mediumPuzzles?.[0]) {
    toInsert.push({
      user_id: userId,
      assignment_date: today,
      puzzle_id: mediumPuzzles[0].id,
      slot_type: "timed",
      planned_difficulty: mediumPuzzles[0].difficulty_score,
      effective_difficulty: mediumPuzzles[0].difficulty_score,
      status: "assigned",
    });
  }

  if (hardPuzzles?.[0]) {
    toInsert.push({
      user_id: userId,
      assignment_date: today,
      puzzle_id: hardPuzzles[0].id,
      slot_type: "challenge",
      planned_difficulty: hardPuzzles[0].difficulty_score,
      effective_difficulty: hardPuzzles[0].difficulty_score,
      status: "assigned",
    });
  }

  if (toInsert.length === 0) return;

  await supabase.from("daily_assignments").insert(toInsert);
}