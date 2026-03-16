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

const scoreColor = (s: number | null) => s == null ? "#2563eb" : s >= 70 ? "#16A34A" : s >= 50 ? "#D97706" : "#DC2626";

const STAT_STYLES: { borderColor: string; iconBg: string; iconColor: string }[] = [
  { borderColor: "#2563EB", iconBg: "rgba(37, 99, 235, 0.1)", iconColor: "#2563EB" },
  { borderColor: "#D97706", iconBg: "rgba(217, 119, 6, 0.1)", iconColor: "#D97706" },
  { borderColor: "#16A34A", iconBg: "rgba(22, 163, 74, 0.1)", iconColor: "#16A34A" },
  { borderColor: "#DC2626", iconBg: "rgba(220, 38, 38, 0.1)", iconColor: "#DC2626" },
];

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
    { label: "Total Attempts", value: String(data?.total_attempts ?? 0), icon: BookOpen },
    { label: "Average Score", value: avg != null ? `${avg}%` : "--", icon: Target },
    { label: "Best Score", value: best != null ? `${best}%` : "--", icon: Trophy },
    { label: "Lowest Score", value: worst != null ? `${worst}%` : "--", icon: TrendingDown },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageWrapper>
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>My Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>Your personal performance breakdown</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "#2563EB", borderTopColor: "transparent" }} />
          </div>
        ) : isError ? (
          <div className="text-center py-20">
            <Target className="w-12 h-12 mx-auto mb-4" style={{ color: "rgba(255,255,255,0.3)" }} />
            <p className="font-semibold mb-1" style={{ color: "#DC2626" }}>Could not load analytics</p>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>Please sign in and try again</p>
            <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#2563EB" }}>Sign In <ArrowRight className="w-4 h-4" /></Link>
          </div>
        ) : !data || data.total_attempts === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: "rgba(255,255,255,0.3)" }} />
            <p className="font-semibold mb-1" style={{ color: "#FFFFFF" }}>No attempts yet</p>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>Take a quiz to see your analytics</p>
            <Link href="/quizzes" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#2563EB" }}>Browse Quizzes <ArrowRight className="w-4 h-4" /></Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stat Cards */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map(({ label, value, icon: Icon }, idx) => {
                const s = STAT_STYLES[idx];
                return (
                  <div
                    key={label}
                    className="rounded-xl p-5 bg-[#1A1A1A] border shadow-sm"
                    style={{ borderColor: "rgba(255,255,255,0.15)", borderLeftWidth: 4, borderLeftColor: s.borderColor }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: s.iconBg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: s.iconColor }} />
                    </div>
                    <p className="text-2xl font-black tracking-tight" style={{ color: "#FFFFFF" }}>{value}</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</p>
                  </div>
                );
              })}
            </motion.div>

            {/* Trend + Strongest/Weakest */}
            {(trend !== null || data.strongest_topic || data.weakest_topic) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trend !== null && (
                  <div className="rounded-xl p-5 flex items-center gap-4 bg-[#1A1A1A] border border-white/30 shadow-sm">
                    {trend > 0 ? <TrendingUp className="w-8 h-8 shrink-0" style={{ color: "#16A34A" }} /> : trend < 0 ? <TrendingDown className="w-8 h-8 shrink-0" style={{ color: "#DC2626" }} /> : <Minus className="w-8 h-8 text-white/30 shrink-0" />}
                    <div>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>vs Previous</p>
                      <p className="text-xl font-black" style={{ color: trend > 0 ? "#16A34A" : trend < 0 ? "#DC2626" : "#64748B" }}>{trend > 0 ? "+" : ""}{Math.round(trend)}%</p>
                    </div>
                  </div>
                )}
                {data.strongest_topic && (
                  <div className="rounded-xl p-5 bg-[#1A1A1A] border border-white/30 shadow-sm">
                    <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>Strongest Topic</p>
                    <p className="font-bold text-sm capitalize" style={{ color: "#FFFFFF" }}>{data.strongest_topic}</p>
                  </div>
                )}
                {data.weakest_topic && (
                  <div className="rounded-xl p-5 bg-[#1A1A1A] border border-white/30 shadow-sm">
                    <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>Needs Work</p>
                    <p className="font-bold text-sm capitalize" style={{ color: "#DC2626" }}>{data.weakest_topic}</p>
                  </div>
                )}
              </div>
            )}

            {/* Topic Breakdown Chart */}
            {Object.keys(data.topic_breakdown).length > 0 && (
              <div className="rounded-xl p-6 bg-[#1A1A1A] border border-white/30 shadow-sm">
                <h2 className="font-bold mb-5" style={{ color: "#FFFFFF" }}>Topic Breakdown</h2>
                <TopicBreakdownChart topicBreakdown={data.topic_breakdown} />
              </div>
            )}

            {/* Score History */}
            {data.score_trend.length > 0 && (
              <div className="rounded-xl overflow-hidden bg-[#1A1A1A] border border-white/30 shadow-sm">
                <div className="px-6 py-5 border-b border-white/30">
                  <h2 className="font-bold" style={{ color: "#FFFFFF" }}>Score History <span className="font-normal text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>({data.score_trend.length} attempts)</span></h2>
                </div>
                <div>
                  {[...data.score_trend].reverse().slice(0, 20).map((item, i) => (
                    <Link key={item.attempt_id} href={`/attempts/${item.attempt_id}/results`}
                      className="flex items-center gap-4 px-6 py-3.5 group transition-all border-b border-white/10 hover:bg-background">
                      <span className="text-xs font-mono w-5 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate transition-colors" style={{ color: "#FFFFFF" }}>{item.quiz_title}</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
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
