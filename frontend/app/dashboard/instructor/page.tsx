"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, TrendingUp, Users, BarChart2, Plus, Pencil, Trash2,
  Copy, Check, X, School,
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

interface Classroom {
  id: string;
  name: string;
  description: string;
  code: string;
  teacher_username: string;
  member_count: number;
  created_at: string;
  is_active: boolean;
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

function CreateClassroomModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      api.post<Classroom>("/api/classrooms", data).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-classrooms"] });
      setCreatedCode(data.code);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), description: description.trim() });
  };

  const copyCode = () => {
    if (!createdCode) return;
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setCreatedCode(null);
    setCopied(false);
    createMutation.reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md rounded-2xl p-6"
        style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">
            {createdCode ? "Classroom Created!" : "Create Classroom"}
          </h3>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {createdCode ? (
          <div className="text-center py-4">
            <p className="text-white/40 text-sm mb-4">Share this code with your students:</p>
            <div className="rounded-xl p-4 mb-4" style={{ background: "var(--surface-900)" }}>
              <p className="text-3xl font-black text-white tracking-[0.3em] font-mono">{createdCode}</p>
            </div>
            <button
              onClick={copyCode}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                copied
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
              )}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CS101 — Spring 2026"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-blue-500/40 transition-all"
                style={{ background: "var(--surface-900)", border: "1px solid rgba(255,255,255,0.08)" }}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the classroom..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-blue-500/40 transition-all resize-none"
                style={{ background: "var(--surface-900)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            </div>
            <button
              type="submit"
              disabled={!name.trim() || createMutation.isPending}
              className="w-full btn-primary text-sm justify-center disabled:opacity-40"
            >
              {createMutation.isPending ? "Creating..." : "Create Classroom"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function InstructorDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"quizzes" | "classrooms">("quizzes");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ["my-quizzes"],
    queryFn: () => api.get("/api/quizzes", { params: { mine: true } }).then((r) => r.data),
  });

  const { data: classrooms = [], isLoading: classroomsLoading } = useQuery<Classroom[]>({
    queryKey: ["my-classrooms"],
    queryFn: () => api.get("/api/classrooms").then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/quizzes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-quizzes"] }),
  });

  const deleteClassroomMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/classrooms/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-classrooms"] }),
  });

  const published = quizzes.filter((q) => q.is_published);

  const stats = [
    { icon: BookOpen, label: "Total Quizzes", value: quizzes.length, color: "from-blue-500 to-indigo-600", glow: "rgba(99,102,241,0.35)" },
    { icon: TrendingUp, label: "Published", value: published.length, color: "from-emerald-500 to-teal-600", glow: "rgba(16,185,129,0.35)" },
    { icon: School, label: "Classrooms", value: classrooms.length, color: "from-violet-500 to-purple-600", glow: "rgba(139,92,246,0.35)" },
    { icon: Users, label: "Total Students", value: classrooms.reduce((sum, c) => sum + c.member_count, 0), color: "from-amber-500 to-orange-500", glow: "rgba(245,158,11,0.35)" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-900)" }}>
      <PageWrapper>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Instructor Dashboard</h1>
            <p className="text-white/35 text-sm mt-0.5">Manage quizzes, classrooms, and track performance</p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "classrooms" ? (
              <button onClick={() => setCreateModalOpen(true)} className="btn-primary text-sm">
                <Plus className="w-4 h-4" />
                Create Classroom
              </button>
            ) : (
              <Link href="/quizzes/generate" className="btn-primary text-sm">
                <Plus className="w-4 h-4" />
                Generate with AI
              </Link>
            )}
          </div>
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
                {isLoading || classroomsLoading ? <span className="text-white/25">—</span> : value}
              </p>
              <p className="text-xs font-medium text-white/35 mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => setActiveTab("quizzes")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              activeTab === "quizzes"
                ? "bg-blue-500/15 text-blue-400"
                : "text-white/35 hover:text-white/60"
            )}
          >
            <BookOpen className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Quizzes
          </button>
          <button
            onClick={() => setActiveTab("classrooms")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              activeTab === "classrooms"
                ? "bg-violet-500/15 text-violet-400"
                : "text-white/35 hover:text-white/60"
            )}
          >
            <School className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Classrooms
          </button>
        </div>

        {/* Quizzes Tab */}
        {activeTab === "quizzes" && (
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
        )}

        {/* Classrooms Tab */}
        {activeTab === "classrooms" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
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
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center mb-4">
                    <School className="w-8 h-8 text-violet-400" />
                  </div>
                  <p className="text-white font-bold text-lg mb-2">No classrooms yet</p>
                  <p className="text-white/30 text-sm mb-6 max-w-xs">Create a classroom and share the code with your students.</p>
                  <button onClick={() => setCreateModalOpen(true)} className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Create Classroom
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {classrooms.map((classroom, idx) => (
                  <ClassroomCard
                    key={classroom.id}
                    classroom={classroom}
                    idx={idx}
                    onDelete={(id) => {
                      if (confirm("Deactivate this classroom?")) deleteClassroomMutation.mutate(id);
                    }}
                    onClick={() => router.push(`/classrooms/${classroom.id}`)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        <CreateClassroomModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
      </PageWrapper>
    </div>
  );
}

function ClassroomCard({ classroom, idx, onDelete, onClick }: {
  classroom: Classroom;
  idx: number;
  onDelete: (id: string) => void;
  onClick: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(classroom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + idx * 0.05 }}
      className="rounded-2xl p-5 cursor-pointer group transition-all hover:scale-[1.01]"
      style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-base truncate group-hover:text-violet-300 transition-colors">
            {classroom.name}
          </p>
          {classroom.description && (
            <p className="text-xs text-white/30 mt-0.5 truncate">{classroom.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onDelete(classroom.id)}
            className="p-1.5 rounded-lg text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
          style={{ background: "var(--surface-900)", border: "1px solid rgba(255,255,255,0.06)" }}
          onClick={copyCode}
        >
          <span className="text-lg font-black text-white tracking-[0.2em] font-mono">{classroom.code}</span>
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-white/30 group-hover:text-white/50" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-white/30">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {classroom.member_count} student{classroom.member_count !== 1 ? "s" : ""}
        </span>
        <span>
          {new Date(classroom.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>
    </motion.div>
  );
}
