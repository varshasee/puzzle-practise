import { PuzzleCard } from "@/components/puzzle-card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ensureTodayAssignments } from "@/lib/daily/daily-assignments";

export const dynamic = "force-dynamic";

type AssignmentWithPuzzle = {
  id: string;
  status: string;
  slot_type: string;
  effective_difficulty: number;
  puzzles:
    | { id: string; puzzle_type: "sudoku" | "kakuro"; difficulty_band: string }
    | { id: string; puzzle_type: "sudoku" | "kakuro"; difficulty_band: string }[]
    | null;
};

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = new Date().toLocaleDateString("en-CA");

  // Auto-create assignments if missing
  await ensureTodayAssignments(user.id);

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
    (assignments as AssignmentWithPuzzle[] | null)?.map((a) => {
      const puzzle = Array.isArray(a.puzzles) ? a.puzzles[0] : a.puzzles;
      return {
        id: a.id,
        title: puzzle?.puzzle_type === "kakuro" ? "Daily Kakuro" : "Daily Sudoku",
        type: puzzle?.puzzle_type === "kakuro" ? "Kakuro" : "Sudoku",
        slotType:
          a.slot_type === "warmup" ? "Warmup"
          : a.slot_type === "timed" ? "Timed"
          : a.slot_type === "challenge" ? "Challenge"
          : "Recovery",
        difficulty:
          a.effective_difficulty >= 7 ? "Hard"
          : a.effective_difficulty >= 4 ? "Medium"
          : "Easy",
        status:
          a.status === "in_progress" ? "In Progress"
          : a.status === "completed" ? "Completed"
          : "Not Started",
      };
    }) ?? [];

  const completedCount = cards.filter((c) => c.status === "Completed").length;
  const totalCount = cards.length;

  // Format date nicely
  const dateObj = new Date();
  const displayDate = dateObj.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>

        {/* Page header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "36px",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                marginBottom: "6px",
              }}
            >
              {displayDate}
            </div>
            <h1
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "26px",
                fontWeight: 500,
                letterSpacing: "-0.4px",
                color: "var(--text-primary)",
                marginBottom: "4px",
              }}
            >
              Daily Practice
            </h1>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-tertiary)",
              }}
            >
              {user.email} &nbsp;·&nbsp; Foundation phase
            </div>
          </div>

          {/* Completion pill */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-float)",
              border: completedCount === totalCount && totalCount > 0
                ? "1px solid var(--border-accent)"
                : "1px solid var(--border-faint)",
              borderRadius: "var(--r-lg)",
              padding: "12px 20px",
              minWidth: "80px",
              gap: "3px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "22px",
                fontWeight: 300,
                letterSpacing: "-1px",
                color: completedCount > 0 ? "var(--accent)" : "var(--text-tertiary)",
              }}
            >
              {completedCount}/{totalCount}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
              }}
            >
              Done today
            </div>
          </div>
        </div>

        {/* Puzzle cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {cards.length > 0 ? (
            cards.map((puzzle) => (
              <PuzzleCard
                key={puzzle.id}
                id={puzzle.id}
                title={puzzle.title}
                type={puzzle.type as "Sudoku" | "Kakuro"}
                difficulty={puzzle.difficulty as "Easy" | "Medium" | "Hard"}
                status={puzzle.status as "Not Started" | "In Progress" | "Completed"}
                slotType={puzzle.slotType}
              />
            ))
          ) : (
            <div
              style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border-faint)",
                borderRadius: "var(--r-xl)",
                padding: "40px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--text-tertiary)",
                  marginBottom: "8px",
                }}
              >
                No puzzles assigned yet
              </div>
              <div
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                The puzzle pool may be empty. Add puzzles to the database to get started.
              </div>
            </div>
          )}
        </div>

        {/* Target info */}
        {cards.length > 0 && (
          <div
            style={{
              marginTop: "24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
              }}
            >
              Target
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--text-tertiary)",
              }}
            >
              ·
            </span>
            <span className="tag tag-muted">Warmup</span>
            <span className="tag tag-muted">Timed</span>
            <span className="tag tag-muted">Challenge</span>
          </div>
        )}
      </div>
    </main>
  );
}