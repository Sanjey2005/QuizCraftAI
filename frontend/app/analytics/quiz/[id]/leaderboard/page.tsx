"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Clock, ArrowLeft, Loader2, Medal, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { cn } from "@/lib/utils";

interface LeaderboardEntry { rank: number; username: string; display_name: string; score: number; time_spent_seconds: number; completed_at: string; }
interface LeaderboardData { quiz_id: string; quiz_title: string; leaderboard: LeaderboardEntry[]; }

const fmt = (s: number) => { const m = Math.floor(s / 60); const sec = s % 60; return m === 0 ? `${sec}s` : `${m}m ${sec}s`; };

const PODIUM = [
  { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
  { bg: "bg-white/5", border: "border-white/10", text: "text-white/50" },
  { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400" },
];

export default function LeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError } = useQuery<LeaderboardData>({
    queryKey: ["leaderboard", id],
    queryFn: () => api.get<LeaderboardData>(`/api/analytics/quiz/${id}/leaderboard`).then((r) => r.data),
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-900)" }}>
      <PageWrapper className="max-w-2xl mx-auto">
        <Link href={`/analytics/quiz/${id}`} className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Analytics
        </Link>

        {isLoading && <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>}
        {isError && <div className="text-center py-24"><p className="text-rose-400 mb-4">Could not load leaderboard.</p><Link href="/dashboard/instructor" className="text-sm text-blue-400 underline">Back</Link></div>}

        {data && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-semibold mb-3">
                <Trophy className="w-4 h-4" /> Leaderboard
              </div>
              <h1 className="text-2xl font-bold text-white">{data.quiz_title}</h1>
              <p className="text-white/35 text-sm mt-1">Top {data.leaderboard.length} student{data.leaderboard.length !== 1 ? "s" : ""}</p>
            </div>

            {data.leaderboard.length === 0 ? (
              <div className="rounded-2xl p-16 text-center" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Medal className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40 font-medium">No attempts yet</p>
                <p className="text-white/25 text-sm mt-1">Students who complete this quiz will appear here.</p>
              </div>
            ) : (
              <>
                <div className={cn("grid gap-4 mb-6", data.leaderboard.length === 1 ? "grid-cols-1 max-w-xs mx-auto" : data.leaderboard.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
                  {data.leaderboard.slice(0, 3).map((e) => {
                    const s = PODIUM[e.rank - 1];
                    return (
                      <div key={e.rank} className={cn("flex flex-col items-center p-5 rounded-2xl border", s?.bg, s?.border)}>
                        <Medal className={cn("w-7 h-7 mb-2", s?.text)} />
                        <p className="font-bold text-white text-sm text-center">{e.display_name}</p>
                        <p className="text-xs text-white/30 mb-2">@{e.username}</p>
                        <p className={cn("text-2xl font-black font-mono", s?.text)}>{Math.round(e.score)}%</p>
                        <p className="text-xs text-white/25 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{fmt(e.time_spent_seconds)}</p>
                      </div>
                    );
                  })}
                </div>
                {data.leaderboard.length > 3 && (
                  <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span className="text-sm font-semibold text-white/50">Other Rankings</span>
                    </div>
                    {data.leaderboard.slice(3).map((e) => (
                      <div key={e.rank} className="flex items-center gap-4 px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-white/5 text-white/40 text-sm font-bold">{e.rank}</span>
                        <div className="flex-1 min-w-0"><p className="font-medium text-white text-sm truncate">{e.display_name}</p><p className="text-xs text-white/30">@{e.username}</p></div>
                        <p className="text-xs text-white/25 flex items-center gap-1"><Clock className="w-3 h-3" />{fmt(e.time_spent_seconds)}</p>
                        <p className="w-14 text-right font-mono font-bold text-sm text-blue-400">{Math.round(e.score)}%</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </PageWrapper>
    </div>
  );
}
