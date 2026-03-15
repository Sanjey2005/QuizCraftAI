"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Trophy, Clock, Users, TrendingUp, Loader2, ArrowLeft, Medal } from "lucide-react";
import { api } from "@/lib/api";
import { TopicBreakdownChart } from "@/components/analytics/TopicBreakdownChart";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { cn } from "@/lib/utils";

interface QuizAnalytics {
  quiz_id: string; quiz_title: string; total_attempts: number;
  avg_score: number | null; best_score: number | null; worst_score: number | null;
  avg_time_seconds: number | null;
  topic_breakdown: Record<string, { correct: number; total: number; accuracy: number }>;
}

interface LeaderboardEntry { rank: number; username: string; display_name: string; score: number; time_spent_seconds: number; completed_at: string; }
interface LeaderboardData { quiz_id: string; quiz_title: string; leaderboard: LeaderboardEntry[]; }

const fmt = (s: number | null) => { if (!s) return "—"; return `${Math.floor(s/60)}m ${Math.round(s%60)}s`; };

export default function QuizAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<"overview" | "leaderboard">("overview");

  const { data, isLoading, isError } = useQuery<QuizAnalytics>({
    queryKey: ["quiz-analytics", id],
    queryFn: () => api.get<QuizAnalytics>(`/api/analytics/quiz/${id}`).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const { data: lbData, isLoading: lbLoading } = useQuery<LeaderboardData>({
    queryKey: ["leaderboard", id],
    queryFn: () => api.get<LeaderboardData>(`/api/analytics/quiz/${id}/leaderboard`).then((r) => r.data),
    staleTime: 60_000,
    enabled: tab === "leaderboard",
  });

  const PODIUM = [
    { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
    { bg: "bg-white/5", border: "border-white/10", text: "text-white/60" },
    { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-900)" }}>
      <PageWrapper>
        <Link href="/dashboard/instructor" className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {isLoading && <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>}
        {isError && <div className="text-center py-24"><p className="text-rose-400 mb-4">Could not load analytics.</p><Link href="/dashboard/instructor" className="text-sm text-blue-400 underline">Back</Link></div>}

        {data && (
          <>
            <div className="mb-6">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-1">Quiz Analytics</p>
              <h1 className="text-2xl font-bold text-white">{data.quiz_title}</h1>
            </div>

            <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: "var(--surface-700)" }}>
              {[{ id: "overview", label: "Overview" }, { id: "leaderboard", label: "Leaderboard" }].map(({ id: tid, label }) => (
                <button key={tid} onClick={() => setTab(tid as "overview" | "leaderboard")}
                  className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", tab === tid ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60")}>
                  {label}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Attempts", value: String(data.total_attempts), icon: Users },
                    { label: "Average Score", value: data.avg_score != null ? `${Math.round(data.avg_score)}%` : "—", icon: TrendingUp },
                    { label: "Top Score", value: data.best_score != null ? `${Math.round(data.best_score)}%` : "—", icon: Trophy },
                    { label: "Avg Time", value: fmt(data.avg_time_seconds), icon: Clock },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-2xl p-5 gradient-border" style={{ background: "var(--surface-800)" }}>
                      <Icon className="w-4 h-4 text-white/30 mb-3" />
                      <p className="text-2xl font-black text-white tracking-tight">{value}</p>
                      <p className="text-xs text-white/35 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                {data.topic_breakdown && Object.keys(data.topic_breakdown).length > 0 && (
                  <div className="rounded-2xl p-6" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <h2 className="font-bold text-white mb-4">Topic Breakdown</h2>
                    <TopicBreakdownChart topicBreakdown={data.topic_breakdown} />
                  </div>
                )}
                {data.total_attempts === 0 && (
                  <div className="rounded-2xl p-12 text-center" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-white/30 text-sm">No attempts yet — share the quiz to see analytics.</p>
                  </div>
                )}
              </div>
            )}

            {tab === "leaderboard" && (
              lbLoading ? <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div> :
              !lbData?.leaderboard?.length ? (
                <div className="rounded-2xl p-16 text-center" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Medal className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/40 font-medium">No attempts yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={cn("grid gap-4", lbData.leaderboard.length === 1 ? "grid-cols-1 max-w-xs" : lbData.leaderboard.length === 2 ? "grid-cols-2 max-w-lg" : "grid-cols-3 max-w-2xl")}>
                    {lbData.leaderboard.slice(0, 3).map((e) => {
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
                  {lbData.leaderboard.length > 3 && (
                    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <span className="text-sm font-semibold text-white/60">Other Rankings</span>
                      </div>
                      {lbData.leaderboard.slice(3).map((e) => (
                        <div key={e.rank} className="flex items-center gap-4 px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-white/5 text-white/40 text-sm font-bold">{e.rank}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm truncate">{e.display_name}</p>
                            <p className="text-xs text-white/30">@{e.username}</p>
                          </div>
                          <p className="text-xs text-white/25 flex items-center gap-1"><Clock className="w-3 h-3" />{fmt(e.time_spent_seconds)}</p>
                          <p className="w-14 text-right font-mono font-bold text-sm text-blue-400">{Math.round(e.score)}%</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </>
        )}
      </PageWrapper>
    </div>
  );
}
