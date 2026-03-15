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
        "flex items-center gap-3 w-full min-h-[56px] px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150 text-left select-none",
        isDefault &&
          "bg-white border-slate-200 hover:border-[var(--color-accent)] hover:bg-blue-50",
        selected &&
          !correct &&
          !incorrect &&
          "bg-blue-50 border-[var(--color-accent)] border-2",
        correct && "bg-green-50 border-green-500 border-2",
        incorrect && "bg-red-50 border-red-500 border-2",
        disabled && "opacity-60 cursor-not-allowed pointer-events-none"
      )}
    >
      <span
        className={cn(
          "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
          isDefault && "bg-slate-100 text-slate-500",
          selected && !correct && !incorrect && "bg-[var(--color-accent)] text-white",
          correct && "bg-green-500 text-white",
          incorrect && "bg-red-500 text-white"
        )}
      >
        {label}
      </span>
      <span className="text-sm text-slate-800 flex-1 leading-relaxed">
        {text}
      </span>
    </div>
  );
}
