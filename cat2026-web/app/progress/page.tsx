import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = new Date().toLocaleDateString("en-CA");

  // ── All attempts ───────────────────────────────────────────────────────────
  const { data: allAttempts } = await supabase
    .from("attempts")
    .select("elapsed_seconds, mistakes_count, completed_at, puzzle_id")
    .eq("user_id", user.id)
    .eq("success", true)
    .order("completed_at", { ascending: false });

  // ── Puzzle type breakdown ──────────────────────────────────────────────────
  const { data: puzzleTypes } = await supabase
    .from("puzzles")
    .select("id, puzzle_type");

  const typeMap = new Map<string, string>();
  puzzleTypes?.forEach((p) => typeMap.set(p.id, p.puzzle_type));

  const sudokuAttempts = allAttempts?.filter(
    (a) => typeMap.get(a.puzzle_id) === "sudoku"
  ) ?? [];
  const kakuroAttempts = allAttempts?.filter(
    (a) => typeMap.get(a.puzzle_id) === "kakuro"
  ) ?? [];

  function avgTime(attempts: typeof allAttempts) {
    if (!attempts || attempts.length === 0) return "—";
    const avg = attempts.reduce((s, a) => s + (a.elapsed_seconds ?? 0), 0) / attempts.length;
    const m = Math.floor(avg / 60).toString().padStart(2, "0");
    const s = Math.floor(avg % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function avgMistakes(attempts: typeof allAttempts) {
    if (!attempts || attempts.length === 0) return "—";
    const avg = attempts.reduce((s, a) => s + (a.mistakes_count ?? 0), 0) / attempts.length;
    return avg.toFixed(1);
  }

  // ── Daily stats for streak + calendar ─────────────────────────────────────
  const { data: dailyStats } = await supabase
    .from("daily_stats")
    .select("stat_date, completed_count, assigned_count, total_seconds, avg_accuracy")
    .eq("user_id", user.id)
    .order("stat_date", { ascending: false })
    .limit(30);

  // Also check daily_assignments directly for days that have completions
  // but no daily_stats row yet (e.g. before actions.ts was updated)
  const { data: recentAssignments } = await supabase
    .from("daily_assignments")
    .select("assignment_date, status")
    .eq("user_id", user.id)
    .gte("assignment_date", (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toLocaleDateString("en-CA");
    })())
    .order("assignment_date", { ascending: false });

  // Build a map of date → { assigned, completed } from assignments directly
  const assignmentMap = new Map<string, { assigned: number; completed: number }>();
  recentAssignments?.forEach((a) => {
    const cur = assignmentMap.get(a.assignment_date) ?? { assigned: 0, completed: 0 };
    cur.assigned++;
    if (a.status === "completed") cur.completed++;
    assignmentMap.set(a.assignment_date, cur);
  });

  // ── Streak calculation ─────────────────────────────────────────────────────
  let currentStreak = 0;
  let bestStreak = 0;
  let run = 0;

  // Walk backwards from today
  const cursor = new Date(today);
  for (let i = 0; i < 30; i++) {
    const ds = cursor.toISOString().slice(0, 10);
    const dayData = assignmentMap.get(ds);
    const didComplete = dayData && dayData.completed > 0;
    if (didComplete) {
      if (i === 0 || currentStreak > 0) currentStreak++;
    } else if (i > 0) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  // Best streak from all assignments
  const sortedDates = Array.from(assignmentMap.entries())
    .sort(([a], [b]) => a.localeCompare(b));
  for (const [, data] of sortedDates) {
    if (data.completed > 0) {
      run++;
      if (run > bestStreak) bestStreak = run;
    } else {
      run = 0;
    }
  }

  // ── Readiness score ────────────────────────────────────────────────────────
  const last7 = sortedDates.slice(-7);
  const consistency = last7.length > 0
    ? Math.round((last7.filter(([, d]) => d.completed > 0).length / 7) * 100)
    : 0;

  const recentAttempts = allAttempts?.slice(0, 20) ?? [];
  const totalMistakes = recentAttempts.reduce((s, a) => s + (a.mistakes_count ?? 0), 0);
  const accuracy = recentAttempts.length > 0
    ? Math.max(0, Math.round(100 - (totalMistakes / recentAttempts.length) * 10))
    : 0;

  const avgElapsed = recentAttempts.length > 0
    ? recentAttempts.reduce((s, a) => s + (a.elapsed_seconds ?? 0), 0) / recentAttempts.length
    : 0;
  const targetSeconds = 600; // 10 min target for foundation
  const speed = Math.min(100, Math.round((targetSeconds / Math.max(avgElapsed, 1)) * 100));

  const diffTolerance = Math.min(100, Math.round((allAttempts?.length ?? 0) * 5));

  const readiness = Math.round(
    0.35 * consistency +
    0.30 * accuracy +
    0.20 * speed +
    0.15 * diffTolerance
  );

  // ── 14-day calendar ────────────────────────────────────────────────────────
  const calDays: { date: string; state: "complete" | "partial" | "missed" | "future" | "empty" }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const data = assignmentMap.get(ds);
    if (!data) {
      calDays.push({ date: ds, state: i === 0 ? "empty" : "empty" });
    } else if (data.completed === data.assigned && data.assigned > 0) {
      calDays.push({ date: ds, state: "complete" });
    } else if (data.completed > 0) {
      calDays.push({ date: ds, state: "partial" });
    } else {
      calDays.push({ date: ds, state: "missed" });
    }
  }

  const totalSolved = allAttempts?.length ?? 0;

  return (
    <main style={{ minHeight: "100vh", padding: "40px 24px" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>

        {/* Page header */}
        <div style={{ marginBottom: "32px" }}>
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
            Progress
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
            Training Overview
          </h1>
        </div>

        {/* ── Top stat cards ─────────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "8px",
            marginBottom: "24px",
          }}
        >
          {[
            { val: String(currentStreak), lbl: "Streak", accent: true },
            { val: String(bestStreak), lbl: "Best streak", accent: false },
            { val: String(totalSolved), lbl: "Total solved", accent: false },
            { val: `${accuracy}%`, lbl: "Avg accuracy", accent: accuracy >= 80 },
          ].map(({ val, lbl, accent }) => (
            <div
              key={lbl}
              style={{
                background: "var(--bg-float)",
                border: "1px solid var(--border-faint)",
                borderRadius: "var(--r-lg)",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "28px",
                  fontWeight: 300,
                  letterSpacing: "-1px",
                  color: accent ? "var(--accent)" : "var(--text-primary)",
                }}
              >
                {val}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  letterSpacing: "0.7px",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                }}
              >
                {lbl}
              </div>
            </div>
          ))}
        </div>

        {/* ── Readiness score ────────────────────────────────────────────── */}
        <div
          style={{
            background: "var(--bg-float)",
            border: "1px solid var(--border-faint)",
            borderRadius: "var(--r-xl)",
            padding: "24px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "28px",
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                marginBottom: "4px",
              }}
            >
              Readiness
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "52px",
                fontWeight: 300,
                letterSpacing: "-3px",
                color: "var(--accent)",
                lineHeight: 1,
              }}
            >
              {readiness}
            </div>
          </div>

          <div style={{ width: "1px", height: "56px", background: "var(--border-faint)", flexShrink: 0 }} />

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { label: "Consistency", val: consistency },
              { label: "Accuracy", val: accuracy },
              { label: "Speed", val: speed },
              { label: "Diff. tolerance", val: diffTolerance },
            ].map(({ label, val }) => (
              <div
                key={label}
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    color: "var(--text-tertiary)",
                    minWidth: "100px",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: "3px",
                    background: "var(--border-faint)",
                    borderRadius: "99px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, val)}%`,
                      background: "var(--accent)",
                      borderRadius: "99px",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-tertiary)",
                    minWidth: "28px",
                    textAlign: "right",
                  }}
                >
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 14-day calendar ────────────────────────────────────────────── */}
        <div
          style={{
            background: "var(--bg-float)",
            border: "1px solid var(--border-faint)",
            borderRadius: "var(--r-xl)",
            padding: "20px 24px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              marginBottom: "14px",
            }}
          >
            Last 14 days
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(14, 1fr)",
              gap: "4px",
              marginBottom: "10px",
            }}
          >
            {calDays.map(({ date, state }) => {
              const bg =
                state === "complete" ? "var(--accent)" :
                state === "partial"  ? "var(--warn)" :
                state === "missed"   ? "rgba(255,87,87,0.2)" :
                "var(--bg-overlay)";
              const border =
                state === "complete" ? "var(--accent)" :
                state === "partial"  ? "var(--warn)" :
                state === "missed"   ? "rgba(255,87,87,0.25)" :
                "var(--border-faint)";
              const isToday = date === today;
              return (
                <div
                  key={date}
                  title={date}
                  style={{
                    aspectRatio: "1",
                    borderRadius: "3px",
                    background: bg,
                    border: `1px solid ${border}`,
                    boxShadow: isToday ? "0 0 0 2px rgba(255,255,255,0.18)" : undefined,
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            {[
              { color: "var(--accent)", label: "Complete" },
              { color: "var(--warn)", label: "Partial" },
              { color: "rgba(255,87,87,0.3)", label: "Missed" },
            ].map(({ color, label }) => (
              <div
                key={label}
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "2px",
                    background: color,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Per-type breakdown ─────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {[
            { name: "Sudoku", attempts: sudokuAttempts },
            { name: "Kakuro", attempts: kakuroAttempts },
          ].map(({ name, attempts }) => (
            <div
              key={name}
              style={{
                background: "var(--bg-float)",
                border: "1px solid var(--border-faint)",
                borderRadius: "var(--r-xl)",
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                  }}
                >
                  {name}
                </div>
                <span className="tag tag-muted">
                  {attempts.length} solved
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "10px",
                }}
              >
                {[
                  { val: avgTime(attempts), lbl: "Avg time" },
                  { val: avgMistakes(attempts), lbl: "Avg errors" },
                ].map(({ val, lbl }) => (
                  <div key={lbl}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "18px",
                        fontWeight: 300,
                        letterSpacing: "-0.5px",
                        color: val === "—" ? "var(--text-tertiary)" : "var(--text-primary)",
                      }}
                    >
                      {val}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "8px",
                        letterSpacing: "0.6px",
                        textTransform: "uppercase",
                        color: "var(--text-tertiary)",
                        marginTop: "2px",
                      }}
                    >
                      {lbl}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}