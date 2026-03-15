"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import {
  BookOpen, TrendingUp, Users, BarChart2, Plus, Pencil, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  generation_status: "pending" | "generating" | "completed" | "failed";
  is_published?: boolean;
  question_count?: number;
  created_at: string;
  available_from: string | null;
  available_until: string | null;
}

function AvailabilityBadge({ available_from, available_until }: { available_from: string | null; available_until: string | null }) {
  const now = new Date();
  if (available_until && new Date(available_until) < now) {
    return <span className="px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wider flex-shrink-0 bg-rose-500/10 border-rose-500/20 text-rose-400">Expired</span>;
  }
  if (available_from || available_until) {
    return <span className="px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wider flex-shrink-0 bg-blue-500/10 border-blue-500/20 text-blue-400">Scheduled</span>;
  }
  return <span className="px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wider flex-shrink-0 bg-emerald-500/10 border-emerald-500/20 text-emerald-400">Always On</span>;
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  easy:   { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400" },
  medium: { bg: "bg-amber-500/10 border-amber-500/20",     text: "text-amber-400" },
  hard:   { bg: "bg-rose-500/10 border-rose-500/20",       text: "text-rose-400" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  completed:  { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400" },
  generating: { bg: "bg-blue-500/10 border-blue-500/20",       text: "text-blue-400" },
  pending:    { bg: "bg-white/5 border-white/10",              text: "text-white/30" },
  failed:     { bg: "bg-rose-500/10 border-rose-500/20",       text: "text-rose-400" },
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 animate-pulse border-b border-white/5">
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-white/10 rounded w-2/3" />
        <div className="h-2.5 bg-white/5 rounded w-1/3" />
      </div>
      <div className="h-6 w-16 bg-white/5 rounded-lg" />
      <div className="h-6 w-20 bg-white/5 rounded-lg" />
      <div className="h-8 w-20 bg-white/5 rounded-xl" />
    </div>
  );
}

export default function InstructorDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ["my-quizzes"],
    queryFn: () => api.get("/api/quizzes", { params: { mine: true } }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/quizzes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-quizzes"] }),
  });

  const published = quizzes.filter((q) => q.is_published);

  const stats = [
    { icon: BookOpen, label: "Total Quizzes", value: quizzes.length, color: "from-blue-500 to-indigo-600", glow: "rgba(99,102,241,0.35)" },
    { icon: TrendingUp, label: "Published", value: published.length, color: "from-emerald-500 to-teal-600", glow: "rgba(16,185,129,0.35)" },
    { icon: Users, label: "Total Attempts", value: "—", color: "from-violet-500 to-purple-600", glow: "rgba(139,92,246,0.35)" },
    { icon: BarChart2, label: "Avg Score", value: "—", color: "from-amber-500 to-orange-500", glow: "rgba(245,158,11,0.35)" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-900)" }}>
      <PageWrapper>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">My Quizzes</h1>
            <p className="text-white/35 text-sm mt-0.5">Manage quizzes and track student performance</p>
          </div>
          <Link href="/quizzes/generate" className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            Generate with AI
          </Link>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {stats.map(({ icon: Icon, label, value, color, glow }) => (
            <div
              key={label}
              className="rounded-2xl p-5 gradient-border"
              style={{ background: "var(--surface-800)" }}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}
                style={{ boxShadow: `0 0 16px ${glow}` }}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-black text-white tracking-tight">
                {isLoading ? <span className="text-white/25">—</span> : value}
              </p>
              <p className="text-xs font-medium text-white/35 mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Quiz Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div>
              <h2 className="font-bold text-white text-lg">All Quizzes</h2>
              <p className="text-white/30 text-xs mt-0.5">{quizzes.length} total</p>
            </div>
          </div>

          {isLoading ? (
            <div>{[0, 1, 2].map((i) => <SkeletonRow key={i} />)}</div>
          ) : quizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-600/20 border border-blue-500/20 flex items-center justify-center mb-4 text-3xl">🧠</div>
              <p className="text-white font-bold text-lg mb-2">No quizzes yet</p>
              <p className="text-white/30 text-sm mb-6 max-w-xs">Generate your first AI-powered quiz in under 30 seconds.</p>
              <Link href="/quizzes/generate" className="btn-primary">
                <Plus className="w-4 h-4" />
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
                    transition={{ delay: 0.15 + idx * 0.04 }}
                    className="flex items-center gap-4 px-6 py-4 group cursor-pointer"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    onClick={() => router.push(`/quizzes/${quiz.id}`)}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ""; }}
                  >
                    <div className={`flex-shrink-0 w-1.5 h-10 rounded-full ${quiz.generation_status === "completed" ? "bg-emerald-500" : quiz.generation_status === "generating" ? "bg-blue-500 animate-pulse" : quiz.generation_status === "failed" ? "bg-rose-500" : "bg-white/20"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate group-hover:text-blue-300 transition-colors">{quiz.title}</p>
                      <p className="text-xs text-white/30 mt-0.5 truncate">{quiz.topic}</p>
                    </div>
                    <span className={cn("px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wider flex-shrink-0", dc.bg, dc.text)}>
                      {quiz.difficulty}
                    </span>
                    <span className={cn("px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wider flex-shrink-0", sc.bg, sc.text)}>
                      {quiz.generation_status}
                    </span>
                    <AvailabilityBadge available_from={quiz.available_from} available_until={quiz.available_until} />
                    <p className="text-xs text-white/25 flex-shrink-0 hidden lg:block">
                      {new Date(quiz.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/quizzes/${quiz.id}/edit`}
                        className="p-2 rounded-lg text-white/25 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                      <Link href={`/analytics/quiz/${quiz.id}`}
                        className="p-2 rounded-lg text-white/25 hover:text-violet-400 hover:bg-violet-500/10 transition-all">
                        <BarChart2 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => { if (confirm("Delete this quiz?")) deleteMutation.mutate(quiz.id); }}
                        className="p-2 rounded-lg text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </PageWrapper>
    </div>
  );
}
