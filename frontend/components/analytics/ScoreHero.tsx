import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

function getScoreColors(score: number) {
  if (score >= 70) return { text: "text-success", glow: "rgba(34, 197, 94, 0.4)", bg: "bg-success/10 border-success/30", badgeText: "text-success" };
  if (score >= 50) return { text: "text-warning", glow: "rgba(234, 179, 8, 0.4)", bg: "bg-warning/10 border-warning/30", badgeText: "text-warning" };
  return { text: "text-danger", glow: "rgba(239, 68, 68, 0.4)", bg: "bg-danger/10 border-danger/30", badgeText: "text-danger" };
}

export function ScoreHero({ score, correct, total, timeSpent }: ScoreHeroProps) {
  const passed = score >= 70;
  const colors = getScoreColors(score);

  return (
    <div className="text-center py-12 relative">
      {/* Background Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-50"
        style={{ backgroundColor: colors.glow }}
      />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className={cn(
          "text-8xl md:text-9xl font-bold font-mono tabular-nums leading-none tracking-tighter relative z-10",
          colors.text
        )}
        style={{ textShadow: `0 0 40px ${colors.glow}` }}
      >
        {score.toFixed(0)}
        <span className="text-4xl md:text-5xl ml-1 text-primary/50">%</span>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 flex flex-col items-center gap-3 relative z-10"
      >
        <p className="text-xl text-primary font-medium tracking-tight">
          {correct} <span className="text-muted">/</span> {total} correct
        </p>

        <p className="text-sm text-secondary font-mono bg-surface border border-border/50 px-3 py-1 rounded-md">
          {formatTime(timeSpent)}
        </p>

        <span
          className={cn(
            "inline-block mt-4 px-6 py-2 rounded-full text-base font-bold tracking-widest uppercase border",
            colors.bg,
            colors.badgeText
          )}
        >
          {passed ? "PASS" : "FAIL"}
        </span>
      </motion.div>
    </div>
  );
}
