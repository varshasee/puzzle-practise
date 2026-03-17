import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { markAssignmentInProgress } from "./actions";
import { PlayGrid } from "@/components/play-grid";

type PlayPageProps = {
  searchParams: Promise<{ puzzle?: string }>;
};

type AssignmentRow = {
  id: string;
  status: string;
  puzzle_id: string;
  slot_type: string;
  effective_difficulty: number;
};

type PuzzleRow = {
  id: string;
  puzzle_type: "sudoku" | "kakuro";
  difficulty_band: string;
  difficulty_score: number;
  grid_payload: { grid: string[][] };
  solution_payload: { grid: string[][] };
};

export const dynamic = "force-dynamic";

export default async function PlayPage({ searchParams }: PlayPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const assignmentId = params.puzzle;
  if (!assignmentId) redirect("/today");

  const { data: assignment, error: assignmentError } = await supabase
    .from("daily_assignments")
    .select("id, status, puzzle_id, slot_type, effective_difficulty")
    .eq("id", assignmentId)
    .eq("user_id", user.id)
    .maybeSingle<AssignmentRow>();

  if (assignmentError || !assignment) {
    return (
      <main style={{ minHeight: "100vh", padding: "40px 24px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border-faint)",
              borderRadius: "var(--r-xl)",
              padding: "32px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--danger)",
                marginBottom: "16px",
              }}
            >
              Assignment not found
            </div>
            <Link href="/today" className="btn btn-secondary" style={{ textDecoration: "none" }}>
              ← Back to Today
            </Link>
          </div>
        </div>
      </main>
    );
  }

  await markAssignmentInProgress(assignment.id);

  const { data: puzzle, error: puzzleError } = await supabase
    .from("puzzles")
    .select("id, puzzle_type, difficulty_band, difficulty_score, grid_payload, solution_payload")
    .eq("id", assignment.puzzle_id)
    .maybeSingle<PuzzleRow>();

  if (puzzleError || !puzzle) {
    return (
      <main style={{ minHeight: "100vh", padding: "40px 24px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border-faint)",
              borderRadius: "var(--r-xl)",
              padding: "32px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--danger)",
                marginBottom: "16px",
              }}
            >
              Puzzle not found
            </div>
            <Link href="/today" className="btn btn-secondary" style={{ textDecoration: "none" }}>
              ← Back to Today
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isKakuro = puzzle.puzzle_type === "kakuro";
  const grid = puzzle.grid_payload?.grid ?? [];

  const slotLabel =
    assignment.slot_type === "warmup" ? "Warmup"
    : assignment.slot_type === "timed" ? "Timed"
    : assignment.slot_type === "challenge" ? "Challenge"
    : "Recovery";

  return (
    <main style={{ minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>

        {/* Page header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "28px",
          }}
        >
          <div>
            <Link
              href="/today"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                textDecoration: "none",
                marginBottom: "8px",
              }}
            >
              ← Today
            </Link>
            <h1
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "22px",
                fontWeight: 500,
                letterSpacing: "-0.3px",
                color: "var(--text-primary)",
                marginBottom: "4px",
              }}
            >
              {isKakuro ? "Kakuro Practice" : "Sudoku Practice"}
            </h1>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-tertiary)",
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <span className="tag tag-muted">{slotLabel}</span>
              <span>·</span>
              <span>Difficulty {puzzle.difficulty_band}</span>
            </div>
          </div>
        </div>

        {/* PlayGrid — handles timer, mistakes, HUD, submit internally */}
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