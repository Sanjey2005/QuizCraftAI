"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen, BarChart2, Trophy, TrendingUp, TrendingDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { AppSidebar } from "@/components/ui/app-sidebar";

interface ScoreTrendItem { date: string; score: number; quiz_title: string; attempt_id: string; }
interface StudentAnalytics {
  total_attempts: number;
  avg_score: number | null;
  best_score: number | null;
  worst_score: number | null;
  score_trend: ScoreTrendItem[];
  topic_breakdown: Record<string, { correct: number; total: number; accuracy: number }>;
  strongest_topic: string | null;
  weakest_topic: string | null;
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 70 ? "#10b981" : value >= 50 ? "#f59e0b" : "#f43f5e";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-xs font-mono text-white/40 w-10 text-right">{value}%</span>
    </div>
  );
}

export default function StudentDashboardPage() {
  const { data, isLoading } = useQuery<StudentAnalytics>({
    queryKey: ["student-analytics"],
    queryFn: () => api.get<StudentAnalytics>("/api/analytics/me").then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const topicEntries = data?.topic_breakdown
    ? Object.entries(data.topic_breakdown).sort((a, b) => b[1].accuracy - a[1].accuracy)
    : [];

  const scoreColor = (score: number | null) =>
    score == null ? "#2563eb" : score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#f43f5e";

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  const stats = [
    { icon: BookOpen, label: "Quizzes Taken", value: data?.total_attempts ?? 0, color: "from-blue-500 to-indigo-600", glow: "rgba(99,102,241,0.35)" },
    { icon: BarChart2, label: "Average Score", value: data?.avg_score != null ? `${data.avg_score}%` : "—", color: "from-cyan-500 to-blue-600", glow: "rgba(6,182,212,0.35)", scoreValue: data?.avg_score ?? null },
    { icon: Trophy, label: "Best Score", value: data?.best_score != null ? `${data.best_score}%` : "—", color: "from-amber-500 to-orange-500", glow: "rgba(245,158,11,0.35)" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-900)" }}>
      <AppSidebar role="student" />

      <div className="ml-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 px-8 py-4 flex items-center justify-between"
          style={{ background: "rgba(8,13,26,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Student Dashboard</h1>
            <p className="text-white/35 text-xs mt-0.5">Your learning progress at a glance</p>
          </div>
          <Link href="/quizzes" className="hover-target btn-primary text-sm">
            <BookOpen className="w-4 h-4" />
            Browse Quizzes
          </Link>
        </div>

        <main className="px-8 py-8 max-w-6xl space-y-8">
          {/* KPI Cards */}
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {stats.map(({ icon: Icon, label, value, color, glow, scoreValue }) => (
              <motion.div
                key={label}
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="relative rounded-2xl p-6 overflow-hidden gradient-border"
                style={{ background: "var(--surface-800)" }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}
                    style={{ boxShadow: `0 0 20px ${glow}` }}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                {isLoading ? (
                  <div className="h-9 w-24 bg-white/10 rounded animate-pulse mb-1" />
                ) : (
                  <p className="text-3xl font-black tracking-tight mb-1"
                    style={{ color: scoreValue != null ? scoreColor(scoreValue) : "white" }}>
                    {value}
                  </p>
                )}
                <p className="text-sm font-medium text-white/40">{label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Analytics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Topic Performance */}
            <div className="rounded-2xl p-6 overflow-hidden" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <h2 className="font-bold text-white text-lg">Topic Performance</h2>
                {topicEntries.length > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg text-white/40" style={{ background: "rgba(255,255,255,0.05)" }}>
                    {topicEntries.length} topics
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[0, 1, 2].map((i) => <div key={i} className="space-y-2 animate-pulse"><div className="h-3 bg-white/10 rounded w-28" /><div className="h-1.5 bg-white/5 rounded" /></div>)}
                </div>
              ) : topicEntries.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart2 className="w-10 h-10 text-white/15 mx-auto mb-3" />
                  <p className="text-white/30 font-medium text-sm">Complete a quiz to see topic breakdown</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topicEntries.slice(0, 6).map(([topic, stats], idx) => (
                    <motion.div key={topic} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + idx * 0.05 }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-white/70 capitalize">{topic}</span>
                        <span className="text-xs font-medium text-white/30">{stats.correct}/{stats.total}</span>
                      </div>
                      <ScoreBar value={stats.accuracy} />
                    </motion.div>
                  ))}
                </div>
              )}

              {!isLoading && data?.strongest_topic && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                  className="flex gap-2 mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-bold capitalize">{data.strongest_topic}</span>
                  </div>
                  {data.weakest_topic && data.weakest_topic !== data.strongest_topic && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-xs text-rose-400 font-bold capitalize">{data.weakest_topic}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Recent Attempts */}
            <div className="rounded-2xl p-6 overflow-hidden" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-white text-lg mb-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>Recent Attempts</h2>

              {isLoading ? (
                <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="flex gap-3 animate-pulse"><div className="h-12 bg-white/10 rounded-xl flex-1" /><div className="h-12 w-16 bg-white/5 rounded-xl" /></div>)}</div>
              ) : !data?.score_trend.length ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-10 h-10 text-white/15 mx-auto mb-3" />
                  <p className="text-white/30 font-medium text-sm">No attempts yet — start a quiz!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.score_trend.map((item, idx) => (
                    <motion.div key={item.attempt_id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + idx * 0.05 }}>
                      <Link
                        href={`/attempts/${item.attempt_id}/results`}
                        className="hover-target flex items-center gap-4 p-3 rounded-xl group transition-all"
                        style={{ border: "1px solid transparent" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = ""; (e.currentTarget as HTMLAnchorElement).style.borderColor = "transparent"; }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white/80 truncate group-hover:text-blue-300 transition-colors">{item.quiz_title}</p>
                          <p className="text-xs font-medium text-white/30 mt-0.5">
                            {new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <span className="text-lg font-black font-mono tabular-nums" style={{ color: scoreColor(item.score) }}>
                          {item.score}%
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            {[
              { href: "/quizzes", icon: BookOpen, label: "Discover Quizzes", desc: "Browse AI-generated quizzes on any topic", gradient: "from-blue-500 to-indigo-600", glow: "rgba(99,102,241,0.4)" },
              { href: "/analytics/me", icon: BarChart2, label: "Full Analytics", desc: "Deep-dive into your performance data", gradient: "from-emerald-500 to-teal-600", glow: "rgba(16,185,129,0.4)" },
            ].map(({ href, icon: Icon, label, desc, gradient, glow }) => (
              <Link key={href} href={href}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="hover-target flex items-center gap-5 p-6 rounded-2xl gradient-border card-glow transition-all cursor-pointer"
                  style={{ background: "var(--surface-800)" }}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
                    style={{ boxShadow: `0 0 25px ${glow}` }}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{label}</h3>
                    <p className="text-sm font-medium text-white/35 mt-0.5">{desc}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
