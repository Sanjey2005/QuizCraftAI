"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Save, Eye, CheckCircle2, Loader2, BookOpen, Clock, Users, Globe, Lock, RefreshCw, CheckCircle, XCircle, Settings2, ShieldCheck, HelpCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Quiz {
  id: string; title: string; description: string; topic: string; difficulty: string;
  is_published: boolean; time_limit_seconds: number | null; per_question_timer: boolean;
  shuffle_questions: boolean; shuffle_options: boolean; max_attempts: number;
  generation_status: string; question_count: number; created_at: string;
  available_from: string | null; available_until: string | null;
  classroom_ids?: string[];
}

interface Choice {
  id: string; text: string; is_correct: boolean; order: number;
}

interface Question {
  id: string; text: string; explanation: string; order: number;
  topic_tag: string; difficulty_score: number; choices: Choice[];
}

interface FormState {
  title: string; description: string; timeLimitMinutes: string; maxAttempts: string;
  shuffleQuestions: boolean; shuffleOptions: boolean; perQuestionTimer: boolean;
  availableFrom: string; availableUntil: string;
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: checked ? "#22C55E" : "#3A3A3A" }}>
      <span className={`inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${checked ? "translate-x-5 bg-black" : "translate-x-0 bg-white"}`} />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-white/30 last:border-0">
      <div>
        <p className="text-sm font-medium text-primary">{label}</p>
        {description && <p className="text-xs text-white/80 mt-1">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function QuestionCard({
  question,
  index,
  quizId,
  onRegenerated,
}: {
  question: Question;
  index: number;
  quizId: string;
  onRegenerated: (q: Question) => void;
}) {
  const regenMutation = useMutation({
    mutationFn: () =>
      api.post<Question>(`/api/quizzes/${quizId}/regenerate-question/${question.id}`).then((r) => r.data),
    onSuccess: onRegenerated,
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface-2 rounded-2xl border border-white/30 shadow-sm p-6 relative overflow-hidden group transition-all hover:bg-surface-2 hover:border-white/10"
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-mono font-bold text-white/80 bg-surface-2 border border-white/30 group-hover:text-primary transition-colors">
            {String(index + 1).padStart(2, '0')}
          </span>
          <p className="text-base text-primary font-medium leading-relaxed mt-1">{question.text}</p>
        </div>
        <button
          type="button"
          onClick={() => regenMutation.mutate()}
          disabled={regenMutation.isPending}
          title="Regenerate this question"
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-primary hover:bg-surface-2 hover:border-white/20 border border-transparent transition-all disabled:opacity-40 disabled:cursor-not-allowed group/btn"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", regenMutation.isPending && "animate-spin text-white", !regenMutation.isPending && "group-hover/btn:text-white")} />
          <span className={cn(regenMutation.isPending && "text-white")}>
             {regenMutation.isPending ? "Generating..." : "Regenerate"}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-11">
        {question.choices.map((choice) => (
          <div
            key={choice.id}
            className={cn(
               "flex items-center gap-3 px-4 py-3 rounded-xl text-sm border transition-colors",
               choice.is_correct
                 ? "bg-success/5 border-success/30"
                 : "bg-surface-2 border-white/30 hover:border-white/10"
            )}
          >
            {choice.is_correct ? (
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-white/60 flex-shrink-0" />
            )}
            <span className={cn(
               "font-medium",
               choice.is_correct ? "text-success" : "text-white/80"
            )}>
              {choice.text}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {regenMutation.isError && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="pl-11 mt-3 text-xs text-danger">
            Failed to regenerate. Try again.
          </motion.p>
        )}
      </AnimatePresence>

      {(question.topic_tag || question.difficulty_score != null) && (
        <div className="pl-11 mt-5 flex items-center gap-3 flex-wrap">
          {question.topic_tag && (
            <span className="text-xs text-white/60 font-mono bg-background px-2 py-1 rounded border border-white/30">
              {question.topic_tag}
            </span>
          )}
          {question.difficulty_score != null && (
            <span className="text-[10px] text-white/60 uppercase tracking-wider font-bold">
               Diff: {question.difficulty_score.toFixed(2)}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>({ title: "", description: "", timeLimitMinutes: "", maxAttempts: "0", shuffleQuestions: true, shuffleOptions: true, perQuestionTimer: false, availableFrom: "", availableUntil: "" });
  const [saved, setSaved] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedClassrooms, setSelectedClassrooms] = useState<string[]>([]);

  const { data: quiz, isLoading, isError } = useQuery<Quiz>({
    queryKey: ["quiz", id],
    queryFn: () => api.get<Quiz>(`/api/quizzes/${id}`).then((r) => r.data),
  });

  const { data: fetchedQuestions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["quiz-questions-edit", id],
    queryFn: () => api.get<Question[]>(`/api/quizzes/${id}/questions`).then((r) => r.data),
    enabled: !!quiz,
  });

  const { data: classrooms = [] } = useQuery<{id: string, name: string, code: string}[]>({
    queryKey: ["classrooms-list-edit"],
    queryFn: () => api.get("/api/classrooms").then((r) => r.data),
  });

  useEffect(() => {
    if (fetchedQuestions) setQuestions(fetchedQuestions);
  }, [fetchedQuestions]);

  useEffect(() => {
    if (!quiz) return;
    const toLocalDatetimeInput = (iso: string | null) => iso ? new Date(iso).toISOString().slice(0, 16) : "";
    setForm({ title: quiz.title, description: quiz.description || "", timeLimitMinutes: quiz.time_limit_seconds ? String(Math.round(quiz.time_limit_seconds / 60)) : "", maxAttempts: String(quiz.max_attempts), shuffleQuestions: quiz.shuffle_questions, shuffleOptions: quiz.shuffle_options, perQuestionTimer: quiz.per_question_timer, availableFrom: toLocalDatetimeInput(quiz.available_from), availableUntil: toLocalDatetimeInput(quiz.available_until) });
    if (quiz.classroom_ids) {
      setSelectedClassrooms(quiz.classroom_ids);
    }
  }, [quiz?.id, quiz?.classroom_ids]); // eslint-disable-line react-hooks/exhaustive-deps

  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ["quiz", id] }); queryClient.invalidateQueries({ queryKey: ["my-quizzes"] }); };
  const publishMutation = useMutation({ mutationFn: (p: boolean) => api.patch(`/api/quizzes/${id}`, { is_published: p }).then((r) => r.data), onSuccess: invalidate });
  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/api/quizzes/${id}`, { title: form.title, description: form.description, time_limit_seconds: form.timeLimitMinutes ? parseInt(form.timeLimitMinutes) * 60 : null, max_attempts: parseInt(form.maxAttempts) || 0, shuffle_questions: form.shuffleQuestions, shuffle_options: form.shuffleOptions, per_question_timer: form.perQuestionTimer, available_from: form.availableFrom ? new Date(form.availableFrom).toISOString() : null, available_until: form.availableUntil ? new Date(form.availableUntil).toISOString() : null });
      if (quiz) {
         const initial = new Set(quiz.classroom_ids || []);
         const current = new Set(selectedClassrooms);
         const toAdd = [...current].filter(x => !initial.has(x));
         const toRemove = [...initial].filter(x => !current.has(x));
         await Promise.all([
             ...toAdd.map(cid => api.post(`/api/classrooms/${cid}/assign-quiz`, { quiz_id: id })),
             ...toRemove.map(cid => api.delete(`/api/classrooms/${cid}/remove-quiz`, { data: { quiz_id: id } }))
         ]);
      }
    },
    onSuccess: () => { 
      invalidate(); 
      setSaved(true); 
      setTimeout(() => router.push("/dashboard/instructor"), 800);
    },
  });

  const handleSave = () => { saveMutation.mutate(); };
  const set = (key: keyof FormState) => (val: string | boolean) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegenerated = (updated: Question) => {
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  };

  const inputClass = "w-full px-4 py-3 rounded-lg text-sm text-primary placeholder:text-white/60 bg-surface-2 border border-white/30 outline-none transition-all focus:border-white/20 focus:bg-background";

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (isError || !quiz) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-danger flex items-center gap-2"><AlertCircle className="w-5 h-5"/> Quiz not found. <Link href="/dashboard/instructor" className="underline text-primary hover:text-white transition-colors">Back to Dashboard</Link></p></div>;

  return (
    <PageWrapper className="max-w-5xl mx-auto pb-40">
      <div className="flex items-center justify-between mb-8">
        <Link href="/dashboard/instructor" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-primary transition-colors">
           <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <Link href={`/quizzes/${id}`} className="inline-flex items-center gap-2 text-sm text-primary hover:text-white transition-colors bg-surface-2 px-3 py-1.5 rounded-lg border border-white/30 hover:border-white/20 hover:bg-surface-2">
           <Eye className="w-4 h-4" /> Preview Student View
        </Link>
      </div>

      <div className="mb-10 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="w-16 h-16 rounded-2xl bg-surface-2 border border-white/30 mx-auto flex items-center justify-center mb-6">
          <Settings2 className="w-8 h-8 text-primary" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-5xl font-semibold tracking-tight text-primary mb-3">
          Quiz Editor
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-white/80 max-w-xl mx-auto truncate font-medium">
          {quiz.title}
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-8">
           {/* Questions Section */}
           <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-white/80" />
                  Questions
                  {questions.length > 0 && <span className="text-white/60 font-normal text-sm bg-surface-2 px-2 py-0.5 rounded border border-white/30">{questions.length}</span>}
                </h2>
                <div className="flex items-center gap-2 text-xs text-white/80 bg-surface-2 px-3 py-1.5 rounded-lg border border-white/30">
                   <div className="w-2 h-2 rounded-full bg-success"></div>
                   Correct answers
                </div>
              </div>
    
              {questionsLoading ? (
                <div className="flex items-center justify-center py-20 bg-surface-2 rounded-2xl border border-white/30 shadow-sm">
                  <div className="flex flex-col items-center gap-3">
                     <Loader2 className="w-8 h-8 animate-spin text-white/80" />
                     <p className="text-sm text-white/60">Loading questions...</p>
                  </div>
                </div>
              ) : questions.length === 0 ? (
                <div className="bg-surface-2 rounded-2xl border border-white/30 shadow-sm p-12 text-center">
                  <HelpCircle className="w-10 h-10 text-white/60/30 mx-auto mb-4" />
                  <p className="text-white/80 font-medium">No questions yet</p>
                  <p className="text-sm text-white/60 mt-2">Questions will appear here once generated.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, i) => (
                    <QuestionCard key={q.id} question={q} index={i} quizId={id} onRegenerated={handleRegenerated} />
                  ))}
                </div>
              )}
           </div>
         </div>

         <div className="lg:col-span-4 space-y-6">
            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              {[{ icon: BookOpen, value: quiz.question_count ?? "--", label: "Questions" }, { icon: Clock, value: quiz.difficulty, label: "Difficulty", cap: true }].map(({ icon: Icon, value, label, cap }, i) => (
                <div key={label} className="bg-surface-2 rounded-xl border border-white/30 p-4 shrink-0 transition-colors hover:bg-surface-2">
                   <Icon className="w-5 h-5 text-white/80 mb-3" />
                   <p className={cn("text-xl font-bold text-primary tracking-tight", cap && "capitalize")}>{value}</p>
                   <p className="text-xs text-white/60 mt-1">{label}</p>
                </div>
              ))}
            </div>
            <div className="bg-surface-2 rounded-xl border border-white/30 p-4 shrink-0 transition-colors hover:bg-surface-2">
                 <Users className="w-5 h-5 text-white/80 mb-3" />
                 <p className="text-xl font-bold text-primary tracking-tight">{quiz.max_attempts === 0 ? "Unlimited" : quiz.max_attempts}</p>
                 <p className="text-xs text-white/60 mt-1">Maximum Attempts</p>
            </div>

            {/* Settings Form */}
            <div className="bg-surface-2 rounded-2xl border border-white/30 shadow-sm overflow-hidden sticky top-6">
              <div className="p-6 border-b border-white/30 bg-background/50">
                 <h2 className="text-base font-semibold text-primary flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-white/80" />
                    Quiz Settings
                 </h2>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-white/80 mb-2 uppercase tracking-wider">Title</label>
                  <input type="text" value={form.title} onChange={(e) => set("title")(e.target.value)} className={inputClass} placeholder="Quiz title" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/80 mb-2 uppercase tracking-wider flex justify-between">
                     Description <span className="text-white/60 tracking-normal lowercase">(optional)</span>
                  </label>
                  <textarea value={form.description} onChange={(e) => set("description")(e.target.value)} rows={3} className={inputClass + " resize-none"} placeholder="What will students learn?" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-2 uppercase tracking-wider">Time Limit <span className="text-white/60 tracking-normal lowercase">(min)</span></label>
                    <input type="number" min="1" max="180" value={form.timeLimitMinutes} onChange={(e) => set("timeLimitMinutes")(e.target.value)} className={inputClass} placeholder="No limit" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-2 uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis">Max Attempts <span className="text-white/60 tracking-normal lowercase">(0=Unlim)</span></label>
                    <input type="number" min="0" value={form.maxAttempts} onChange={(e) => set("maxAttempts")(e.target.value)} className={inputClass} />
                  </div>
                </div>

                <div className="space-y-4">
                   <div>
                     <label className="block text-xs font-medium text-white/80 mb-2 uppercase tracking-wider flex justify-between">Available From <span className="text-white/60 tracking-normal lowercase">(optional)</span></label>
                     <input type="datetime-local" value={form.availableFrom} onChange={(e) => set("availableFrom")(e.target.value)} className={cn(inputClass, "[color-scheme:dark]")} />
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-white/80 mb-2 uppercase tracking-wider flex justify-between">Available Until <span className="text-white/60 tracking-normal lowercase">(optional)</span></label>
                     <input type="datetime-local" value={form.availableUntil} onChange={(e) => set("availableUntil")(e.target.value)} className={cn(inputClass, "[color-scheme:dark]")} />
                   </div>
                </div>

                <div className="pt-2 border-y border-white/30">
                   <SettingRow label="Shuffle Questions"><Toggle checked={form.shuffleQuestions} onChange={set("shuffleQuestions") as (v: boolean) => void} /></SettingRow>
                   <SettingRow label="Shuffle Options"><Toggle checked={form.shuffleOptions} onChange={set("shuffleOptions") as (v: boolean) => void} /></SettingRow>
                   <SettingRow label="Per-Question timer"><Toggle checked={form.perQuestionTimer} onChange={set("perQuestionTimer") as (v: boolean) => void} /></SettingRow>
                </div>

                <div className="pt-4 border-b border-white/30 pb-4">
                  <label className="block text-xs font-medium text-white/80 mb-3 uppercase tracking-wider">Assign to Classrooms</label>
                  {classrooms.length === 0 ? (
                    <p className="text-sm text-white/50 bg-background p-3 rounded-xl border border-white/10">No classrooms available.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {classrooms.map((c) => {
                        const isSelected = selectedClassrooms.includes(c.id);
                        return (
                          <label key={c.id} className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors", isSelected ? "bg-white/10 border-white/40" : "bg-background border-white/10 hover:border-white/30")}>
                            <input type="checkbox" checked={isSelected} onChange={(e) => {
                              if (e.target.checked) setSelectedClassrooms(prev => [...prev, c.id]);
                              else setSelectedClassrooms(prev => prev.filter(cid => cid !== c.id));
                            }} className="w-4 h-4 rounded border-white/30 text-white focus:ring-white/20 bg-background cursor-pointer" />
                            <span className="text-sm font-medium text-white">{c.name} <span className="text-white/40 font-mono text-xs ml-1">({c.code})</span></span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Button type="button" onClick={handleSave} disabled={saveMutation.isPending} className="w-full" variant="premium">
                    {saveMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  
                  <AnimatePresence>
                     {saved && (
                        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center text-sm text-success font-medium mt-3 flex items-center justify-center gap-1.5">
                           <CheckCircle2 className="w-4 h-4" /> Changes saved
                        </motion.p>
                     )}
                     {saveMutation.isError && (
                        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center text-sm text-danger mt-3">
                           Failed to save settings.
                        </motion.p>
                     )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
         </div>
      </div>

      {/* Sticky Publish Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
           <motion.div 
             initial={{ y: 100, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.5 }}
             className={cn(
                "rounded-2xl border p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between transition-colors duration-500",
                quiz.is_published 
                   ? "bg-success/10 border-success/30" 
                   : "bg-surface-2/90 border-white/30"
             )}
           >
             <div className="flex items-center gap-4">
                <div className={cn(
                   "w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-500",
                   quiz.is_published ? "bg-success/20 text-success" : "bg-background border border-white/30 text-white/80"
                )}>
                   {quiz.is_published ? <Globe className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>
                <div>
                   <h3 className={cn("font-semibold text-base transition-colors duration-500", quiz.is_published ? "text-success" : "text-primary")}>
                      {quiz.is_published ? "Quiz is Published" : "Draft Mode"}
                   </h3>
                   <p className={cn("text-xs transition-colors duration-500", quiz.is_published ? "text-success/70" : "text-white/60")}>
                      {quiz.is_published ? "Visible to students. They can now take this quiz." : "Hidden from students. Publish when ready."}
                   </p>
                </div>
             </div>
             
             <div className="flex items-center gap-4">
                {publishMutation.isPending && <Loader2 className="w-5 h-5 animate-spin text-white/80" />}
                <Toggle checked={quiz.is_published} onChange={(v) => publishMutation.mutate(v)} disabled={publishMutation.isPending} />
             </div>
           </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
}
