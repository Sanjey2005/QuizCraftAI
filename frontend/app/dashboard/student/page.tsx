"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, BarChart2, Trophy, TrendingUp, ArrowRight, School, Plus, X, Users, Play, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/hooks";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  hard:   { bg: "bg-red-500/10 border-red-500/20",          text: "text-red-400" },
};

const scoreColor = (s: number | null) => s == null ? "#60A5FA" : s >= 70 ? "#4ADE80" : s >= 50 ? "#FBBF24" : "#F87171";

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

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

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-sm rounded-xl p-6 bg-surface-2 border border-white/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-primary">Join Classroom</h3>
              <button onClick={handleClose} className="p-1.5 rounded-lg text-white/60 hover:text-primary hover:bg-surface-2 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Classroom Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="e.g. ABC123"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg text-center text-2xl font-black tracking-[0.3em] font-mono text-primary placeholder:text-white/60 outline-none border border-white/30 bg-surface-2 focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all uppercase"
                  autoFocus
                />
              </div>
              {error && <p className="text-danger text-xs text-center">{error}</p>}
              <Button
                type="submit"
                disabled={code.length < 6 || joinMutation.isPending}
                className="w-full"
                variant="premium"
              >
                {joinMutation.isPending ? "Joining..." : "Join Classroom"}
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
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
    { icon: BookOpen, label: "Total Attempts", value: data?.total_attempts ?? 0, gradient: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-400", borderColor: "border-l-blue-500/50" },
    { icon: Activity, label: "Average Score", value: data?.avg_score != null ? `${Math.round(data.avg_score)}%` : "—", gradient: "from-cyan-500/20 to-cyan-500/5", iconColor: "text-cyan-400", borderColor: "border-l-cyan-500/50" },
    { icon: Trophy, label: "Best Score", value: data?.best_score != null ? `${Math.round(data.best_score)}%` : "—", gradient: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-400", borderColor: "border-l-amber-500/50" },
    { icon: TrendingUp, label: "Quizzes Completed", value: completedQuizzes, gradient: "from-violet-500/20 to-violet-500/5", iconColor: "text-violet-400", borderColor: "border-l-violet-500/50" },
  ];

  const quizzesLoading = classroomsLoading || classroomQuizResults.some((r) => r.isLoading);

  return (
    <PageWrapper>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 mb-4 font-mono uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Student Dashboard
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-5xl font-semibold tracking-tight text-primary mb-2">
            Welcome back{username ? `, ${username}` : ""}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-white/80">
            Your learning progress at a glance
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-3">
          {activeTab === "classrooms" || activeTab === "quizzes" ? (
             <Button onClick={() => setJoinModalOpen(true)} variant="premium">
               <Plus className="w-4 h-4 mr-2" />
               Join Classroom
             </Button>
          ) : (
            <Link href="/quizzes">
              <Button variant="premium">
                Discover Quizzes
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </motion.div>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ icon: Icon, label, value, gradient, iconColor, borderColor }, idx) => (
          <motion.div key={label} variants={fadeUp} className={cn("rounded-xl p-5 bg-surface-2 border border-white/30 transition-all hover:bg-surface-2 relative overflow-hidden group", borderColor)}>
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", gradient)} />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-lg bg-surface-2 border border-white/30 flex items-center justify-center mb-4">
                <Icon className={cn("w-5 h-5", iconColor)} />
              </div>
              {isLoading ? (
                <div className="h-8 w-16 bg-surface-2 border border-white/30 rounded animate-pulse mb-1" />
              ) : (
                <p className="text-2xl font-bold text-primary tracking-tight">{value}</p>
              )}
              <p className="text-xs font-medium text-white/80 mt-1">{label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 mb-8 p-1 rounded-lg w-fit bg-surface-2 border border-white/30">
        {(["overview", "quizzes", "classrooms"] as const).map((tab) => {
           const icons = { overview: BarChart2, quizzes: BookOpen, classrooms: School };
           const Icon = icons[tab];
           return (
             <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm transition-all flex items-center gap-2 capitalize",
                  activeTab === tab 
                    ? "bg-white text-black font-medium shadow-sm" 
                    : "text-white/80 hover:text-primary hover:bg-surface-2"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab}
              </button>
           )
        })}
      </div>

      {/* Overview Tab */}
      <AnimatePresence mode="wait">
      {activeTab === "overview" && (
        <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}
          className="rounded-xl overflow-hidden bg-surface-2 border border-white/30">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/30">
            <h2 className="font-medium text-primary text-lg">Recent Attempts</h2>
            <Link href="/analytics/me" className="text-xs font-medium text-white/60 hover:text-primary transition-colors flex items-center gap-1">View all <ArrowRight className="w-3 h-3"/></Link>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-4">{[0,1,2].map((i) => <div key={i} className="flex gap-4 animate-pulse"><div className="h-12 bg-surface-2 rounded-lg flex-1" /><div className="h-12 w-16 bg-surface-2 rounded-lg" /></div>)}</div>
          ) : !data?.score_trend?.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-white/30 flex items-center justify-center mb-4">
                 <Activity className="w-8 h-8 text-white/60" />
              </div>
              <p className="text-primary font-medium mb-2">No attempts yet</p>
              <p className="text-white/80 text-sm mb-6">Join a classroom and start taking quizzes to see your progress.</p>
              <Button onClick={() => setJoinModalOpen(true)} className="gap-2">
                Join Classroom
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {[...data.score_trend].reverse().slice(0, 10).map((item, idx) => (
                <motion.div key={item.attempt_id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + idx * 0.05 }}>
                  <Link href={`/attempts/${item.attempt_id}/results`}
                    className="flex items-center gap-4 px-6 py-4 group hover:bg-surface-2 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate group-hover:text-white transition-colors">{item.quiz_title}</p>
                      <p className="text-xs text-white/60 mt-1">{new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-bold font-mono tabular-nums" style={{ color: scoreColor(item.score) }}>{Math.round(item.score)}%</span>
                      <span className="text-[10px] items-center text-white/60 flex gap-1 group-hover:text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">View Results <ArrowRight className="w-3 h-3"/></span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Quizzes Tab */}
      {activeTab === "quizzes" && (
        <motion.div key="quizzes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
          {classroomsLoading ? (
            <div className="space-y-6">
              {[0, 1].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-surface-2 border border-white/30">
                   <div className="h-14 px-6 flex items-center border-b border-white/30">
                     <div className="h-5 bg-surface-2 rounded w-1/3 animate-pulse" />
                   </div>
                   <div className="p-4 space-y-2">
                     {[0,1].map(j => <div key={j} className="h-16 bg-surface-2 rounded-lg animate-pulse" />)}
                   </div>
                </div>
              ))}
            </div>
          ) : classrooms.length === 0 ? (
            <div className="rounded-xl bg-surface-2 border border-white/30">
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-white/30 flex items-center justify-center mb-6">
                  <BookOpen className="w-8 h-8 text-white/80" />
                </div>
                <h3 className="text-xl font-medium text-primary mb-2">Join a classroom</h3>
                <p className="text-white/80 text-sm mb-6 max-w-sm">Your instructor will assign quizzes to your classroom. Ask them for a join code.</p>
                <Button onClick={() => setJoinModalOpen(true)} className="gap-2">
                  Join Classroom
                </Button>
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + cIdx * 0.05 }}
                    className="rounded-xl bg-surface-2 border border-white/30 overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-surface-2 transition-colors border-b border-white/30 group"
                      onClick={() => router.push(`/classrooms/${classroom.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-2 border border-white/30 flex items-center justify-center group-hover:border-white/20 transition-colors">
                          <School className="w-5 h-5 text-white/80 group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <p className="font-medium text-primary group-hover:text-white transition-colors">{classroom.name}</p>
                          <p className="text-xs text-white/60">by {classroom.teacher_username}</p>
                        </div>
                      </div>
                      <span className="text-xs text-white/60 bg-surface-2 px-2.5 py-1 rounded-full border border-white/30 group-hover:border-white/10 transition-colors">
                         {loading ? "..." : quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""}
                      </span>
                    </div>

                    {loading ? (
                      <div className="p-4 space-y-2">
                        {[0, 1].map((i) => <div key={i} className="h-16 bg-surface-2 rounded-lg animate-pulse" />)}
                      </div>
                    ) : quizzes.length === 0 ? (
                      <div className="py-10 text-center px-4 bg-background/50">
                        <p className="text-white/60 text-sm border border-dashed border-white/30 inline-block px-4 py-2 rounded-lg">No quizzes assigned yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50 bg-background/30">
                        {quizzes.map((quiz, qIdx) => {
                          const dc = DIFFICULTY_COLORS[quiz.difficulty] ?? { bg: "bg-surface-2 border-white/30", text: "text-white/60" };
                          return (
                            <div
                              key={quiz.id}
                              className="flex items-center gap-4 px-6 py-4 hover:bg-surface-2 transition-colors group/quiz"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-primary truncate group-hover/quiz:text-white transition-colors">{quiz.title}</p>
                                <p className="text-xs text-white/60 mt-1 truncate">{quiz.topic}</p>
                              </div>
                              <span className={cn("px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider flex-shrink-0", dc.bg, dc.text)}>
                                {quiz.difficulty}
                              </span>
                              {quiz.question_count != null && (
                                <span className="text-xs font-mono text-white/80 flex-shrink-0 hidden sm:block border border-white/30 px-2 py-0.5 rounded bg-surface-2">
                                  {quiz.question_count}q
                                </span>
                              )}
                              <Link
                                href={`/quizzes/${quiz.id}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-background bg-primary hover:bg-white transition-colors flex-shrink-0"
                              >
                                <Play className="w-3 h-3 fill-current" />
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
        <motion.div key="classrooms" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
          {classroomsLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-xl h-28 bg-surface-2 border border-white/30 animate-pulse" />
              ))}
            </div>
          ) : classrooms.length === 0 ? (
             <div className="rounded-xl bg-surface-2 border border-white/30">
               <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                 <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-white/30 flex items-center justify-center mb-6">
                   <School className="w-8 h-8 text-white/80" />
                 </div>
                 <h3 className="text-xl font-medium text-primary mb-2">No classrooms</h3>
                 <p className="text-white/80 text-sm mb-6 max-w-sm">You haven't joined any classrooms yet. Ask your instructor for a code.</p>
                 <Button onClick={() => setJoinModalOpen(true)} className="gap-2">
                   Join Classroom
                 </Button>
               </div>
             </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {classrooms.map((classroom, idx) => (
                <motion.div
                  key={classroom.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + idx * 0.05 }}
                  className="rounded-xl bg-surface-2 border border-white/30 p-6 cursor-pointer group transition-all hover:bg-surface-2 hover:border-white/10"
                  onClick={() => router.push(`/classrooms/${classroom.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                     <div className="w-12 h-12 rounded-xl bg-surface-2 border border-white/30 flex items-center justify-center group-hover:border-white/20 transition-colors">
                        <School className="w-6 h-6 text-white/80 group-hover:text-primary transition-colors" />
                     </div>
                     <span className="text-xs text-white/60 font-mono bg-background px-2 py-1 rounded border border-white/30">
                        {new Date(classroom.created_at).getFullYear()}
                     </span>
                  </div>
                  <h3 className="font-medium text-primary text-lg truncate group-hover:text-white transition-colors mb-1">
                    {classroom.name}
                  </h3>
                  {classroom.description ? (
                     <p className="text-sm text-white/80 truncate mb-4">{classroom.description}</p>
                  ) : (
                     <div className="mb-4" />
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-white/60 border-t border-white/30 pt-4">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {classroom.member_count} member{classroom.member_count !== 1 ? "s" : ""}
                    </span>
                    <span className="flex-1 text-right">Instructor: {classroom.teacher_username}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
      <JoinClassroomModal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
    </PageWrapper>
  );
}
