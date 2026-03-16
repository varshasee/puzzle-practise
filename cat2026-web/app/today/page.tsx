import { PuzzleCard } from "@/components/puzzle-card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type AssignmentWithPuzzle = {
  id: string;
  status: string;
  slot_type: string;
  effective_difficulty: number;
  puzzles:
    | {
        id: string;
        puzzle_type: "sudoku" | "kakuro";
        difficulty_band: string;
      }
    | {
        id: string;
        puzzle_type: "sudoku" | "kakuro";
        difficulty_band: string;
      }[]
    | null;
};

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const today = new Date().toLocaleDateString("en-CA");

  const { data: assignments } = await supabase
    .from("daily_assignments")
    .select(`
      id,
      status,
      slot_type,
      effective_difficulty,
      puzzles (
        id,
        puzzle_type,
        difficulty_band
      )
    `)
    .eq("user_id", user.id)
    .eq("assignment_date", today)
    .order("created_at", { ascending: true });

  const cards =
    (assignments as AssignmentWithPuzzle[] | null)?.map((assignment) => {
      const puzzle = Array.isArray(assignment.puzzles)
        ? assignment.puzzles[0]
        : assignment.puzzles;

      return {
        id: assignment.id,
        title:
          puzzle?.puzzle_type === "kakuro" ? "Daily Kakuro" : "Daily Sudoku",
        type: puzzle?.puzzle_type === "kakuro" ? "Kakuro" : "Sudoku",
        slotType:
          assignment.slot_type === "warmup"
            ? "Warmup"
            : assignment.slot_type === "timed"
            ? "Timed"
            : assignment.slot_type === "challenge"
            ? "Challenge"
            : "Recovery",
        difficulty:
          assignment.effective_difficulty >= 7
            ? "Hard"
            : assignment.effective_difficulty >= 4
            ? "Medium"
            : "Easy",
        status:
          assignment.status === "in_progress"
            ? "In Progress"
            : assignment.status === "completed"
            ? "Completed"
            : "Not Started",
      };
    }) ?? [];

  return (
    <main className="min-h-screen bg-black text-green-400 p-6">
      <div className="mx-auto max-w-5xl border border-green-500 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-green-500 mb-4">
          Today
        </p>

        <div className="mb-4 border border-green-700 px-4 py-3 text-sm">
          Signed in as: {user.email}
        </div>

        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Daily Practice</h1>
            <p className="text-sm text-green-300 mt-2">
              Your CAT 2026 training set for {today}
            </p>
          </div>

          <div className="border border-green-700 px-4 py-3 text-sm">
            <p className="text-green-500 uppercase text-xs mb-1">Target</p>
            <p className="text-green-300">Warmup + Timed + Challenge</p>
          </div>
        </div>

        <div className="grid gap-4">
          {cards.length > 0 ? (
            cards.map((puzzle) => (
              <PuzzleCard
                key={puzzle.id}
                id={puzzle.id}
                title={puzzle.title}
                type={puzzle.type as "Sudoku" | "Kakuro"}
                difficulty={puzzle.difficulty as "Easy" | "Medium" | "Hard"}
                status={
                  puzzle.status as "Not Started" | "In Progress" | "Completed"
                }
                slotType={puzzle.slotType}
              />
            ))
          ) : (
            <div className="border border-green-700 p-4 text-sm text-green-300">
              No assignments found for today yet.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}