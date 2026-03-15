import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type ArchiveRow = {
  id: string;
  assignment_date: string;
  status: "assigned" | "in_progress" | "completed" | "skipped" | "expired";
  puzzles:
    | {
        puzzle_type: "sudoku" | "kakuro";
      }
    | {
        puzzle_type: "sudoku" | "kakuro";
      }[]
    | null;
};

export default async function ArchivePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: assignments } = await supabase
    .from("daily_assignments")
    .select(`
      id,
      assignment_date,
      status,
      puzzles (
        puzzle_type
      )
    `)
    .eq("user_id", user.id)
    .order("assignment_date", { ascending: false })
    .limit(20);

  const rows =
    assignments?.map((assignment) => {
      const puzzle = Array.isArray(assignment.puzzles)
        ? assignment.puzzles[0]
        : assignment.puzzles;

      return {
        id: assignment.id,
        date: assignment.assignment_date,
        title: puzzle?.puzzle_type === "kakuro" ? "Kakuro" : "Sudoku",
        status:
          assignment.status === "completed"
            ? "Completed"
            : assignment.status === "in_progress"
            ? "In Progress"
            : assignment.status === "skipped"
            ? "Skipped"
            : "Assigned",
      };
    }) ?? [];

  return (
    <main className="min-h-screen bg-black text-green-400 p-6">
      <div className="mx-auto max-w-5xl border border-green-500 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-green-500 mb-4">
          Archive
        </p>

        <h1 className="text-3xl font-bold mb-6">Past Practice Days</h1>

        <div className="space-y-4">
          {rows.length > 0 ? (
            rows.map((day) => (
              <div
                key={day.id}
                className="border border-green-700 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-green-300">{day.date}</p>
                  <p className="text-xs uppercase text-green-500 mt-1">
                    {day.title}
                  </p>
                </div>

                <p
                  className={`text-xs uppercase ${
                    day.status === "Completed"
                      ? "text-green-400"
                      : day.status === "In Progress"
                      ? "text-yellow-400"
                      : day.status === "Skipped"
                      ? "text-red-400"
                      : "text-green-500"
                  }`}
                >
                  {day.status}
                </p>
              </div>
            ))
          ) : (
            <div className="border border-green-700 p-4 text-sm text-green-300">
              No archive items yet.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}