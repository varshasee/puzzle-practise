import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
      <main className="min-h-screen bg-black text-green-400 p-6">
        <div className="mx-auto max-w-4xl border border-green-500 p-6">
          <p className="text-sm text-green-300 mb-4">Assignment not found.</p>
          <pre className="text-xs whitespace-pre-wrap border border-green-700 p-4 mb-4 text-green-300">
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

  const { data: puzzle, error: puzzleError } = await supabase
    .from("puzzles")
    .select("id, puzzle_type, difficulty_band, grid_payload")
    .eq("id", assignment.puzzle_id)
    .maybeSingle<PuzzleRow>();

  if (puzzleError || !puzzle) {
    return (
      <main className="min-h-screen bg-black text-green-400 p-6">
        <div className="mx-auto max-w-4xl border border-green-500 p-6">
          <p className="text-sm text-green-300 mb-4">Puzzle not found.</p>
          <pre className="text-xs whitespace-pre-wrap border border-green-700 p-4 mb-4 text-green-300">
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
    <main className="min-h-screen bg-black text-green-400 p-6">
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
            <button className="border border-green-700 px-4 py-2 text-xs uppercase">
              Pause
            </button>
            <button className="border border-green-700 px-4 py-2 text-xs uppercase">
              Reset
            </button>
            <button className="border border-green-500 px-4 py-2 text-xs uppercase hover:bg-green-500 hover:text-black">
              Submit
            </button>
          </div>
        </div>

        {!isKakuro ? (
          <div className="grid gap-8 md:grid-cols-[1fr_220px]">
            <div className="grid grid-cols-9 border border-green-500">
              {grid.flat().map((cell, index) => (
                <div
                  key={index}
                  className="flex aspect-square items-center justify-center border border-green-900 text-lg font-semibold"
                >
                  {cell}
                </div>
              ))}
            </div>

            <div className="border border-green-700 p-4">
              <p className="mb-4 text-xs uppercase text-green-500">Controls</p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    className="border border-green-700 py-3 hover:border-green-400"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-green-700 p-4 text-sm text-green-300">
            Kakuro grid loading from Supabase works, but Kakuro rendering still
            needs its final board UI.
          </div>
        )}
      </div>
    </main>
  );
}