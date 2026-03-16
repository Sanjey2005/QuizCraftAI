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
  ArrowLeft, Copy, Check, Users, Trash2, BookOpen, LogOut, Plus, X, Play, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  easy:   { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  medium: { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20" },
  hard:   { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/20" },
};

const AVATAR_COLORS = [
  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-[#1A1A1A] border border-white/30 rounded-2xl p-6 flex flex-col max-h-[85vh] shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white tracking-tight">Assign Quizzes</h3>
          <button onClick={onClose} className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-[#1A1A1A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-white/80 text-sm mb-6">Select the published quizzes you want to assign to this classroom.</p>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2 mb-6">
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 bg-[#1A1A1A] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : eligible.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-white/30 rounded-xl">
              <BookOpen className="w-10 h-10 text-white/60 mx-auto mb-3" />
              <p className="text-white/80 text-sm font-medium">No published quizzes yet.</p>
              <p className="text-white/60 text-xs mt-1">Publish a quiz from your dashboard first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {eligible.map((quiz) => {
                const checked = selected.has(quiz.id);
                const dc = DIFFICULTY_COLORS[quiz.difficulty] ?? { bg: "bg-white/5", text: "text-white/80", border: "border-white/10" };
                return (
                  <label
                    key={quiz.id}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all border",
                      checked 
                        ? "bg-[#1A1A1A] border-white" 
                        : "bg-transparent border-white/30 hover:border-white/40 hover:bg-white/5"
                    )}
                  >
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={checked} 
                      onChange={(e) => {
                        const newSet = new Set(selected);
                        if (e.target.checked) newSet.add(quiz.id);
                        else newSet.delete(quiz.id);
                        setSelected(newSet);
                      }} 
                    />
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                      checked ? "bg-white border-white" : "border-white/40"
                    )}>
                      {checked && <Check className="w-3.5 h-3.5 text-black" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold truncate transition-colors", checked ? "text-white" : "text-white/80")}>{quiz.title}</p>
                      <p className="text-xs text-white/60 truncate mt-0.5">{quiz.topic}</p>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-[4px] border text-[10px] font-bold uppercase tracking-wider flex-shrink-0", dc.bg, dc.text, dc.border)}>
                      {quiz.difficulty}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/30">
          <p className="text-sm font-medium text-white/60">{selected.size} selected</p>
          <div className="flex gap-3">
             <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving</>
              ) : "Save Changes"}
            </Button>
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
      <PageWrapper>
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 bg-[#2A2A2A] rounded-lg" />
          <div className="h-32 bg-[#1A1A1A] border border-white/30 rounded-2xl" />
          <div className="h-64 bg-[#1A1A1A] border border-white/30 rounded-2xl" />
        </div>
      </PageWrapper>
    );
  }

  if (!classroom) {
    return (
      <PageWrapper>
        <div className="py-20 text-center">
           <p className="text-white/80">Classroom not found or you don't have access.</p>
           <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>Return Home</Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <>
      <PageWrapper>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start gap-4 mb-10 justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.push(isTeacher ? "/dashboard/instructor" : "/dashboard/student")}
              className="mt-1 p-2 rounded-lg text-white/60 border border-transparent hover:border-white/30 hover:bg-[#1A1A1A] hover:text-white transition-all group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
                {classroom.name}
              </h1>
              {classroom.description && (
                <p className="text-white/80 text-sm leading-relaxed max-w-2xl">{classroom.description}</p>
              )}
            </div>
          </div>
          
          {!isTeacher && (
             <Button
                variant="danger"
                onClick={() => { if (confirm("Leave this classroom? You will lose access to its quizzes.")) leaveMutation.mutate(); }}
             >
                <LogOut className="w-4 h-4 mr-2" />
                Leave Classroom
             </Button>
          )}
        </div>

        {/* Info Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Code Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1A1A1A] rounded-xl border border-white/30 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
               <p className="text-xs font-semibold text-white/60 uppercase tracking-widest">Classroom Code</p>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-4">
               <p className="text-5xl font-black text-white tracking-[0.2em] font-mono leading-none">{classroom.code}</p>
               <Button
                 variant={copied ? "outline" : "premium"}
                 onClick={copyCode}
                 className="flex-shrink-0"
               >
                 {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                 {copied ? "Copied" : "Copy"}
               </Button>
            </div>
          </motion.div>

          {/* Stats Card */}
          <motion.div
             initial={{ opacity: 0, y: 16 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="bg-[#1A1A1A] rounded-xl border border-white/30 shadow-sm p-6 flex flex-col justify-between"
          >
             <div>
               <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4">Overview</p>
               <div className="flex items-center gap-6">
                 <div>
                   <p className="text-3xl font-bold text-white mb-1">{classroom.member_count}</p>
                   <p className="text-sm text-white/80">Students enrolled</p>
                 </div>
                 <div className="w-px h-12 bg-[#2A2A2A]" />
                 <div>
                   <p className="text-3xl font-bold text-white mb-1">{classroomQuizzes.length}</p>
                   <p className="text-sm text-white/80">Quizzes assigned</p>
                 </div>
               </div>
             </div>
             <p className="text-xs font-mono text-white/60 mt-4">
                 Created {new Date(classroom.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
             </p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Column - Quizzes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assigned Quizzes — teacher view */}
            {isTeacher && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-[#1A1A1A] rounded-xl border border-white/30 shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/30">
                  <div>
                    <h2 className="font-bold text-white tracking-tight">Assigned Quizzes</h2>
                  </div>
                  <Button variant="outline" onClick={() => setAssignModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Assign
                  </Button>
                </div>

                {classroomQuizzes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <BookOpen className="w-8 h-8 text-white/60 mb-4" />
                    <p className="text-white font-medium">No quizzes assigned</p>
                    <p className="text-white/80 text-sm mt-1 mb-6">Assign a published quiz from your collection.</p>
                     <Button onClick={() => setAssignModalOpen(true)}>Assign a Quiz</Button>
                  </div>
                ) : (
                  <div>
                    {classroomQuizzes.map((quiz, idx) => {
                      const dc = DIFFICULTY_COLORS[quiz.difficulty] ?? { bg: "bg-white/5", text: "text-white/80", border: "border-white/10" };
                      return (
                        <motion.div
                          key={quiz.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + idx * 0.04 }}
                          className="flex items-center gap-4 px-6 py-4 border-b border-white/30 last:border-0 hover:bg-[#151515] transition-colors group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{quiz.title}</p>
                            <p className="text-xs text-white/60 mt-1 truncate">{quiz.topic}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <span className={cn("px-2 py-0.5 rounded-[4px] border text-[10px] font-bold uppercase tracking-wider flex-shrink-0 hidden sm:inline-block", dc.bg, dc.text, dc.border)}>
                               {quiz.difficulty}
                             </span>
                             {quiz.question_count != null && (
                               <span className="text-xs font-mono text-white/80 bg-[#1A1A1A] px-2 py-0.5 rounded border border-white/30">
                                 {quiz.question_count}q
                               </span>
                             )}
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/quizzes/${quiz.id}/edit`}
                              className="p-1.5 rounded-md text-white/80 hover:text-white hover:bg-[#2A2A2A] transition-all"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => {
                                if (confirm("Remove this quiz from the classroom?"))
                                  removeQuizMutation.mutate(quiz.id);
                              }}
                              className="p-1.5 rounded-md text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
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
                className="bg-[#1A1A1A] rounded-xl border border-white/30 shadow-sm overflow-hidden"
              >
                <div className="px-6 py-5 border-b border-white/30">
                  <h2 className="font-bold text-white tracking-tight">Available Quizzes</h2>
                </div>

                {classroomQuizzes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <BookOpen className="w-8 h-8 text-white/60 mb-4" />
                    <p className="text-white font-medium">No quizzes assigned yet.</p>
                    <p className="text-white/80 text-sm mt-1">Check back later when your instructor assigns new material.</p>
                  </div>
                ) : (
                  <div>
                    {classroomQuizzes.map((quiz, idx) => {
                      const dc = DIFFICULTY_COLORS[quiz.difficulty] ?? { bg: "bg-white/5", text: "text-white/80", border: "border-white/10" };
                      return (
                        <motion.div
                          key={quiz.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + idx * 0.04 }}
                          className="flex items-center gap-4 px-6 py-5 border-b border-white/30 last:border-0 hover:bg-[#151515] transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-base truncate mb-1">{quiz.title}</p>
                            <p className="text-sm text-white/80 truncate">{quiz.topic}</p>
                            {(quiz.available_from || quiz.available_until) && (
                              <p className="text-xs font-mono text-white/60 mt-2">
                                {quiz.available_from && `From ${new Date(quiz.available_from).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
                                {quiz.available_from && quiz.available_until && " · "}
                                {quiz.available_until && `Until ${new Date(quiz.available_until).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end gap-3 flex-shrink-0">
                            <div className="flex items-center gap-2">
                               <span className={cn("px-2 py-0.5 rounded-[4px] border text-[10px] font-bold uppercase tracking-wider flex-shrink-0", dc.bg, dc.text, dc.border)}>
                                {quiz.difficulty}
                              </span>
                              {quiz.question_count != null && (
                                <span className="text-xs font-mono text-white/80 bg-[#1A1A1A] px-2 py-0.5 rounded border border-white/30">
                                  {quiz.question_count}q
                                </span>
                              )}
                            </div>
                            <Button onClick={() => router.push(`/quizzes/${quiz.id}`)}>
                              <Play className="w-3.5 h-3.5 mr-2" /> Start Quiz
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
             {/* Members List */}
             {isTeacher && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#1A1A1A] rounded-xl border border-white/30 shadow-sm overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-white/30">
                    <h2 className="font-bold text-white tracking-tight text-sm">Roster</h2>
                  </div>

                  {classroom.members.length === 0 ? (
                    <div className="py-10 text-center px-4">
                      <Users className="w-6 h-6 text-white/60 mx-auto mb-3" />
                      <p className="text-white/80 text-sm">No students enrolled</p>
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                      {classroom.members.map((member, idx) => (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + idx * 0.03 }}
                          className="flex items-center justify-between px-5 py-3 border-b border-white/20 last:border-0 hover:bg-[#151515] transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn("w-7 h-7 rounded border flex items-center justify-center text-xs font-bold flex-shrink-0", AVATAR_COLORS[idx % AVATAR_COLORS.length])}>
                              {member.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 pr-2">
                              <p className="text-sm font-semibold text-white truncate">{member.username}</p>
                              <p className="text-[10px] text-white/60 uppercase tracking-wider font-mono">
                                {new Date(member.joined_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm(`Remove ${member.username}?`)) removeMemberMutation.mutate(member.id);
                            }}
                            className="p-1.5 rounded-md text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
             )}
          </div>
        </div>

      </PageWrapper>

      <AssignQuizModal
        open={assignModalOpen}
        classroomId={id as string}
        assignedQuizIds={assignedQuizIds}
        onClose={() => setAssignModalOpen(false)}
      />
    </>
  );
}
