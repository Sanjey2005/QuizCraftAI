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
  Copy, Check, X, School, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
    return <span className="px-2 py-0.5 rounded-[4px] border border-red-500/30 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400">Expired</span>;
  }
  if (available_from || available_until) {
    return <span className="px-2 py-0.5 rounded-[4px] border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400">Scheduled</span>;
  }
  return <span className="px-2 py-0.5 rounded-[4px] border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400">Always On</span>;
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  easy:   { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  medium: { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20" },
  hard:   { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/20" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  completed:  { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  generating: { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/20" },
  pending:    { bg: "bg-white/5",        text: "text-[#A0A0A0]",   border: "border-white/10" },
  failed:     { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/20" },
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 animate-pulse border-b border-[#2A2A2A]">
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-[#2A2A2A] rounded w-1/3" />
        <div className="h-2.5 bg-[#2A2A2A] rounded w-1/4" />
      </div>
      <div className="h-6 w-16 bg-[#2A2A2A] rounded-[4px]" />
      <div className="h-6 w-20 bg-[#2A2A2A] rounded-[4px]" />
      <div className="h-8 w-24 bg-[#2A2A2A] rounded-md" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={handleClose} 
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {createdCode ? "Classroom Created" : "Create Classroom"}
          </h3>
          <button onClick={handleClose} className="p-1.5 rounded-md text-[#555555] hover:text-white hover:bg-[#1A1A1A] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {createdCode ? (
          <div className="text-center py-4">
            <p className="text-[#A0A0A0] text-sm mb-4">Share this code with your students:</p>
            <div className="rounded-lg p-4 mb-6 bg-[#0A0A0A] border border-[#2A2A2A]">
              <p className="text-3xl font-black text-white tracking-[0.3em] font-mono">{createdCode}</p>
            </div>
            <Button
              onClick={copyCode}
              variant={copied ? "outline" : "premium"}
              className="w-full"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied to clipboard" : "Copy Code"}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#A0A0A0]">Classroom Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CS101 — Spring 2026"
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm outline-none transition-all placeholder:text-[#555555] focus:border-white focus:shadow-[0_0_0_2px_rgba(255,255,255,0.1)]"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#A0A0A0]">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the classroom..."
                rows={3}
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm outline-none transition-all resize-none placeholder:text-[#555555] focus:border-white focus:shadow-[0_0_0_2px_rgba(255,255,255,0.1)]"
              />
            </div>
            <Button
              type="submit"
              disabled={!name.trim() || createMutation.isPending}
              className="w-full mt-2"
            >
              {createMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
              ) : "Create Classroom"}
            </Button>
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
    { icon: BookOpen, label: "Total Quizzes", value: quizzes.length, border: "border-t-[3px] border-t-white" },
    { icon: TrendingUp, label: "Published", value: published.length, border: "border-t-[3px] border-t-[#555555]" },
    { icon: School, label: "Classrooms", value: classrooms.length, border: "border-t-[3px] border-t-[#333333]" },
    { icon: Users, label: "Total Students", value: classrooms.reduce((sum, c) => sum + c.member_count, 0), border: "border-t-[3px] border-t-[#222222]" },
  ];

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white" style={{ letterSpacing: "-0.02em" }}>Instructor Dashboard</h1>
          <p className="text-[#A0A0A0] text-sm mt-1">Manage quizzes, classrooms, and track performance across your cohorts.</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === "classrooms" ? (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Classroom
            </Button>
          ) : (
            <Button onClick={() => router.push("/quizzes/generate")}>
              <Plus className="w-4 h-4 mr-2" />
              Generate Quiz
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
      >
        {stats.map(({ icon: Icon, label, value, border }) => (
          <div
            key={label}
            className={cn("rounded-xl p-5 bg-[#111111] border border-[#2A2A2A] shadow-sm flex flex-col items-start gap-4", border)}
          >
            <div className="w-10 h-10 rounded bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-white">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight leading-none mb-1.5">
                {isLoading || classroomsLoading ? <span className="text-[#555555]">—</span> : value}
              </p>
              <p className="text-xs font-medium text-[#A0A0A0]">{label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-[#2A2A2A] mb-6 pb-px">
        <button
          onClick={() => setActiveTab("quizzes")}
          className={cn(
            "px-4 py-3 text-sm font-medium transition-colors relative",
            activeTab === "quizzes" ? "text-white" : "text-[#A0A0A0] hover:text-white"
          )}
        >
          <BookOpen className="w-4 h-4 inline mr-2 -mt-0.5" />
          Quizzes
          {activeTab === "quizzes" && (
            <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-white" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("classrooms")}
          className={cn(
            "px-4 py-3 text-sm font-medium transition-colors relative",
            activeTab === "classrooms" ? "text-white" : "text-[#A0A0A0] hover:text-white"
          )}
        >
          <School className="w-4 h-4 inline mr-2 -mt-0.5" />
          Classrooms
          {activeTab === "classrooms" && (
            <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-white" />
          )}
        </button>
      </div>

      {/* Quizzes Tab */}
      {activeTab === "quizzes" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl overflow-hidden bg-[#111111] border border-[#2A2A2A] shadow-sm"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#2A2A2A]">
            <div>
              <h2 className="font-semibold text-white tracking-tight">Your Quizzes</h2>
              <p className="text-[#555555] text-xs mt-0.5">{quizzes.length} total generated</p>
            </div>
          </div>

          {isLoading ? (
            <div>{[0, 1, 2].map((i) => <SkeletonRow key={i} />)}</div>
          ) : quizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
              <div className="w-16 h-16 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-white mb-6">
                <BookOpen className="w-8 h-8" />
              </div>
              <p className="text-white font-semibold mb-2 tracking-tight">No quizzes yet</p>
              <p className="text-[#A0A0A0] text-sm mb-6 max-w-sm">Use our AI to instantly generate high-quality quizzes. Start by providing a topic or a document.</p>
              <Button onClick={() => router.push("/quizzes/generate")}>
                <Plus className="w-4 h-4 mr-2" />
                Generate First Quiz
              </Button>
            </div>
          ) : (
            <div>
              {quizzes.map((quiz, idx) => {
                const dc = DIFFICULTY_COLORS[quiz.difficulty] ?? { bg: "bg-white/5", text: "text-[#A0A0A0]", border: "border-white/10" };
                const sc = STATUS_COLORS[quiz.generation_status] ?? { bg: "bg-white/5", text: "text-[#A0A0A0]", border: "border-white/10" };
                return (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + idx * 0.03 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 group cursor-pointer border-b border-[#2A2A2A] last:border-0 hover:bg-[#151515] transition-colors"
                    onClick={() => router.push(`/quizzes/${quiz.id}`)}
                  >
                    <div className={`hidden sm:block flex-shrink-0 w-1.5 h-10 rounded-full ${quiz.generation_status === "completed" ? "bg-white" : quiz.generation_status === "generating" ? "bg-[#555555] animate-pulse" : quiz.generation_status === "failed" ? "bg-red-500" : "bg-[#2A2A2A]"}`} />
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate transition-colors group-hover:underline underline-offset-4">{quiz.title}</p>
                      <p className="text-xs text-[#555555] mt-1 truncate">{quiz.topic}</p>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                       <span className={cn("px-2 py-0.5 rounded-[4px] border text-[10px] font-bold uppercase tracking-wider flex-shrink-0", dc.bg, dc.text, dc.border)}>
                        {quiz.difficulty}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-[4px] border text-[10px] font-bold uppercase tracking-wider flex-shrink-0", sc.bg, sc.text, sc.border)}>
                        {quiz.generation_status}
                      </span>
                      <AvailabilityBadge available_from={quiz.available_from} available_until={quiz.available_until} />
                    </div>

                    <p className="text-xs text-[#555555] flex-shrink-0 w-24 sm:text-right hidden md:block font-mono">
                      {new Date(quiz.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>

                    <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/quizzes/${quiz.id}/edit`}
                        className="p-2 rounded-md border border-[#2A2A2A] bg-[#0A0A0A] text-[#A0A0A0] hover:text-white hover:border-white transition-all group/btn">
                        <Pencil className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                      </Link>
                      <Link href={`/analytics/quiz/${quiz.id}`}
                        className="p-2 rounded-md border border-[#2A2A2A] bg-[#0A0A0A] text-[#A0A0A0] hover:text-white hover:border-white transition-all group/btn">
                        <BarChart2 className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                      </Link>
                      <button
                        onClick={() => { if (confirm("Delete this quiz?")) deleteMutation.mutate(quiz.id); }}
                        className="p-2 rounded-md border border-[#2A2A2A] bg-[#0A0A0A] text-[#A0A0A0] hover:text-red-400 hover:border-red-500/30 transition-all group/btn">
                        <Trash2 className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {classroomsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-xl p-6 animate-pulse bg-[#111111] border border-[#2A2A2A] shadow-sm">
                  <div className="h-5 bg-[#2A2A2A] rounded w-1/2 mb-4" />
                  <div className="h-4 bg-[#2A2A2A] rounded w-full mb-2" />
                  <div className="h-4 bg-[#2A2A2A] rounded w-2/3 mt-6" />
                </div>
              ))}
            </div>
          ) : classrooms.length === 0 ? (
            <div className="rounded-xl overflow-hidden bg-[#111111] border border-[#2A2A2A] shadow-sm">
              <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <div className="w-16 h-16 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-white mb-6">
                  <School className="w-8 h-8" />
                </div>
                <p className="text-white font-semibold tracking-tight mb-2">No classrooms found</p>
                <p className="text-[#A0A0A0] text-sm mb-6 max-w-sm">Create a classroom to assign quizzes, invite students via code, and track cohort analytics.</p>
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Classroom
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      {createModalOpen && <CreateClassroomModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />}
    </PageWrapper>
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
      transition={{ delay: 0.05 + idx * 0.05 }}
      whileHover={{ y: -4 }}
      className="rounded-xl overflow-hidden bg-[#111111] border border-[#2A2A2A] shadow-sm cursor-pointer group transition-all hover:border-[#555555]"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="font-semibold text-white text-base truncate transition-colors group-hover:underline underline-offset-4 tracking-tight">
              {classroom.name}
            </h3>
            {classroom.description && (
              <p className="text-xs text-[#555555] mt-1 line-clamp-2 leading-relaxed">{classroom.description}</p>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(classroom.id); }}
            className="p-1.5 rounded-md text-[#555555] hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mb-2">
           <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#1A1A1A] border border-[#2A2A2A] hover:border-white transition-colors group/code"
            onClick={copyCode}
          >
            <span className="text-sm font-black text-white tracking-[0.2em] font-mono">{classroom.code}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-white" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#555555] group-hover/code:text-white transition-colors" />
            )}
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 bg-[#0A0A0A] border-t border-[#2A2A2A] flex items-center justify-between text-[#A0A0A0] text-xs font-medium">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {classroom.member_count} Student{classroom.member_count !== 1 ? "s" : ""}
        </span>
        <span className="font-mono text-[#555555]">
          {new Date(classroom.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
    </motion.div>
  );
}
