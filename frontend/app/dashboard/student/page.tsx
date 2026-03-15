"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, BarChart2, Trophy, TrendingUp, ArrowRight, School, Plus, X, Users, Play } from "lucide-react";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/hooks";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScoreTrendItem { date: string; score: number; quiz_title: string; attempt_id: string; }
interface StudentAnalytics {
  total_attempts: number; avg_score: number | null; best_score: number | null;
  worst_score: number | null; score_trend: ScoreTrendItem[];
  topic_breakdown: Record<string, { correct: number; total: number; accuracy: number }>;
  strongest_topic: string | null; weakest_topic: string | null;
}

interface Classroom {
  id: string;
  name: string;
  description: string;
  code: string;
  teacher_username: string;
  member_count: number;
  created_at: string;
}

interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  question_count?: number;
  available_from: string | null;
  available_until: string | null;
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  easy:   { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400" },
  medium: { bg: "bg-amber-500/10 border-amber-500/20",     text: "text-amber-400" },
  hard:   { bg: "bg-rose-500/10 border-rose-500/20",       text: "text-rose-400" },
};

const scoreColor = (s: number | null) => s == null ? "#2563eb" : s >= 70 ? "#10b981" : s >= 50 ? "#f59e0b" : "#f43f5e";

function JoinClassroomModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const joinMutation = useMutation({
    mutationFn: (data: { code: string }) =>
      api.post("/api/classrooms/join", data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-classrooms-student"] });
      setCode("");
      setError("");
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || "Failed to join classroom.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError("");
    joinMutation.mutate({ code: code.trim().toUpperCase() });
  };

  const handleClose = () => {
    setCode("");
    setError("");
    joinMutation.reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-sm rounded-2xl p-6"
        style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Join Classroom</h3>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Classroom Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="e.g. ABC123"
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl text-center text-2xl font-black tracking-[0.3em] font-mono text-white placeholder:text-white/15 outline-none focus:ring-1 focus:ring-blue-500/40 transition-all"
              style={{ background: "var(--surface-900)", border: "1px solid rgba(255,255,255,0.08)" }}
              autoFocus
            />
          </div>
          {error && <p className="text-rose-400 text-xs text-center">{error}</p>}
          <button
            type="submit"
            disabled={code.length < 6 || joinMutation.isPending}
            className="w-full btn-primary text-sm justify-center disabled:opacity-40"
          >
            {joinMutation.isPending ? "Joining..." : "Join Classroom"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "quizzes" | "classrooms">("overview");
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  useEffect(() => { const u = getStoredUser(); if (u) setUsername(u.username); }, []);

  const { data, isLoading } = useQuery<StudentAnalytics>({
    queryKey: ["student-analytics"],
    queryFn: () => api.get<StudentAnalytics>("/api/analytics/me").then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const { data: classrooms = [], isLoading: classroomsLoading } = useQuery<Classroom[]>({
    queryKey: ["my-classrooms-student"],
    queryFn: () => api.get("/api/classrooms/my").then((r) => r.data),
  });

  // Fetch quizzes for each classroom (for the Quizzes tab)
  const classroomQuizResults = useQueries({
    queries: classrooms.map((c) => ({
      queryKey: ["classroom-quizzes", c.id],
      queryFn: () => api.get<Quiz[]>(`/api/classrooms/${c.id}/quizzes`).then((r) => r.data),
    })),
  });

  const completedQuizzes = data?.score_trend ? new Set(data.score_trend.map((s) => s.quiz_title)).size : 0;

  const stats = [
    { icon: BookOpen, label: "Total Attempts", value: data?.total_attempts ?? 0, color: "from-blue-500 to-indigo-600", glow: "rgba(99,102,241,0.35)" },
    { icon: BarChart2, label: "Average Score", value: data?.avg_score != null ? `${Math.round(data.avg_score)}%` : "—", color: "from-cyan-500 to-blue-600", glow: "rgba(6,182,212,0.35)" },
    { icon: Trophy, label: "Best Score", value: data?.best_score != null ? `${Math.round(data.best_score)}%` : "—", color: "from-amber-500 to-orange-500", glow: "rgba(245,158,11,0.35)" },
    { icon: TrendingUp, label: "Quizzes Completed", value: completedQuizzes, color: "from-violet-500 to-purple-600", glow: "rgba(139,92,246,0.35)" },
  ];

  const quizzesLoading = classroomsLoading || classroomQuizResults.some((r) => r.isLoading);

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-900)" }}>
      <PageWrapper>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{username ? `Welcome back, ${username}` : "Dashboard"}</h1>
            <p className="text-white/35 text-sm mt-0.5">Your learning progress at a glance</p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "classrooms" || activeTab === "quizzes" ? (
              <button onClick={() => setJoinModalOpen(true)} className="btn-primary text-sm">
                <Plus className="w-4 h-4" />
                Join Classroom
              </button>
            ) : (
              <Link href="/quizzes" className="btn-primary text-sm">
                Discover Quizzes <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              activeTab === "overview" ? "bg-blue-500/15 text-blue-400" : "text-white/35 hover:text-white/60"
            )}
          >
            <BarChart2 className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("quizzes")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              activeTab === "quizzes" ? "bg-emerald-500/15 text-emerald-400" : "text-white/35 hover:text-white/60"
            )}
          >
            <BookOpen className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Quizzes
          </button>
          <button
            onClick={() => setActiveTab("classrooms")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              activeTab === "classrooms" ? "bg-violet-500/15 text-violet-400" : "text-white/35 hover:text-white/60"
            )}
          >
            <School className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Classrooms
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
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
                <p className="text-white/40 font-medium text-sm">No attempts yet — join a classroom and start a quiz!</p>
                <button onClick={() => setJoinModalOpen(true)} className="mt-5 btn-primary text-sm">
                  Join Classroom
                </button>
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
        )}

        {/* Quizzes Tab — grouped by classroom */}
        {activeTab === "quizzes" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {classroomsLoading ? (
              <div className="space-y-6">
                {[0, 1].map((i) => (
                  <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "var(--surface-800)" }}>
                    <div className="h-14 px-6 flex items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="h-4 bg-white/10 rounded w-1/3" />
                    </div>
                    {[0, 1, 2].map((j) => <div key={j} className="h-16 border-b border-white/5 px-6 flex items-center gap-4"><div className="h-3 bg-white/10 rounded flex-1" /></div>)}
                  </div>
                ))}
              </div>
            ) : classrooms.length === 0 ? (
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-white font-bold text-lg mb-2">Join a classroom to access quizzes</p>
                  <p className="text-white/30 text-sm mb-6 max-w-xs">Your instructor will assign quizzes to your classroom.</p>
                  <button onClick={() => setJoinModalOpen(true)} className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Join Classroom
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {classrooms.map((classroom, cIdx) => {
                  const result = classroomQuizResults[cIdx];
                  const quizzes: Quiz[] = result?.data ?? [];
                  const loading = result?.isLoading ?? false;

                  return (
                    <motion.div
                      key={classroom.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + cIdx * 0.06 }}
                      className="rounded-2xl overflow-hidden"
                      style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                        onClick={() => router.push(`/classrooms/${classroom.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <School className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{classroom.name}</p>
                            <p className="text-xs text-white/30">by {classroom.teacher_username}</p>
                          </div>
                        </div>
                        <span className="text-xs text-white/25">{loading ? "…" : quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""}</span>
                      </div>

                      {loading ? (
                        <div className="p-4 space-y-2">
                          {[0, 1].map((i) => <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />)}
                        </div>
                      ) : quizzes.length === 0 ? (
                        <div className="py-8 text-center px-4">
                          <p className="text-white/25 text-sm">No quizzes assigned yet</p>
                        </div>
                      ) : (
                        <div>
                          {quizzes.map((quiz, qIdx) => {
                            const dc = DIFFICULTY_COLORS[quiz.difficulty] ?? { bg: "bg-white/5 border-white/10", text: "text-white/40" };
                            return (
                              <div
                                key={quiz.id}
                                className="flex items-center gap-4 px-6 py-3.5"
                                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-white/80 truncate">{quiz.title}</p>
                                  <p className="text-xs text-white/25 mt-0.5 truncate">{quiz.topic}</p>
                                </div>
                                <span className={cn("px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider flex-shrink-0", dc.bg, dc.text)}>
                                  {quiz.difficulty}
                                </span>
                                {quiz.question_count != null && (
                                  <span className="text-xs text-white/25 flex-shrink-0 hidden sm:block">{quiz.question_count}q</span>
                                )}
                                <Link
                                  href={`/quizzes/${quiz.id}`}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all flex-shrink-0"
                                >
                                  <Play className="w-3 h-3" />
                                  Start
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Classrooms Tab */}
        {activeTab === "classrooms" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {classroomsLoading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ background: "var(--surface-800)" }}>
                    <div className="h-5 bg-white/10 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-white/5 rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : classrooms.length === 0 ? (
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center mb-4">
                    <School className="w-8 h-8 text-violet-400" />
                  </div>
                  <p className="text-white font-bold text-lg mb-2">No classrooms yet</p>
                  <p className="text-white/30 text-sm mb-6 max-w-xs">Ask your instructor for a classroom code to join.</p>
                  <button onClick={() => setJoinModalOpen(true)} className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Join Classroom
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {classrooms.map((classroom, idx) => (
                  <motion.div
                    key={classroom.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    className="rounded-2xl p-5 cursor-pointer group transition-all hover:scale-[1.01]"
                    style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}
                    onClick={() => router.push(`/classrooms/${classroom.id}`)}
                  >
                    <p className="font-bold text-white text-base truncate group-hover:text-violet-300 transition-colors mb-1">
                      {classroom.name}
                    </p>
                    {classroom.description && (
                      <p className="text-xs text-white/30 truncate mb-3">{classroom.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-white/30">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {classroom.member_count} member{classroom.member_count !== 1 ? "s" : ""}
                      </span>
                      <span>by {classroom.teacher_username}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        <JoinClassroomModal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
      </PageWrapper>
    </div>
  );
}
