"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BookOpen, PlusCircle, BarChart2, Users, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AppSidebar } from "@/components/ui/app-sidebar";

interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  generation_status: "pending" | "generating" | "completed" | "failed";
  created_at: string;
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  easy:   { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400" },
  medium: { bg: "bg-amber-500/10 border-amber-500/20",     text: "text-amber-400"   },
  hard:   { bg: "bg-rose-500/10 border-rose-500/20",       text: "text-rose-400"    },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  completed:  { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400" },
  generating: { bg: "bg-blue-500/10 border-blue-500/20",       text: "text-blue-400"   },
  pending:    { bg: "bg-white/5 border-white/10",              text: "text-white/40"   },
  failed:     { bg: "bg-rose-500/10 border-rose-500/20",       text: "text-rose-400"   },
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 animate-pulse border-b border-white/5">
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-white/10 rounded w-2/3" />
        <div className="h-2.5 bg-white/5 rounded w-1/3" />
      </div>
      <div className="h-6 w-16 bg-white/5 rounded-md" />
      <div className="h-6 w-20 bg-white/5 rounded-md" />
      <div className="h-8 w-16 bg-white/5 rounded-xl" />
    </div>
  );
}

export default function InstructorDashboardPage() {
  const router = useRouter();

  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ["my-quizzes"],
    queryFn: () => api.get("/api/quizzes", { params: { mine: true } }).then((r) => r.data),
  });

  const completed = quizzes.filter((q) => q.generation_status === "completed");

  const stats = [
    { icon: BookOpen, label: "Total Quizzes", value: quizzes.length, color: "from-blue-500 to-indigo-600", glow: "rgba(99,102,241,0.35)" },
    { icon: TrendingUp, label: "Published", value: completed.length, color: "from-emerald-500 to-teal-600", glow: "rgba(16,185,129,0.35)" },
    { icon: Users, label: "Total Attempts", value: "—", color: "from-violet-500 to-purple-600", glow: "rgba(139,92,246,0.35)" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-900)" }}>
      <AppSidebar role="instructor" />

      {/* Main content offset for sidebar */}
      <div className="ml-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 px-8 py-4 flex items-center justify-between"
          style={{ background: "rgba(8,13,26,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Instructor Dashboard</h1>
            <p className="text-white/35 text-xs mt-0.5">Manage quizzes and track student performance</p>
          </div>
          <Link
            href="/quizzes/generate"
            className="hover-target btn-primary text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Generate Quiz
          </Link>
        </div>

        <main className="px-8 py-8 max-w-6xl space-y-8">
          {/* KPI Cards */}
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {stats.map(({ icon: Icon, label, value, color, glow }) => (
              <motion.div
                key={label}
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="relative rounded-2xl p-6 overflow-hidden gradient-border"
                style={{ background: "var(--surface-800)" }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity animate-shimmer" />
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg transition-transform hover:scale-110`}
                    style={{ boxShadow: `0 0 20px ${glow}` }}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-black text-white tracking-tight mb-1">
                  {isLoading ? <span className="text-white/30">—</span> : value}
                </p>
                <p className="text-sm font-medium text-white/40">{label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Quiz Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <h2 className="font-bold text-white text-lg">My Quizzes</h2>
                <p className="text-white/30 text-xs mt-0.5">{quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""} total</p>
              </div>
              <Link href="/quizzes/generate" className="hover-target text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5" />
                Add new
              </Link>
            </div>

            {isLoading ? (
              <div>{[0, 1, 2].map((i) => <SkeletonRow key={i} />)}</div>
            ) : quizzes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-600/20 border border-blue-500/20 flex items-center justify-center mb-5 text-3xl">🧠</div>
                <p className="text-white font-bold text-lg mb-2">No quizzes yet</p>
                <p className="text-white/30 text-sm mb-8 max-w-xs">Generate your first AI-powered quiz on any topic in under 30 seconds.</p>
                <Link href="/quizzes/generate" className="hover-target btn-primary">
                  <PlusCircle className="w-4 h-4" />
                  Generate Quiz
                </Link>
              </div>
            ) : (
              <div>
                {quizzes.map((quiz, idx) => {
                  const dc = DIFFICULTY_COLORS[quiz.difficulty] ?? { bg: "bg-white/5 border-white/10", text: "text-white/40" };
                  const sc = STATUS_COLORS[quiz.generation_status] ?? { bg: "bg-white/5 border-white/10", text: "text-white/40" };
                  return (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.04 }}
                      className="flex items-center gap-4 px-6 py-4 group cursor-pointer"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onClick={() => router.push(`/quizzes/${quiz.id}`)}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ""; }}
                    >
                      {/* Status indicator */}
                      <div className={`flex-shrink-0 w-1.5 h-10 rounded-full ${quiz.generation_status === "completed" ? "bg-emerald-500" : quiz.generation_status === "generating" ? "bg-blue-500 animate-pulse" : quiz.generation_status === "failed" ? "bg-rose-500" : "bg-white/20"}`} />

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate group-hover:text-blue-300 transition-colors">{quiz.title}</p>
                        <p className="text-xs font-medium text-white/35 mt-0.5 truncate">{quiz.topic}</p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wider ${dc.bg} ${dc.text}`}>
                        {quiz.difficulty}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wider ${sc.bg} ${sc.text}`}>
                        {quiz.generation_status}
                      </span>

                      <Link
                        href={`/quizzes/${quiz.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover-target flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold text-white/50 hover:text-white border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all"
                      >
                        Open
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
