"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/hooks";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import {
  ArrowLeft, Copy, Check, Users, Trash2, BookOpen, LogOut, Plus, X, Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  username: string;
  joined_at: string;
}

interface ClassroomDetail {
  id: string;
  name: string;
  description: string;
  code: string;
  teacher_username: string;
  member_count: number;
  members: Member[];
  created_at: string;
  is_active: boolean;
}

interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  question_count?: number;
  is_published: boolean;
  generation_status: string;
  available_from: string | null;
  available_until: string | null;
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  easy:   { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400" },
  medium: { bg: "bg-amber-500/10 border-amber-500/20",     text: "text-amber-400" },
  hard:   { bg: "bg-rose-500/10 border-rose-500/20",       text: "text-rose-400" },
};

function AssignQuizModal({
  open,
  classroomId,
  assignedQuizIds,
  onClose,
}: {
  open: boolean;
  classroomId: string;
  assignedQuizIds: Set<string>;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set(assignedQuizIds));
  const [saving, setSaving] = useState(false);

  // Reset selection whenever modal opens
  useEffect(() => {
    if (open) setSelected(new Set(assignedQuizIds));
  }, [open, assignedQuizIds]);

  const { data: myQuizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ["my-quizzes"],
    queryFn: () => api.get("/api/quizzes", { params: { mine: true } }).then((r) => r.data),
    enabled: open,
  });

  const eligible = myQuizzes.filter(
    (q) => q.is_published && q.generation_status === "completed"
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toAssign = [...selected].filter((id) => !assignedQuizIds.has(id));
      const toRemove = [...assignedQuizIds].filter((id) => !selected.has(id));

      await Promise.all([
        ...toAssign.map((quiz_id) =>
          api.post(`/api/classrooms/${classroomId}/assign-quiz`, { quiz_id })
        ),
        ...toRemove.map((quiz_id) =>
          api.delete(`/api/classrooms/${classroomId}/remove-quiz`, { data: { quiz_id } })
        ),
      ]);

      queryClient.invalidateQueries({ queryKey: ["classroom-quizzes", classroomId] });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg rounded-2xl flex flex-col max-h-[80vh]"
        style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="text-lg font-bold text-white">Assign Quizzes</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : eligible.length === 0 ? (
            <div className="py-10 text-center">
              <BookOpen className="w-10 h-10 text-white/15 mx-auto mb-3" />
              <p className="text-white/40 text-sm font-medium">No published quizzes yet</p>
              <p className="text-white/25 text-xs mt-1">Publish a quiz first to assign it here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {eligible.map((quiz) => {
                const checked = selected.has(quiz.id);
                const dc = DIFFICULTY_COLORS[quiz.difficulty] ?? { bg: "bg-white/5 border-white/10", text: "text-white/40" };
                return (
                  <label
                    key={quiz.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all",
                      checked ? "bg-blue-500/10 border border-blue-500/20" : "hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(quiz.id)}
                      className="w-4 h-4 rounded accent-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{quiz.title}</p>
                      <p className="text-xs text-white/30 truncate">{quiz.topic}</p>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider flex-shrink-0", dc.bg, dc.text)}>
                      {quiz.difficulty}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs text-white/30">{selected.size} selected</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-sm disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ClassroomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    if (u) setUserRole(u.role);
  }, []);

  const { data: classroom, isLoading } = useQuery<ClassroomDetail>({
    queryKey: ["classroom", id],
    queryFn: () => api.get(`/api/classrooms/${id}`).then((r) => r.data),
  });

  const { data: classroomQuizzes = [] } = useQuery<Quiz[]>({
    queryKey: ["classroom-quizzes", id],
    queryFn: () => api.get(`/api/classrooms/${id}/quizzes`).then((r) => r.data),
    enabled: !!id,
  });

  const removeMemberMutation = useMutation({
    mutationFn: (membershipId: string) =>
      api.delete(`/api/classrooms/${id}/members/${membershipId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classroom", id] }),
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.post(`/api/classrooms/${id}/leave`),
    onSuccess: () => router.push("/dashboard/student"),
  });

  const removeQuizMutation = useMutation({
    mutationFn: (quiz_id: string) =>
      api.delete(`/api/classrooms/${id}/remove-quiz`, { data: { quiz_id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classroom-quizzes", id] }),
  });

  const copyCode = () => {
    if (!classroom) return;
    navigator.clipboard.writeText(classroom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isTeacher = userRole === "instructor";
  const assignedQuizIds = new Set(classroomQuizzes.map((q) => q.id));

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--surface-900)" }}>
        <PageWrapper>
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-white/10 rounded" />
            <div className="h-32 bg-white/5 rounded-2xl" />
            <div className="h-64 bg-white/5 rounded-2xl" />
          </div>
        </PageWrapper>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen" style={{ background: "var(--surface-900)" }}>
        <PageWrapper>
          <p className="text-white/40">Classroom not found.</p>
        </PageWrapper>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-900)" }}>
      <PageWrapper>
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push(isTeacher ? "/dashboard/instructor" : "/dashboard/student")}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{classroom.name}</h1>
            {classroom.description && (
              <p className="text-white/35 text-sm mt-0.5">{classroom.description}</p>
            )}
          </div>
          {!isTeacher && (
            <button
              onClick={() => { if (confirm("Leave this classroom?")) leaveMutation.mutate(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Leave
            </button>
          )}
        </div>

        {/* Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 mb-6 gradient-border"
          style={{ background: "var(--surface-800)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white/35 uppercase tracking-wider mb-2">Classroom Code</p>
              <p className="text-3xl font-black text-white tracking-[0.3em] font-mono">{classroom.code}</p>
            </div>
            <button
              onClick={copyCode}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                copied
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
          <div className="flex items-center gap-6 mt-4 text-xs text-white/30">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {classroom.member_count} member{classroom.member_count !== 1 ? "s" : ""}
            </span>
            <span>
              Created {new Date(classroom.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </motion.div>

        {/* Members — teacher only */}
        {isTeacher && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl overflow-hidden mb-6"
            style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <h2 className="font-bold text-white text-lg">Members</h2>
              <p className="text-white/30 text-xs mt-0.5">{classroom.member_count} student{classroom.member_count !== 1 ? "s" : ""} enrolled</p>
            </div>

            {classroom.members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <Users className="w-10 h-10 text-white/15 mb-3" />
                <p className="text-white/40 font-medium text-sm">No students yet</p>
                <p className="text-white/25 text-xs mt-1">Share the classroom code with your students</p>
              </div>
            ) : (
              <div>
                {classroom.members.map((member, idx) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + idx * 0.03 }}
                    className="flex items-center gap-4 px-6 py-3.5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white/80">{member.username}</p>
                      <p className="text-xs text-white/25">
                        Joined {new Date(member.joined_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${member.username}?`)) removeMemberMutation.mutate(member.id);
                      }}
                      className="p-2 rounded-lg text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Assigned Quizzes — teacher manage */}
        {isTeacher && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <h2 className="font-bold text-white text-lg">Assigned Quizzes</h2>
                <p className="text-white/30 text-xs mt-0.5">{classroomQuizzes.length} quiz{classroomQuizzes.length !== 1 ? "zes" : ""} assigned</p>
              </div>
              <button
                onClick={() => setAssignModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-blue-400 border border-blue-500/20 hover:bg-blue-500/10 transition-all"
              >
                <Plus className="w-4 h-4" />
                Assign Quiz
              </button>
            </div>

            {classroomQuizzes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <BookOpen className="w-10 h-10 text-white/15 mb-3" />
                <p className="text-white/40 font-medium text-sm">No quizzes assigned yet</p>
                <p className="text-white/25 text-xs mt-1">Click "Assign Quiz" to add published quizzes</p>
              </div>
            ) : (
              <div>
                {classroomQuizzes.map((quiz, idx) => {
                  const dc = DIFFICULTY_COLORS[quiz.difficulty] ?? { bg: "bg-white/5 border-white/10", text: "text-white/40" };
                  return (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.04 }}
                      className="flex items-center gap-4 px-6 py-4"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{quiz.title}</p>
                        <p className="text-xs text-white/30 mt-0.5 truncate">{quiz.topic}</p>
                      </div>
                      <span className={cn("px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wider flex-shrink-0", dc.bg, dc.text)}>
                        {quiz.difficulty}
                      </span>
                      {quiz.question_count != null && (
                        <span className="text-xs text-white/25 flex-shrink-0 hidden sm:block">
                          {quiz.question_count}q
                        </span>
                      )}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link
                          href={`/quizzes/${quiz.id}/edit`}
                          className="p-2 rounded-lg text-white/25 hover:text-blue-400 hover:bg-blue-500/10 transition-all text-xs font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm("Remove this quiz from the classroom?"))
                              removeQuizMutation.mutate(quiz.id);
                          }}
                          className="p-2 rounded-lg text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        >
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

        {/* Assigned Quizzes — student view */}
        {!isTeacher && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <h2 className="font-bold text-white text-lg">Quizzes</h2>
              <p className="text-white/30 text-xs mt-0.5">{classroomQuizzes.length} available quiz{classroomQuizzes.length !== 1 ? "zes" : ""}</p>
            </div>

            {classroomQuizzes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <BookOpen className="w-10 h-10 text-white/15 mb-3" />
                <p className="text-white/40 font-medium text-sm">No quizzes assigned yet</p>
                <p className="text-white/25 text-xs mt-1">Your instructor will assign quizzes here</p>
              </div>
            ) : (
              <div>
                {classroomQuizzes.map((quiz, idx) => {
                  const dc = DIFFICULTY_COLORS[quiz.difficulty] ?? { bg: "bg-white/5 border-white/10", text: "text-white/40" };
                  return (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + idx * 0.04 }}
                      className="flex items-center gap-4 px-6 py-4"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{quiz.title}</p>
                        <p className="text-xs text-white/30 mt-0.5 truncate">{quiz.topic}</p>
                        {(quiz.available_from || quiz.available_until) && (
                          <p className="text-[11px] text-white/20 mt-0.5">
                            {quiz.available_from && `From ${new Date(quiz.available_from).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
                            {quiz.available_from && quiz.available_until && " · "}
                            {quiz.available_until && `Until ${new Date(quiz.available_until).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
                          </p>
                        )}
                      </div>
                      <span className={cn("px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wider flex-shrink-0", dc.bg, dc.text)}>
                        {quiz.difficulty}
                      </span>
                      {quiz.question_count != null && (
                        <span className="text-xs text-white/25 flex-shrink-0 hidden sm:block">
                          {quiz.question_count}q
                        </span>
                      )}
                      <Link
                        href={`/quizzes/${quiz.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all flex-shrink-0"
                      >
                        <Play className="w-3 h-3" />
                        Start
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </PageWrapper>

      <AssignQuizModal
        open={assignModalOpen}
        classroomId={id as string}
        assignedQuizIds={assignedQuizIds}
        onClose={() => setAssignModalOpen(false)}
      />
    </div>
  );
}
