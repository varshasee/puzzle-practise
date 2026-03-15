"use server";

import { createClient } from "@/lib/supabase/server";

export async function markAssignmentInProgress(assignmentId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("daily_assignments")
    .update({ status: "in_progress" })
    .eq("id", assignmentId)
    .eq("user_id", user.id)
    .neq("status", "completed");

  if (error) {
    throw new Error(error.message);
  }
}

export async function submitAttempt(input: {
  assignmentId: string;
  puzzleId: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error: attemptError } = await supabase.from("attempts").insert({
    user_id: user.id,
    puzzle_id: input.puzzleId,
    elapsed_seconds: 0,
    mistakes_count: 0,
    hints_used: 0,
    completed: true,
    success: true,
    final_state: {},
  });

  if (attemptError) {
    throw new Error(attemptError.message);
  }

  const { error: assignmentError } = await supabase
    .from("daily_assignments")
    .update({ status: "completed" })
    .eq("id", input.assignmentId)
    .eq("user_id", user.id);

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }
}