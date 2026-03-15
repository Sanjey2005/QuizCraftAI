"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopicBreakdownChart } from "@/components/analytics/TopicBreakdownChart";
import { Trophy, TrendingUp, TrendingDown, Target, BookOpen, Minus, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface ScoreTrendItem { date: string; score: number; quiz_title: string; attempt_id: string; }
interface StudentAnalytics {
  total_attempts: number; avg_score: number | null; best_score: number | null; worst_score: number | null;
  score_trend: ScoreTrendItem[];
  topic_breakdown: Record<string, { correct: number; total: number; accuracy: number }>;
  strongest_topic: string | null; weakest_topic: string | null;
}

const scoreColor = (s: number | null) => s == null ? "#2563eb" : s >= 70 ? "#10b981" : s >= 50 ? "#f59e0b" : "#f43f5e";

export default function MyAnalyticsPage() {
  const { data, isLoading, isError } = useQuery<StudentAnalytics>({
    queryKey: ["student-analytics"],
    queryFn: () => api.get<StudentAnalytics>("/api/analytics/me").then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const avg = data?.avg_score != null ? Math.round(data.avg_score) : null;
  const best = data?.best_score != null ? Math.round(data.best_score) : null;
  const worst = data?.worst_score != null ? Math.round(data.worst_score) : null;
  const trend = (() => {
    if (!data?.score_trend || data.score_trend.length < 2) return null;
    return data.score_trend[data.score_trend.length - 1].score - data.score_trend[data.score_trend.length - 2].score;
  })();

  const stats = [
    { label: "Total Attempts", value: String(data?.total_attempts ?? 0), icon: BookOpen, color: "from-blue-500 to-indigo-600", glow: "rgba(99,102,241,0.35)" },
    { label: "Average Score", value: avg != null ? `${avg}%` : "—", icon: Target, color: "from-amber-500 to-orange-500", glow: "rgba(245,158,11,0.35)" },
    { label: "Best Score", value: best != null ? `${best}%` : "—", icon: Trophy, color: "from-emerald-500 to-teal-600", glow: "rgba(16,185,129,0.35)" },
    { label: "Lowest Score", value: worst != null ? `${worst}%` : "—", icon: TrendingDown, color: "from-rose-500 to-pink-600", glow: "rgba(244,63,94,0.35)" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-900)" }}>
      <PageWrapper>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">My Analytics</h1>
          <p className="text-white/35 text-sm mt-0.5">Your personal performance breakdown</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-20">
            <Target className="w-12 h-12 text-white/15 mx-auto mb-4" />
            <p className="text-rose-400 font-semibold mb-1">Could not load analytics</p>
            <p className="text-white/35 text-sm mb-6">Please sign in and try again</p>
            <Link href="/login" className="btn-primary">Sign In <ArrowRight className="w-4 h-4" /></Link>
          </div>
        ) : !data || data.total_attempts === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-white/15 mx-auto mb-4" />
            <p className="text-white font-semibold mb-1">No attempts yet</p>
            <p className="text-white/35 text-sm mb-6">Take a quiz to see your analytics</p>
            <Link href="/quizzes" className="btn-primary">Browse Quizzes <ArrowRight className="w-4 h-4" /></Link>
          </div>
        ) : (
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map(({ label, value, icon: Icon, color, glow }) => (
                <div key={label} className="rounded-2xl p-5 gradient-border" style={{ background: "var(--surface-800)" }}>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`} style={{ boxShadow: `0 0 16px ${glow}` }}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-black text-white tracking-tight">{value}</p>
                  <p className="text-xs font-medium text-white/35 mt-0.5">{label}</p>
                </div>
              ))}
            </motion.div>

            {(trend !== null || data.strongest_topic || data.weakest_topic) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trend !== null && (
                  <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {trend > 0 ? <TrendingUp className="w-8 h-8 text-emerald-400 shrink-0" /> : trend < 0 ? <TrendingDown className="w-8 h-8 text-rose-400 shrink-0" /> : <Minus className="w-8 h-8 text-white/20 shrink-0" />}
                    <div>
                      <p className="text-white/40 text-xs">vs Previous</p>
                      <p className={`text-xl font-black ${trend > 0 ? "text-emerald-400" : trend < 0 ? "text-rose-400" : "text-white/30"}`}>{trend > 0 ? "+" : ""}{Math.round(trend)}%</p>
                    </div>
                  </div>
                )}
                {data.strongest_topic && (
                  <div className="rounded-2xl p-5" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-white/40 text-xs mb-1">Strongest Topic</p>
                    <p className="text-white font-bold text-sm capitalize">{data.strongest_topic}</p>
                  </div>
                )}
                {data.weakest_topic && (
                  <div className="rounded-2xl p-5" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-white/40 text-xs mb-1">Needs Work</p>
                    <p className="text-rose-400 font-bold text-sm capitalize">{data.weakest_topic}</p>
                  </div>
                )}
              </div>
            )}

            {Object.keys(data.topic_breakdown).length > 0 && (
              <div className="rounded-2xl p-6" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-white font-bold mb-5">Topic Breakdown</h2>
                <TopicBreakdownChart topicBreakdown={data.topic_breakdown} />
              </div>
            )}

            {data.score_trend.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <h2 className="font-bold text-white">Score History <span className="text-white/30 font-normal text-sm">({data.score_trend.length} attempts)</span></h2>
                </div>
                <div>
                  {[...data.score_trend].reverse().slice(0, 20).map((item, i) => (
                    <Link key={item.attempt_id} href={`/attempts/${item.attempt_id}/results`}
                      className="flex items-center gap-4 px-6 py-3.5 group transition-all"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.02)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = ""; }}>
                      <span className="text-white/20 text-xs font-mono w-5 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 truncate group-hover:text-blue-300 transition-colors">{item.quiz_title}</p>
                        <p className="text-xs text-white/25">{new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                      </div>
                      <span className="text-sm font-bold font-mono tabular-nums" style={{ color: scoreColor(item.score) }}>{Math.round(item.score)}%</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </PageWrapper>
    </div>
  );
}
