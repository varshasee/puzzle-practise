import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type ArchiveRow = {
  id: string;
  assignment_date: string;
  slot_type: string;
  status: "assigned" | "in_progress" | "completed" | "skipped" | "expired";
  effective_difficulty: number;
  puzzles:
    | { puzzle_type: "sudoku" | "kakuro" }
    | { puzzle_type: "sudoku" | "kakuro" }[]
    | null;
};

type AttemptRow = {
  puzzle_id: string;
  elapsed_seconds: number;
  mistakes_count: number;
};

export default async function ArchivePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: assignments } = await supabase
    .from("daily_assignments")
    .select(`
      id,
      assignment_date,
      slot_type,
      status,
      effective_difficulty,
      puzzles (
        puzzle_type
      )
    `)
    .eq("user_id", user.id)
    .order("assignment_date", { ascending: false })
    .limit(60);

  const { data: attempts } = await supabase
    .from("attempts")
    .select("puzzle_id, elapsed_seconds, mistakes_count")
    .eq("user_id", user.id)
    .eq("success", true);

  const attemptMap = new Map<string, AttemptRow>();
  attempts?.forEach((a) => attemptMap.set(a.puzzle_id, a));

  // Group by date
  const byDate = new Map<string, typeof rows>();
  const rows =
    (assignments as ArchiveRow[] | null)?.map((a) => {
      const puzzle = Array.isArray(a.puzzles) ? a.puzzles[0] : a.puzzles;
      const attempt = attemptMap.get(puzzle ? puzzle.puzzle_type : "");
      return {
        id: a.id,
        date: a.assignment_date,
        type: puzzle?.puzzle_type === "kakuro" ? "Kakuro" : "Sudoku",
        slot:
          a.slot_type === "warmup" ? "Warmup"
          : a.slot_type === "timed" ? "Timed"
          : a.slot_type === "challenge" ? "Challenge"
          : "Recovery",
        difficulty:
          a.effective_difficulty >= 7 ? "Hard"
          : a.effective_difficulty >= 4 ? "Medium"
          : "Easy",
        status: a.status,
        elapsed: attempt?.elapsed_seconds ?? null,
        mistakes: attempt?.mistakes_count ?? null,
      };
    }) ?? [];

  rows.forEach((r) => {
    const existing = byDate.get(r.date) ?? [];
    existing.push(r);
    byDate.set(r.date, existing);
  });

  const sortedDates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  function formatDate(ds: string) {
    const d = new Date(ds + "T00:00:00");
    const today = new Date().toLocaleDateString("en-CA");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yds = yesterday.toLocaleDateString("en-CA");
    if (ds === today) return "Today";
    if (ds === yds) return "Yesterday";
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
  }

  const statusTag = (status: string) => {
    if (status === "completed") return { label: "Completed", cls: "tag-accent" };
    if (status === "in_progress") return { label: "In Progress", cls: "tag-warn" };
    if (status === "skipped") return { label: "Skipped", cls: "tag-danger" };
    return { label: "Assigned", cls: "tag-muted" };
  };

  return (
    <main style={{ minHeight: "100vh", padding: "40px 24px" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "32px",
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
              Archive
            </div>
            <h1
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "26px",
                fontWeight: 500,
                letterSpacing: "-0.4px",
                color: "var(--text-primary)",
              }}
            >
              Past Practice
            </h1>
          </div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-tertiary)",
              marginTop: "8px",
            }}
          >
            Last {rows.length} entries
          </span>
        </div>

        {/* Days */}
        {sortedDates.length === 0 ? (
          <div
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border-faint)",
              borderRadius: "var(--r-xl)",
              padding: "40px",
              textAlign: "center",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--text-tertiary)",
            }}
          >
            No archive entries yet
          </div>
        ) : (
          sortedDates.map((date) => {
            const dayRows = byDate.get(date)!;
            return (
              <div key={date} style={{ marginBottom: "24px" }}>
                {/* Date heading */}
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: "var(--text-tertiary)",
                    paddingBottom: "10px",
                    borderBottom: "1px solid var(--border-faint)",
                    marginBottom: "8px",
                  }}
                >
                  {formatDate(date)}
                </div>

                {/* Rows for this day */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {dayRows.map((row) => {
                    const tag = statusTag(row.status);
                    return (
                      <div
                        key={row.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 16px",
                          background: "var(--bg-raised)",
                          border: "1px solid var(--border-faint)",
                          borderRadius: "var(--r-lg)",
                          transition: "border-color 90ms ease",
                        }}
                      >
                        {/* Type + slot */}
                        <div style={{ display: "flex", gap: "5px", minWidth: "130px" }}>
                          <span className="tag tag-muted">{row.type}</span>
                          <span className="tag tag-muted" style={{ color: "var(--text-tertiary)" }}>
                            {row.slot}
                          </span>
                        </div>

                        {/* Difficulty */}
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            color: "var(--text-tertiary)",
                            minWidth: "48px",
                          }}
                        >
                          {row.difficulty}
                        </div>

                        {/* Mistakes */}
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            color: row.mistakes === 0 ? "var(--accent)"
                              : row.mistakes !== null ? "var(--warn)"
                              : "var(--text-tertiary)",
                            minWidth: "64px",
                            textAlign: "center",
                          }}
                        >
                          {row.mistakes !== null ? `${row.mistakes} err` : "—"}
                        </div>

                        {/* Time */}
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                            minWidth: "48px",
                            textAlign: "right",
                            marginLeft: "auto",
                          }}
                        >
                          {row.elapsed !== null ? formatTime(row.elapsed) : "—"}
                        </div>

                        {/* Status */}
                        <span className={`tag ${tag.cls}`}>{tag.label}</span>

                        {/* Play again link */}
                        {row.status !== "completed" && (
                          <Link
                            href={`/play?puzzle=${row.id}`}
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "9px",
                              letterSpacing: "0.8px",
                              textTransform: "uppercase",
                              color: "var(--text-tertiary)",
                              textDecoration: "none",
                              padding: "3px 8px",
                              border: "1px solid var(--border-faint)",
                              borderRadius: "var(--r-sm)",
                              whiteSpace: "nowrap",
                              transition: "color 90ms, border-color 90ms",
                            }}
                          >
                            Start
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}