import Link from "next/link";
import type {
  PuzzleType,
  PuzzleDifficulty,
  PuzzleStatus,
} from "@/lib/mock-data";

type PuzzleCardProps = {
  id: string;
  title: string;
  type: PuzzleType;
  difficulty: PuzzleDifficulty;
  status: PuzzleStatus;
};

export function PuzzleCard({
  id,
  title,
  type,
  difficulty,
  status,
}: PuzzleCardProps) {
  return (
    <div className="border border-green-700 p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-green-500 mb-2">
            {type}
          </p>
          <h2 className="text-xl font-bold mb-2">{title}</h2>

          <div className="flex flex-wrap gap-3 text-sm text-green-300">
            <span>Difficulty: {difficulty}</span>
            <span>Status: {status}</span>
          </div>
        </div>

        <Link
          href={`/play?puzzle=${id}`}
          className="inline-block border border-green-500 px-4 py-2 text-sm uppercase tracking-[0.2em] transition hover:bg-green-500 hover:text-black"
        >
          Start
        </Link>
      </div>
    </div>
  );
}