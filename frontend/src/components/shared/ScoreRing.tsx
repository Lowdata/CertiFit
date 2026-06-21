import { cn, getScoreColor } from "@/lib/utils";

interface ScoreRingProps {
  score: number | null;
  label: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { ring: 56, stroke: 4, font: "text-sm" },
  md: { ring: 80, stroke: 6, font: "text-xl" },
  lg: { ring: 112, stroke: 8, font: "text-2xl" },
};

export default function ScoreRing({ score, label, size = "md", className }: ScoreRingProps) {
  const { ring, stroke, font } = sizes[size];
  const r = (ring - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score !== null ? Math.min(Math.max(score, 0), 100) : 0;
  const dash = (pct / 100) * circ;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: ring, height: ring }}>
        <svg width={ring} height={ring} className="-rotate-90">
          <circle cx={ring / 2} cy={ring / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-100" />
          <circle cx={ring / 2} cy={ring / 2} r={r} fill="none" strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            className={cn("transition-all duration-700", score !== null ? getScoreColor(score).replace("text-", "stroke-") : "stroke-slate-200")}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-semibold", font)}>{score !== null ? Math.round(score) : "—"}</span>
        </div>
      </div>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
    </div>
  );
}