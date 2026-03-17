import Link from "next/link";

type PuzzleCardProps = {
  id: string;
  title: string;
  type: "Sudoku" | "Kakuro";
  difficulty: "Easy" | "Medium" | "Hard";
  status: "Not Started" | "In Progress" | "Completed";
  slotType?: string;
};

const statusConfig = {
  "Completed": {
    label: "Completed",
    className: "tag-accent",
  },
  "In Progress": {
    label: "In Progress",
    className: "tag-warn",
  },
  "Not Started": {
    label: "Not Started",
    className: "tag-muted",
  },
};

const difficultyConfig = {
  "Easy":   { color: "var(--accent)" },
  "Medium": { color: "var(--warn)" },
  "Hard":   { color: "var(--danger)" },
};

export function PuzzleCard({
  id,
  title,
  type,
  difficulty,
  status,
  slotType,
}: PuzzleCardProps) {
  const statusCfg = statusConfig[status];
  const diffCfg = difficultyConfig[difficulty];
  const isCompleted = status === "Completed";

  return (
    <div
      className="puzzle-card"
      style={isCompleted ? {
        borderColor: "rgba(168,255,87,0.35)",
        background: "linear-gradient(135deg, #111114, rgba(168,255,87,0.02))"
      } : {}}
    >
      {/* Top row: tags + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span className="tag tag-muted">{type}</span>
          {slotType && (
            <span className="tag tag-muted" style={{ color: "var(--text-tertiary)" }}>
              {slotType}
            </span>
          )}
        </div>
        <span className={`tag ${statusCfg.className}`}>{statusCfg.label}</span>
      </div>

      {/* Middle: title + meta */}
      <div>
        <div
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "17px",
            fontWeight: 500,
            color: "var(--text-primary)",
            marginBottom: "4px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--text-tertiary)",
            display: "flex",
            gap: "12px",
          }}
        >
          <span style={{ color: diffCfg.color }}>{difficulty}</span>
          <span>·</span>
          <span>{slotType} slot</span>
        </div>
      </div>

      {/* Bottom: progress bar + action */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div className="progress-track" style={{ flex: 1 }}>
          <div
            className="progress-fill"
            style={{
              width: isCompleted ? "100%" : status === "In Progress" ? "50%" : "0%",
              background: isCompleted ? "var(--accent)" : "var(--warn)",
            }}
          />
        </div>
        <Link
          href={`/play?puzzle=${id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-ui)",
            fontSize: "12px",
            fontWeight: 500,
            height: "32px",
            padding: "0 14px",
            borderRadius: "var(--r-md)",
            border: isCompleted
              ? "1px solid var(--border-accent)"
              : "1px solid var(--border-muted)",
            color: isCompleted ? "var(--accent)" : "var(--text-primary)",
            background: isCompleted ? "var(--accent-dim)" : "transparent",
            textDecoration: "none",
            whiteSpace: "nowrap",
            transition: "all 90ms ease",
          }}
        >
          {isCompleted ? "Review" : status === "In Progress" ? "Continue" : "Start"}
        </Link>
      </div>
    </div>
  );
}