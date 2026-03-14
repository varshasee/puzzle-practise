import { archiveDays } from "@/lib/mock-data";

export default function ArchivePage() {
  return (
    <main className="min-h-screen bg-black text-green-400 p-6">
      <div className="mx-auto max-w-5xl border border-green-500 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-green-500 mb-4">
          Archive
        </p>

        <h1 className="text-3xl font-bold mb-6">Past Practice Days</h1>

        <div className="space-y-4">
          {archiveDays.map((day) => (
            <div
              key={day.date}
              className="border border-green-700 p-4 flex items-center justify-between"
            >
              <p className="text-sm text-green-300">{day.date}</p>
              <p
  className={`text-xs uppercase ${
    day.status === "Completed"
      ? "text-green-400"
      : day.status === "In Progress"
      ? "text-yellow-400"
      : "text-red-400"
  }`}
>
  {day.status}
</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}