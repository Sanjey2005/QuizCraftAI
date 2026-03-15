"use client";

import { use, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  CheckCircle2,
  Loader2,
  BookOpen,
  Clock,
  Users,
  Shuffle,
  Timer,
  Globe,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api";

interface Quiz {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: string;
  is_published: boolean;
  time_limit_seconds: number | null;
  per_question_timer: boolean;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  max_attempts: number;
  generation_status: string;
  question_count: number;
  created_at: string;
}

interface FormState {
  title: string;
  description: string;
  timeLimitMinutes: string;
  maxAttempts: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  perQuestionTimer: boolean;
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "focus:ring-blue-500" : "focus:ring-slate-400"
      }`}
      style={{ background: checked ? "var(--color-accent)" : "#cbd5e1" }}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    timeLimitMinutes: "",
    maxAttempts: "0",
    shuffleQuestions: true,
    shuffleOptions: true,
    perQuestionTimer: false,
  });
  const [saved, setSaved] = useState(false);

  const { data: quiz, isLoading, isError } = useQuery<Quiz>({
    queryKey: ["quiz", id],
    queryFn: () => api.get<Quiz>(`/api/quizzes/${id}`).then((r) => r.data),
  });

  // Initialise form once quiz loads
  useEffect(() => {
    if (!quiz) return;
    setForm({
      title: quiz.title,
      description: quiz.description || "",
      timeLimitMinutes: quiz.time_limit_seconds
        ? String(Math.round(quiz.time_limit_seconds / 60))
        : "",
      maxAttempts: String(quiz.max_attempts),
      shuffleQuestions: quiz.shuffle_questions,
      shuffleOptions: quiz.shuffle_options,
      perQuestionTimer: quiz.per_question_timer,
    });
  }, [quiz?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["quiz", id] });
    queryClient.invalidateQueries({ queryKey: ["my-quizzes"] });
  };

  // Publish toggle — fires immediately on click
  const publishMutation = useMutation({
    mutationFn: (published: boolean) =>
      api.patch(`/api/quizzes/${id}`, { is_published: published }).then((r) => r.data),
    onSuccess: invalidate,
  });

  // Settings save — fires on button click
  const settingsMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.patch(`/api/quizzes/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSave = () => {
    const timeLimitSeconds = form.timeLimitMinutes
      ? parseInt(form.timeLimitMinutes, 10) * 60
      : null;
    settingsMutation.mutate({
      title: form.title,
      description: form.description,
      time_limit_seconds: timeLimitSeconds,
      max_attempts: parseInt(form.maxAttempts, 10) || 0,
      shuffle_questions: form.shuffleQuestions,
      shuffle_options: form.shuffleOptions,
      per_question_timer: form.perQuestionTimer,
    });
  };

  const set = (key: keyof FormState) => (val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: "var(--color-accent)" }}
        />
      </div>
    );
  }

  if (isError || !quiz) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">Quiz not found.</p>
          <Link
            href="/dashboard/instructor"
            className="text-sm underline"
            style={{ color: "var(--color-accent)" }}
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header
        className="border-b border-slate-200 px-6 py-4"
        style={{ background: "var(--color-brand)" }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center text-white text-xs font-bold">
              Q
            </div>
            <span className="text-white font-semibold">QuizCraft AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/quizzes/${id}`}
              className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Link>
            <Link
              href="/dashboard/instructor"
              className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-slate-900">Edit Quiz</h1>
          <p className="text-slate-400 text-sm mt-0.5 truncate">{quiz.title}</p>
        </div>

        {/* ── PUBLISH CARD ── */}
        <div
          className={`rounded-2xl border p-5 transition-colors ${
            quiz.is_published
              ? "bg-green-50 border-green-200"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  quiz.is_published ? "bg-green-100" : "bg-slate-100"
                }`}
              >
                {quiz.is_published ? (
                  <Globe className="w-5 h-5 text-green-600" />
                ) : (
                  <Lock className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  {quiz.is_published ? "Published" : "Draft"}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {quiz.is_published
                    ? "Visible to all students in the quiz library"
                    : "Hidden — only you can see this quiz"}
                </p>
              </div>
            </div>
            <Toggle
              checked={quiz.is_published}
              onChange={(v) => publishMutation.mutate(v)}
              disabled={publishMutation.isPending}
            />
          </div>

          {publishMutation.isPending && (
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Updating…
            </p>
          )}
        </div>

        {/* ── QUIZ INFO (read-only context) ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Quiz Info
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex justify-center mb-1">
                <BookOpen className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xl font-bold text-slate-900">
                {quiz.question_count ?? "—"}
              </p>
              <p className="text-xs text-slate-400">Questions</p>
            </div>
            <div>
              <div className="flex justify-center mb-1">
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xl font-bold text-slate-900 capitalize">
                {quiz.difficulty}
              </p>
              <p className="text-xs text-slate-400">Difficulty</p>
            </div>
            <div>
              <div className="flex justify-center mb-1">
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xl font-bold text-slate-900">
                {quiz.max_attempts === 0 ? "∞" : quiz.max_attempts}
              </p>
              <p className="text-xs text-slate-400">Max Attempts</p>
            </div>
          </div>
        </div>

        {/* ── SETTINGS FORM ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-5">
            Settings
          </h2>
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title")(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ ["--tw-ring-color" as string]: "var(--color-accent)" }}
                placeholder="Quiz title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Description{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set("description")(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                placeholder="What will students learn from this quiz?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Time Limit */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Time Limit{" "}
                  <span className="text-slate-400 font-normal">(minutes)</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={form.timeLimitMinutes}
                    onChange={(e) => set("timeLimitMinutes")(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
                    placeholder="No limit"
                  />
                </div>
              </div>

              {/* Max Attempts */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Max Attempts{" "}
                  <span className="text-slate-400 font-normal">(0 = ∞)</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    value={form.maxAttempts}
                    onChange={(e) => set("maxAttempts")(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── QUIZ OPTIONS ── */}
        <div className="bg-white rounded-2xl border border-slate-200 px-5">
          <h2 className="text-sm font-semibold text-slate-700 py-4 border-b border-slate-100">
            Options
          </h2>
          <SettingRow
            label="Shuffle Questions"
            description="Randomise question order for each attempt"
          >
            <Toggle
              checked={form.shuffleQuestions}
              onChange={set("shuffleQuestions") as (v: boolean) => void}
            />
          </SettingRow>
          <SettingRow
            label="Shuffle Answer Options"
            description="Randomise the order of answer choices"
          >
            <Toggle
              checked={form.shuffleOptions}
              onChange={set("shuffleOptions") as (v: boolean) => void}
            />
          </SettingRow>
          <SettingRow
            label="Per-Question Timer"
            description="Each question gets its own countdown"
          >
            <Toggle
              checked={form.perQuestionTimer}
              onChange={set("perQuestionTimer") as (v: boolean) => void}
            />
          </SettingRow>
        </div>

        {/* ── SAVE BUTTON ── */}
        <div className="flex items-center gap-3 pb-8">
          <button
            type="button"
            onClick={handleSave}
            disabled={settingsMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--color-accent)" }}
          >
            {settingsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>

          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Saved!
            </span>
          )}

          {settingsMutation.isError && (
            <span className="text-sm text-red-600">
              Failed to save. Please try again.
            </span>
          )}
        </div>
      </main>
    </div>
  );
}
