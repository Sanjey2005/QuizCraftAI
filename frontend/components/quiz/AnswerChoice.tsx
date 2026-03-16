"use client";

import { cn } from "@/lib/utils";

interface AnswerChoiceProps {
  label: string;
  text: string;
  selected: boolean;
  correct?: boolean;
  incorrect?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function AnswerChoice({
  label,
  text,
  selected,
  correct,
  incorrect,
  disabled,
  onClick,
}: AnswerChoiceProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !disabled) {
      e.preventDefault();
      onClick();
    }
  };

  const isDefault = !selected && !correct && !incorrect;

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      onClick={() => !disabled && onClick()}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex items-center gap-4 w-full min-h-[64px] px-5 py-4 rounded-xl border cursor-pointer transition-all duration-200 text-left select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
        isDefault &&
          "bg-surface-2 border-white/20 hover:border-white/50 hover:bg-surface",
        selected &&
          !correct &&
          !incorrect &&
          "bg-white/10 border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.05)]",
        correct && "bg-success/10 border-success/40",
        incorrect && "bg-danger/10 border-danger/40",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
    >
      <span
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors border",
          isDefault && "bg-background border-white/20 text-white/80 group-hover:text-white group-hover:border-white/50",
          selected && !correct && !incorrect && "bg-white text-black border-transparent",
          correct && "bg-success text-white border-transparent",
          incorrect && "bg-danger text-white border-transparent"
        )}
      >
        {label}
      </span>
      <span className={cn(
        "text-base flex-1 leading-relaxed transition-colors",
        (selected || correct || incorrect) ? "text-white font-medium" : "text-primary/90 group-hover:text-white"
      )}>
        {text}
      </span>
    </div>
  );
}
