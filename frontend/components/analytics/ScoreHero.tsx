import { cn } from "@/lib/utils";

interface ScoreHeroProps {
  score: number;
  correct: number;
  total: number;
  timeSpent: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

export function ScoreHero({ score, correct, total, timeSpent }: ScoreHeroProps) {
  const passed = score >= 70;
  const color = getScoreColor(score);

  return (
    <div className="text-center py-8">
      <div
        className={cn(
          "text-7xl font-bold font-mono tabular-nums leading-none",
          color
        )}
      >
        {score.toFixed(1)}
        <span className="text-4xl">%</span>
      </div>

      <p className="mt-3 text-lg text-slate-600 font-medium">
        {correct} / {total} correct
      </p>

      <p className="mt-1 text-sm text-slate-400 font-mono">
        {formatTime(timeSpent)}
      </p>

      <span
        className={cn(
          "inline-block mt-4 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide",
          passed
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        )}
      >
        {passed ? "PASS" : "FAIL"}
      </span>
    </div>
  );
}
