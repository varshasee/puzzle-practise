import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { markAssignmentInProgress, submitAttempt } from "./actions";
import { PlayGrid } from "@/components/play-grid";

type PlayPageProps = {
  searchParams: Promise<{
    puzzle?: string;
  }>;
};

type AssignmentRow = {
  id: string;
  status: string;
  puzzle_id: string;
};

type PuzzleRow = {
  id: string;
  puzzle_type: "sudoku" | "kakuro";
  difficulty_band: string;
  grid_payload: {
    grid: string[][];
  };
  solution_payload: {
    grid: string[][];
  };
};

export const dynamic = "force-dynamic";

export default async function PlayPage({ searchParams }: PlayPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const assignmentId = params.puzzle;

  if (!assignmentId) {
    redirect("/today");
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("daily_assignments")
    .select("id, status, puzzle_id")
    .eq("id", assignmentId)
    .eq("user_id", user.id)
    .maybeSingle<AssignmentRow>();

  if (assignmentError || !assignment) {
    return (
      <main className="min-h-screen bg-black p-6 text-green-400">
        <div className="mx-auto max-w-4xl border border-green-500 p-6">
          <p className="mb-4 text-sm text-green-300">Assignment not found.</p>
          <pre className="mb-4 whitespace-pre-wrap border border-green-700 p-4 text-xs text-green-300">
            {JSON.stringify(
              {
                assignmentId,
                userId: user.id,
                assignmentError,
                assignment,
              },
              null,
              2
            )}
          </pre>
          <Link href="/today" className="inline-block text-green-500">
            Back to Today
          </Link>
        </div>
      </main>
    );
  }

  await markAssignmentInProgress(assignment.id);

  const { data: puzzle, error: puzzleError } = await supabase
    .from("puzzles")
    .select("id, puzzle_type, difficulty_band, grid_payload, solution_payload")
    .eq("id", assignment.puzzle_id)
    .maybeSingle<PuzzleRow>();

  if (puzzleError || !puzzle) {
    return (
      <main className="min-h-screen bg-black p-6 text-green-400">
        <div className="mx-auto max-w-4xl border border-green-500 p-6">
          <p className="mb-4 text-sm text-green-300">Puzzle not found.</p>
          <pre className="mb-4 whitespace-pre-wrap border border-green-700 p-4 text-xs text-green-300">
            {JSON.stringify(
              {
                assignmentId,
                puzzleId: assignment.puzzle_id,
                puzzleError,
                puzzle,
              },
              null,
              2
            )}
          </pre>
          <Link href="/today" className="inline-block text-green-500">
            Back to Today
          </Link>
        </div>
      </main>
    );
  }

  const isKakuro = puzzle.puzzle_type === "kakuro";
  const grid = puzzle.grid_payload?.grid ?? [];

  return (
    <main className="min-h-screen bg-black p-6 text-green-400">
      <div className="mx-auto max-w-5xl border border-green-500 p-6">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/today"
              className="text-xs uppercase tracking-[0.3em] text-green-500 hover:text-green-300"
            >
              Back to Today
            </Link>

            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-green-500">
              Play
            </p>

            <h1 className="text-3xl font-bold">
              {isKakuro ? "Kakuro Practice" : "Sudoku Practice"}
            </h1>

            <p className="mt-2 text-sm text-green-300">
              Assignment: {assignment.id}
            </p>
            <p className="mt-1 text-sm text-green-300">
              Difficulty: {puzzle.difficulty_band}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="border border-green-700 px-4 py-2 text-xs uppercase"
            >
              Pause
            </button>

            <button
              type="button"
              className="border border-green-700 px-4 py-2 text-xs uppercase"
            >
              Reset
            </button>

            <form
              action={async () => {
                "use server";
                await submitAttempt({
                  assignmentId: assignment.id,
                  puzzleId: puzzle.id,
                });
              }}
            >
              <button
                type="submit"
                className="border border-green-500 px-4 py-2 text-xs uppercase hover:bg-green-500 hover:text-black"
              >
                Submit
              </button>
            </form>
          </div>
        </div>

        <PlayGrid
  type={isKakuro ? "kakuro" : "sudoku"}
  initialGrid={grid}
  solutionGrid={puzzle.solution_payload?.grid ?? []}
  assignmentId={assignment.id}
  puzzleId={puzzle.id}
/>
      </div>
    </main>
  );
}