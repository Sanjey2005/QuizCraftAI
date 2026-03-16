"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Trophy, Clock, Users, TrendingUp, Loader2, ArrowLeft, Medal } from "lucide-react";
import { api } from "@/lib/api";
import { TopicBreakdownChart } from "@/components/analytics/TopicBreakdownChart";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface QuizAnalytics {
  quiz_id: string; quiz_title: string; total_attempts: number;
  avg_score: number | null; best_score: number | null; worst_score: number | null;
  avg_time_seconds: number | null;
  topic_breakdown: Record<string, { correct: number; total: number; accuracy: number }>;
}

interface LeaderboardEntry { rank: number; username: string; display_name: string; score: number; time_spent_seconds: number; completed_at: string; }
interface LeaderboardData { quiz_id: string; quiz_title: string; leaderboard: LeaderboardEntry[]; }

const fmt = (s: number | null) => { if (!s) return "--"; return `${Math.floor(s/60)}m ${Math.round(s%60)}s`; };

const STAT_STYLES: { borderColor: string; iconBg: string; iconColor: string }[] = [
  { borderColor: "#2563EB", iconBg: "rgba(37,99,235,0.1)", iconColor: "#60A5FA" }, // Apps
  { borderColor: "#D97706", iconBg: "rgba(217,119,6,0.1)", iconColor: "#FBBF24" }, // Avg Score
  { borderColor: "#16A34A", iconBg: "rgba(22,163,74,0.1)", iconColor: "#4ADE80" }, // Top Score
  { borderColor: "#64748B", iconBg: "rgba(100,116,139,0.1)", iconColor: "#94A3B8" }, // Time
];

