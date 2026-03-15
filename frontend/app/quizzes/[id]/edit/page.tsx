"use client";

import { use, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Save, Eye, CheckCircle2, Loader2, BookOpen, Clock, Users, Globe, Lock, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";

interface Quiz {
  id: string; title: string; description: string; topic: string; difficulty: string;
  is_published: boolean; time_limit_seconds: number | null; per_question_timer: boolean;
  shuffle_questions: boolean; shuffle_options: boolean; max_attempts: number;
  generation_status: string; question_count: number; created_at: string;
  available_from: string | null; available_until: string | null;
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
      style={{ background: checked ? "#2563EB" : "rgba(255,255,255,0.12)" }}>
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div><p className="text-sm font-medium text-white/80">{label}</p>{description && <p className="text-xs text-white/30 mt-0.5">{description}</p>}</div>
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
    <div className="rounded-2xl p-5" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white/50" style={{ background: "rgba(255,255,255,0.06)" }}>
            {index + 1}
          </span>
          <p className="text-sm text-white/85 font-medium leading-relaxed">{question.text}</p>
        </div>
        <button
          type="button"
          onClick={() => regenMutation.mutate()}
          disabled={regenMutation.isPending}
          title="Regenerate this question"
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/8 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {regenMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {regenMutation.isPending ? "Regenerating…" : "Regenerate"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 ml-10">
        {question.choices.map((choice) => (
          <div
            key={choice.id}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm"
            style={{
              background: choice.is_correct ? "rgba(22,163,74,0.12)" : "rgba(255,255,255,0.03)",
              border: choice.is_correct ? "1px solid rgba(22,163,74,0.3)" : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {choice.is_correct ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-white/15 flex-shrink-0" />
            )}
            <span className={choice.is_correct ? "text-emerald-300 font-medium" : "text-white/50"}>
              {choice.text}
            </span>
          </div>
        ))}
      </div>

      {regenMutation.isError && (
        <p className="ml-10 mt-2 text-xs text-rose-400">Failed to regenerate. Try again.</p>
      )}

      {question.topic_tag && (
        <div className="ml-10 mt-3">
          <span className="text-xs text-white/25 font-mono">{question.topic_tag}</span>
        </div>
      )}
    </div>
  );
}

export default function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>({ title: "", description: "", timeLimitMinutes: "", maxAttempts: "0", shuffleQuestions: true, shuffleOptions: true, perQuestionTimer: false, availableFrom: "", availableUntil: "" });
  const [saved, setSaved] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  const { data: quiz, isLoading, isError } = useQuery<Quiz>({
    queryKey: ["quiz", id],
    queryFn: () => api.get<Quiz>(`/api/quizzes/${id}`).then((r) => r.data),
  });

  const { data: fetchedQuestions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["quiz-questions-edit", id],
    queryFn: () => api.get<Question[]>(`/api/quizzes/${id}/questions`).then((r) => r.data),
    enabled: !!quiz,
  });

  useEffect(() => {
    if (fetchedQuestions) setQuestions(fetchedQuestions);
  }, [fetchedQuestions]);

  useEffect(() => {
    if (!quiz) return;
    const toLocalDatetimeInput = (iso: string | null) => iso ? new Date(iso).toISOString().slice(0, 16) : "";
    setForm({ title: quiz.title, description: quiz.description || "", timeLimitMinutes: quiz.time_limit_seconds ? String(Math.round(quiz.time_limit_seconds / 60)) : "", maxAttempts: String(quiz.max_attempts), shuffleQuestions: quiz.shuffle_questions, shuffleOptions: quiz.shuffle_options, perQuestionTimer: quiz.per_question_timer, availableFrom: toLocalDatetimeInput(quiz.available_from), availableUntil: toLocalDatetimeInput(quiz.available_until) });
  }, [quiz?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ["quiz", id] }); queryClient.invalidateQueries({ queryKey: ["my-quizzes"] }); };
  const publishMutation = useMutation({ mutationFn: (p: boolean) => api.patch(`/api/quizzes/${id}`, { is_published: p }).then((r) => r.data), onSuccess: invalidate });
  const settingsMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => api.patch(`/api/quizzes/${id}`, d).then((r) => r.data),
    onSuccess: () => { invalidate(); setSaved(true); setTimeout(() => setSaved(false), 3000); },
  });

  const handleSave = () => {
    settingsMutation.mutate({ title: form.title, description: form.description, time_limit_seconds: form.timeLimitMinutes ? parseInt(form.timeLimitMinutes) * 60 : null, max_attempts: parseInt(form.maxAttempts) || 0, shuffle_questions: form.shuffleQuestions, shuffle_options: form.shuffleOptions, per_question_timer: form.perQuestionTimer, available_from: form.availableFrom ? new Date(form.availableFrom).toISOString() : null, available_until: form.availableUntil ? new Date(form.availableUntil).toISOString() : null });
  };
  const set = (key: keyof FormState) => (val: string | boolean) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegenerated = (updated: Question) => {
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  };

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all";
  const inputStyle = { background: "var(--surface-700)", border: "1px solid rgba(255,255,255,0.08)" };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface-900)" }}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  if (isError || !quiz) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface-900)" }}><p className="text-rose-400">Quiz not found. <Link href="/dashboard/instructor" className="underline text-blue-400">Back</Link></p></div>;

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-900)" }}>
      <PageWrapper className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard/instructor" className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors"><ArrowLeft className="w-4 h-4" /> Dashboard</Link>
          <Link href={`/quizzes/${id}`} className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"><Eye className="w-4 h-4" /> Preview</Link>
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Edit Quiz</h1>
          <p className="text-white/30 text-sm mt-0.5 truncate">{quiz.title}</p>
        </div>

        <div className="space-y-4">
          {/* Publish */}
          <div className={`rounded-2xl border p-5 transition-colors ${quiz.is_published ? "bg-emerald-500/10 border-emerald-500/20" : "border-white/8"}`} style={quiz.is_published ? {} : { background: "var(--surface-800)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${quiz.is_published ? "bg-emerald-500/20" : "bg-white/5"}`}>
                  {quiz.is_published ? <Globe className="w-5 h-5 text-emerald-400" /> : <Lock className="w-5 h-5 text-white/30" />}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{quiz.is_published ? "Published" : "Draft"}</p>
                  <p className="text-xs text-white/35 mt-0.5">{quiz.is_published ? "Visible to all students" : "Hidden — only you can see this"}</p>
                </div>
              </div>
              <Toggle checked={quiz.is_published} onChange={(v) => publishMutation.mutate(v)} disabled={publishMutation.isPending} />
            </div>
          </div>

          {/* Info */}
          <div className="rounded-2xl p-5" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-sm font-semibold text-white/60 mb-4">Quiz Info</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[{ icon: BookOpen, value: quiz.question_count ?? "—", label: "Questions" }, { icon: Clock, value: quiz.difficulty, label: "Difficulty", cap: true }, { icon: Users, value: quiz.max_attempts === 0 ? "∞" : quiz.max_attempts, label: "Max Attempts" }].map(({ icon: Icon, value, label, cap }) => (
                <div key={label}><Icon className="w-4 h-4 text-white/25 mx-auto mb-1" /><p className={`text-xl font-bold text-white ${cap ? "capitalize" : ""}`}>{value}</p><p className="text-xs text-white/30">{label}</p></div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-2xl p-6" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-sm font-semibold text-white/60 mb-5">Settings</h2>
            <div className="space-y-4">
              <div><label className="block text-xs font-medium text-white/40 mb-1.5">Title</label><input type="text" value={form.title} onChange={(e) => set("title")(e.target.value)} className={inputClass} style={inputStyle} placeholder="Quiz title" onFocus={(e) => { e.target.style.borderColor = "rgba(37,99,235,0.6)"; }} onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }} /></div>
              <div><label className="block text-xs font-medium text-white/40 mb-1.5">Description <span className="text-white/20">(optional)</span></label><textarea value={form.description} onChange={(e) => set("description")(e.target.value)} rows={3} className={inputClass + " resize-none"} style={inputStyle} placeholder="What will students learn?" onFocus={(e) => { e.target.style.borderColor = "rgba(37,99,235,0.6)"; }} onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-white/40 mb-1.5">Time Limit (min)</label><input type="number" min="1" max="180" value={form.timeLimitMinutes} onChange={(e) => set("timeLimitMinutes")(e.target.value)} className={inputClass} style={inputStyle} placeholder="No limit" onFocus={(e) => { e.target.style.borderColor = "rgba(37,99,235,0.6)"; }} onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }} /></div>
                <div><label className="block text-xs font-medium text-white/40 mb-1.5">Max Attempts (0 = ∞)</label><input type="number" min="0" value={form.maxAttempts} onChange={(e) => set("maxAttempts")(e.target.value)} className={inputClass} style={inputStyle} onFocus={(e) => { e.target.style.borderColor = "rgba(37,99,235,0.6)"; }} onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-white/40 mb-1.5">Available From <span className="text-white/20">(optional)</span></label><input type="datetime-local" value={form.availableFrom} onChange={(e) => set("availableFrom")(e.target.value)} className={inputClass} style={{ ...inputStyle, colorScheme: "dark" }} onFocus={(e) => { e.target.style.borderColor = "rgba(37,99,235,0.6)"; }} onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }} /></div>
                <div><label className="block text-xs font-medium text-white/40 mb-1.5">Available Until <span className="text-white/20">(optional)</span></label><input type="datetime-local" value={form.availableUntil} onChange={(e) => set("availableUntil")(e.target.value)} className={inputClass} style={{ ...inputStyle, colorScheme: "dark" }} onFocus={(e) => { e.target.style.borderColor = "rgba(37,99,235,0.6)"; }} onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }} /></div>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="rounded-2xl px-6 pt-2 pb-2" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-sm font-semibold text-white/60 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>Options</h2>
            <SettingRow label="Shuffle Questions" description="Randomise question order for each attempt"><Toggle checked={form.shuffleQuestions} onChange={set("shuffleQuestions") as (v: boolean) => void} /></SettingRow>
            <SettingRow label="Shuffle Answer Options" description="Randomise the order of answer choices"><Toggle checked={form.shuffleOptions} onChange={set("shuffleOptions") as (v: boolean) => void} /></SettingRow>
            <SettingRow label="Per-Question Timer" description="Each question gets its own countdown"><Toggle checked={form.perQuestionTimer} onChange={set("perQuestionTimer") as (v: boolean) => void} /></SettingRow>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={handleSave} disabled={settingsMutation.isPending} className="btn-primary disabled:opacity-60">
              {settingsMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Settings</>}
            </button>
            {saved && <span className="flex items-center gap-1.5 text-sm text-emerald-400 font-medium"><CheckCircle2 className="w-4 h-4" /> Saved!</span>}
            {settingsMutation.isError && <span className="text-sm text-rose-400">Failed to save.</span>}
          </div>

          {/* Question Preview */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/60">
                Questions
                {questions.length > 0 && <span className="ml-2 text-white/25 font-normal">({questions.length})</span>}
              </h2>
              <p className="text-xs text-white/25">Correct answers highlighted green</p>
            </div>

            {questionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-white/30" />
              </div>
            ) : questions.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: "var(--surface-800)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-white/30 text-sm">No questions yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <QuestionCard key={q.id} question={q} index={i} quizId={id} onRegenerated={handleRegenerated} />
                ))}
              </div>
            )}
          </div>

          <div className="pb-12" />
        </div>
      </PageWrapper>
    </div>
  );
}
