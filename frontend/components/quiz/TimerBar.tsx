"use client";

import { useEffect, useRef, useState } from "react";

interface TimerBarProps {
  totalSeconds: number;
  onExpire: () => void;
}

export function TimerBar({ totalSeconds, onExpire }: TimerBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(100);
  const startRef = useRef<number>(Date.now());
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    startRef.current = Date.now();
    setPct(100);

    const bar = barRef.current;
    if (!bar) return;

    // Force initial state, then trigger transition
    bar.style.transition = "none";
    bar.style.width = "100%";
    void bar.offsetWidth; // force reflow
    bar.style.transition = `width ${totalSeconds}s linear`;
    bar.style.width = "0%";

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const remaining = Math.max(
        0,
        ((totalSeconds - elapsed) / totalSeconds) * 100
      );
      setPct(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpireRef.current();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [totalSeconds]);

  const color =
    pct > 50
      ? "#FFFFFF" // primary accent (white in dark theme)
      : pct > 15
        ? "#EAB308" // warning
        : "#EF4444"; // danger

  return (
    <div
      className="w-full bg-surface-2 border border-white/5 rounded-full overflow-hidden"
      style={{ height: 6 }}
    >
      <div
        ref={barRef}
        className="h-full rounded-full shadow-[0_0_10px_currentColor] transition-colors duration-1000"
        style={{ backgroundColor: color, color: color }}
      />
    </div>
  );
}
