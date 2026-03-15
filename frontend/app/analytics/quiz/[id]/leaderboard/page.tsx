"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Trophy, Clock, ArrowLeft, Loader2, Medal } from "lucide-react";
import { api } from "@/lib/api";

interface LeaderboardEntry {
  rank: number;
  username: string;
  display_name: string;
  score: number;
  time_spent_seconds: number;
  completed_at: string;
}

interface LeaderboardData {
  quiz_id: string;
  quiz_title: string;
  leaderboard: LeaderboardEntry[];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

const PODIUM = [
  {
    bg: "bg-amber-50",
    border: "border-amber-300",
    ring: "ring-2 ring-amber-400/60",
    badge: "bg-amber-400 text-white",
    score: "text-amber-700",
    icon: "🥇",
    label: "gold",
  },
  {
    bg: "bg-slate-50",
    border: "border-slate-300",
    ring: "ring-2 ring-slate-400/50",
    badge: "bg-slate-400 text-white",
    score: "text-slate-700",
    icon: "🥈",
    label: "silver",
  },
  {
    bg: "bg-orange-50",
    border: "border-orange-300",
    ring: "ring-2 ring-orange-400/50",
    badge: "bg-orange-400 text-white",
    score: "text-orange-700",
    icon: "🥉",
    label: "bronze",
  },
];

function PodiumCard({ entry }: { entry: LeaderboardEntry }) {
  const style = PODIUM[entry.rank - 1];
  return (
    <div
      className={`flex flex-col items-center p-5 rounded-2xl border ${style.bg} ${style.border} ${style.ring} transition-shadow hover:shadow-lg`}
    >
      <span className="text-3xl mb-2">{style.icon}</span>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2 ${style.badge}`}
      >
        {entry.rank}
      </div>
      <p className="font-semibold text-slate-900 text-sm text-center leading-tight">
        {entry.display_name}
      </p>
      <p className="text-xs text-slate-500 mb-3">@{entry.username}</p>
      <p className={`text-2xl font-bold font-mono tabular-nums ${style.score}`}>
        {entry.score}
        <span className="text-base font-semibold">%</span>
      </p>
      <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
        <Clock className="w-3 h-3" />
        {formatTime(entry.time_spent_seconds)}
      </div>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
      <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 text-sm font-bold">
        {entry.rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 text-sm truncate">
          {entry.display_name}
        </p>
        <p className="text-xs text-slate-400">@{entry.username}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-slate-400">
        <Clock className="w-3 h-3" />
        {formatTime(entry.time_spent_seconds)}
      </div>
      <div
        className="w-16 text-right font-mono font-bold tabular-nums text-sm"
        style={{ color: "var(--color-accent)" }}
      >
        {entry.score}%
      </div>
    </div>
  );
}

export default function LeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading, isError } = useQuery<LeaderboardData>({
    queryKey: ["leaderboard", id],
    queryFn: () =>
      api.get<LeaderboardData>(`/api/analytics/quiz/${id}/leaderboard`).then((r) => r.data),
    staleTime: 60_000,
  });

  const podium = data?.leaderboard.slice(0, 3) ?? [];
  const rest = data?.leaderboard.slice(3) ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header
        className="border-b border-slate-200 px-6 py-4"
        style={{ background: "var(--color-brand)" }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center text-white text-xs font-bold">
              Q
            </div>
            <span className="text-white font-semibold">QuizCraft AI</span>
          </div>
          <Link
            href={`/analytics/quiz/${id}`}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Analytics
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: "var(--color-accent)" }}
            />
          </div>
        )}

        {isError && (
          <div className="text-center py-24">
            <p className="text-red-600 font-medium mb-4">
              Could not load leaderboard.
            </p>
            <Link
              href="/dashboard/instructor"
              className="text-sm underline"
              style={{ color: "var(--color-accent)" }}
            >
              Back to dashboard
            </Link>
          </div>
        )}

        {data && (
          <>
            {/* Title block */}
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-3"
                style={{ background: "var(--color-accent)", color: "white", opacity: 0.9 }}
              >
                <Trophy className="w-4 h-4" />
                Leaderboard
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{data.quiz_title}</h1>
              <p className="text-slate-500 text-sm mt-1">
                Top {data.leaderboard.length} student
                {data.leaderboard.length !== 1 ? "s" : ""}
              </p>
            </div>

            {data.leaderboard.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                <Medal className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No attempts yet</p>
                <p className="text-slate-400 text-sm mt-1">
                  Students who complete this quiz will appear here.
                </p>
              </div>
            ) : (
              <>
                {/* Podium — top 3 */}
                {podium.length > 0 && (
                  <div
                    className={`grid gap-4 mb-6 ${
                      podium.length === 1
                        ? "grid-cols-1 max-w-xs mx-auto"
                        : podium.length === 2
                        ? "grid-cols-2"
                        : "grid-cols-3"
                    }`}
                  >
                    {podium.map((entry) => (
                      <PodiumCard key={entry.rank} entry={entry} />
                    ))}
                  </div>
                )}

                {/* Ranks 4–10 */}
                {rest.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">
                        Other Rankings
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {rest.map((entry) => (
                        <LeaderboardRow key={entry.rank} entry={entry} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