function shimmerVariant() {
   return {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95 }
   };
}

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
    { bg: "bg-[#332A15]/80", border: "border-[#D4AF37]/30", text: "text-[#D4AF37]", shadow: "shadow-[0_0_20px_rgba(212,175,55,0.2)]" }, // Gold
    { bg: "bg-[#1E252E]/80", border: "border-[#C0C0C0]/30", text: "text-[#C0C0C0]", shadow: "shadow-[0_0_20px_rgba(192,192,192,0.1)]" }, // Silver
    { bg: "bg-[#2E1E16]/80", border: "border-[#CD7F32]/30", text: "text-[#CD7F32]", shadow: "shadow-[0_0_20px_rgba(205,127,50,0.15)]" }, // Bronze
  ];

  if (isLoading) return (
   <div className="min-h-screen bg-background flex items-center justify-center">
     <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-white/80 font-mono text-xs uppercase tracking-widest">Loading Analytics</p>
     </div>
   </div>
  );

  if (isError || !data) return (
   <div className="min-h-screen bg-background flex items-center justify-center p-4">
     <div className="bg-surface-2 rounded-2xl shadow-2xl border border-danger/20 p-8 text-center max-w-sm w-full mx-auto">
       <p className="text-primary font-bold text-xl mb-2">Could not load analytics</p>
       <p className="text-white/80 text-sm mb-8">Data unavailable or quiz deleted.</p>
       <Link href="/dashboard/instructor" className="text-sm border-b border-primary/30 pb-0.5 text-primary hover:text-white transition-colors">
          Back to Dashboard
       </Link>
     </div>
   </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <PageWrapper className="max-w-5xl mx-auto py-10 md:py-16">
        <Link href="/dashboard/instructor" className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-white/60 hover:text-primary transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-mono uppercase tracking-widest text-white/80 mb-2 flex items-center gap-2">
             <TrendingUp className="w-3.5 h-3.5" /> Analytics Overview
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">{data.quiz_title}</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1.5 rounded-xl mb-10 w-fit bg-surface-2 border border-white/30 shadow-inner overflow-x-auto max-w-full">
          {[{ id: "overview", label: "Overview" }, { id: "leaderboard", label: "Leaderboard" }].map(({ id: tid, label }) => (
            <button key={tid} onClick={() => setTab(tid as "overview" | "leaderboard")}
              className={cn(
                "px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 relative",
                tab === tid
                  ? "text-white bg-[#1A1A1A]/10 shadow-sm border border-white/5"
                  : "text-white/60 hover:text-primary hover:bg-[#1A1A1A]/5"
              )}>
              {tab === tid && <motion.div layoutId="analyticstab" className="absolute inset-0 bg-[#1A1A1A]/5 rounded-lg border border-white/10" />}
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div key="overview" variants={shimmerVariant()} initial="initial" animate="animate" exit="exit" className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Attempts", value: String(data.total_attempts), icon: Users },
                { label: "Average Score", value: data.avg_score != null ? `${Math.round(data.avg_score)}%` : "--", icon: TrendingUp },
                { label: "Top Score", value: data.best_score != null ? `${Math.round(data.best_score)}%` : "--", icon: Trophy },
                { label: "Avg Time", value: fmt(data.avg_time_seconds), icon: Clock },
              ].map(({ label, value, icon: Icon }, idx) => {
                const s = STAT_STYLES[idx];
                return (
                  <div
                    key={label}
                    className="rounded-2xl p-6 bg-surface-2 border border-white/30 shadow-md relative overflow-hidden group hover:bg-surface-2 transition-colors"
                  >
                     <div className="absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full opacity-20 pointer-events-none transition-opacity group-hover:opacity-40" style={{ backgroundColor: s.iconColor }} />
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-white/5 shadow-inner"
                      style={{ background: s.iconBg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: s.iconColor }} />
                    </div>
                    <p className="text-3xl font-black tracking-tight text-white mb-1 font-mono">{value}</p>
                    <p className="text-xs uppercase tracking-widest text-white/60 font-semibold">{label}</p>
                  </div>
                );
              })}
            </div>

            {/* Topic Breakdown */}
            {data.topic_breakdown && Object.keys(data.topic_breakdown).length > 0 && (
              <div className="rounded-2xl p-6 md:p-8 bg-surface-2 border border-white/30 shadow-md">
                <h2 className="text-base font-semibold text-white mb-6">Topic Breakdown</h2>
                <div className="overflow-x-auto pb-4">
                  <TopicBreakdownChart topicBreakdown={data.topic_breakdown} />
                </div>
              </div>
            )}

            {/* Empty State */}
            {data.total_attempts === 0 && (
              <div className="rounded-2xl p-16 text-center bg-surface-2 border border-white/30 shadow-md flex flex-col items-center">
                 <Users className="w-10 h-10 text-white/60/30 mb-4" />
                <p className="text-sm font-medium text-white/80">No attempts yet</p>
                <p className="text-xs text-white/60 mt-2 max-w-xs mx-auto">Share the quiz with students to start gathering analytics data.</p>
              </div>
            )}
          </motion.div>
        )}

        {tab === "leaderboard" && (
          <motion.div key="leaderboard" variants={shimmerVariant()} initial="initial" animate="animate" exit="exit">
          {lbLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !lbData?.leaderboard?.length ? (
            <div className="rounded-2xl p-16 text-center bg-surface-2 border border-white/30 shadow-md flex flex-col items-center">
              <Medal className="w-12 h-12 mb-4 text-white/60/30" />
              <p className="font-medium text-white/80">No recorded scores yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Podium */}
              <div className={cn(
                "grid gap-4",
                lbData.leaderboard.length === 1 ? "grid-cols-1 max-w-sm mx-auto" :
                lbData.leaderboard.length === 2 ? "grid-cols-2 max-w-2xl mx-auto" : "grid-cols-1 md:grid-cols-3"
              )}>
                {lbData.leaderboard.slice(0, 3).map((e) => {
                  const s = PODIUM[e.rank - 1];
                  return (
                     <motion.div 
                        key={e.rank} 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        transition={{ delay: e.rank * 0.1 }}
                        className={cn("flex flex-col items-center p-6 md:p-8 rounded-2xl border relative overflow-hidden", s?.bg, s?.border, s?.shadow)}
                     >
                      <div className="absolute top-0 right-0 w-32 h-32 blur-3xl bg-[#1A1A1A]/5 pointer-events-none" />
                      
                      <div className="relative z-10 text-center">
                         <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-full border border-white/10 bg-black/20 shadow-inner mb-4", s?.text)}>
                            <Medal className="w-6 h-6" />
                         </div>
                         <p className="font-bold text-base text-white truncate max-w-[150px]">{e.display_name}</p>
                         <p className="text-xs mb-3 text-white/60">@{e.username}</p>
                         <p className={cn("text-4xl font-black font-mono tracking-tighter", s?.text)}>{Math.round(e.score)}%</p>
                         <p className="text-xs mt-3 flex items-center justify-center gap-1.5 text-white/80 uppercase tracking-widest font-mono">
                            <Clock className="w-3.5 h-3.5" /> {fmt(e.time_spent_seconds)}
                         </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Other Rankings */}
              {lbData.leaderboard.length > 3 && (
                <div className="rounded-2xl overflow-hidden bg-surface-2 border border-white/30 shadow-md">
                  <div className="px-6 py-4 border-b border-white/30 bg-background/50">
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/80">Other Placements</span>
                  </div>
                  <div className="divide-y divide-border/50">
                     {lbData.leaderboard.slice(3).map((e) => (
                     <div key={e.rank} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 px-6 py-4 hover:bg-surface-2 transition-colors group">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                           <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-background border border-white/30 text-xs font-mono font-bold text-white/80 group-hover:text-primary transition-colors">
                              {e.rank}
                           </span>
                           <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-primary truncate leading-tight">{e.display_name}</p>
                              <p className="text-xs text-white/60">@{e.username}</p>
                           </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto mt-2 sm:mt-0 ml-12 sm:ml-0">
                           <p className="text-xs flex items-center gap-1.5 text-white/80 font-mono tracking-wide">
                              <Clock className="w-3.5 h-3.5" />{fmt(e.time_spent_seconds)}
                           </p>
                           <p className="w-16 text-right font-mono font-bold text-base text-white">{Math.round(e.score)}%</p>
                        </div>
                     </div>
                     ))}
                  </div>
                </div>
              )}
            </div>
          )}
          </motion.div>
        )}
        </AnimatePresence>
      </PageWrapper>
    </div>
  );
}
