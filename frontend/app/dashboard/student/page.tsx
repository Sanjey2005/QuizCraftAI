"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BookOpen, BarChart2, Trophy, TrendingUp, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/hooks";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";

interface ScoreTrendItem { date: string; score: number; quiz_title: string; attempt_id: string; }
interface StudentAnalytics {
  total_attempts: number; avg_score: number | null; best_score: number | null;
  worst_score: number | null; score_trend: ScoreTrendItem[];
  topic_breakdown: Record<string, { correct: number; total: number; accuracy: number }>;
  strongest_topic: string | null; weakest_topic: string | null;
}

const scoreColor = (s: number | null) => s == null ? "#2563eb" : s >= 70 ? "#10b981" : s >= 50 ? "#f59e0b" : "#f43f5e";

export default function StudentDashboardPage() {
  const [username, setUsername] = useState("");
  useEffect(() => { const u = getStoredUser(); if (u) setUsername(u.username); }, []);

  const { data, isLoading } = useQuery<StudentAnalytics>({
    queryKey: ["student-analytics"],
    queryFn: () => api.get<StudentAnalytics>("/api/analytics/me").then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const completedQuizzes = data?.score_trend ? new Set(data.score_trend.map((s) => s.quiz_title)).size : 0;

  const stats = [
    { icon: BookOpen, label: "Total Attempts", value: data?.total_attempts ?? 0, color: "from-blue-500 to-indigo-600", glow: "rgba(99,102,241,0.35)" },
    { icon: BarChart2, label: "Average Score", value: data?.avg_score != null ? `${Math.round(data.avg_score)}%` : "—", color: "from-cyan-500 to-blue-600", glow: "rgba(6,182,212,0.35)" },
    { icon: Trophy, label: "Best Score", value: data?.best_score != null ? `${Math.round(data.best_score)}%` : "—", color: "from-amber-500 to-orange-500", glow: "rgba(245,158,11,0.35)" },
    { icon: TrendingUp, label: "Quizzes Completed", value: completedQuizzes, color: "from-violet-500 to-purple-600", glow: "rgba(139,92,246,0.35)" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-900)" }}>
      <PageWrapper>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{username ? `Welcome back, ${username}` : "Dashboard"}</h1>
            <p className="text-white/35 text-sm mt-0.5">Your learning progress at a glance</p>
          </div>
          <Link href="/quizzes" className="btn-primary text-sm">
            Discover Quizzes <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ icon: Icon, label, value, color, glow }) => (
            <div key={label} className="rounded-2xl p-5 gradient-border" style={{ background: "var(--surface-800)" }}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`} style={{ boxShadow: `0 0 16px ${glow}` }}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              {isLoading ? <div className="h-8 w-16 bg-white/10 rounded animate-pulse mb-0.5" /> :
                <p className="text-2xl font-black text-white tracking-tight">{value}</p>}
              <p className="text-xs font-medium text-white/35 mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <h2 className="font-bold text-white text-lg">Recent Attempts</h2>
            <Link href="/analytics/me" className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">View all</Link>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-3">{[0,1,2].map((i) => <div key={i} className="flex gap-3 animate-pulse"><div className="h-10 bg-white/10 rounded-xl flex-1" /><div className="h-10 w-16 bg-white/5 rounded-xl" /></div>)}</div>
          ) : !data?.score_trend?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <BookOpen className="w-10 h-10 text-white/15 mb-3" />
              <p className="text-white/40 font-medium text-sm">No attempts yet — start a quiz!</p>
              <Link href="/quizzes" className="mt-5 btn-primary text-sm">Browse Quizzes</Link>
            </div>
          ) : (
            <div>
              {[...data.score_trend].reverse().slice(0, 10).map((item, idx) => (
                <motion.div key={item.attempt_id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + idx * 0.04 }}>
                  <Link href={`/attempts/${item.attempt_id}/results`}
                    className="flex items-center gap-4 px-6 py-3.5 group transition-all"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.02)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = ""; }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white/80 truncate group-hover:text-blue-300 transition-colors">{item.quiz_title}</p>
                      <p className="text-xs text-white/25 mt-0.5">{new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                    </div>
                    <span className="text-lg font-black font-mono tabular-nums" style={{ color: scoreColor(item.score) }}>{Math.round(item.score)}%</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </PageWrapper>
    </div>
  );
}
