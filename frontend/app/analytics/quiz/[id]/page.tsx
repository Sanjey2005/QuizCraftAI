"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Trophy, Clock, Users, TrendingUp, ArrowLeft, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { TopicBreakdownChart } from "@/components/analytics/TopicBreakdownChart";

interface QuizAnalytics {
  quiz_id: string;
  quiz_title: string;
  total_attempts: number;
  avg_score: number | null;
  best_score: number | null;
  worst_score: number | null;
  avg_time_seconds: number | null;
  topic_breakdown: Record<string, { correct: number; total: number; accuracy: number }>;
}

function formatTime(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">{label}</p>
        <div className="text-slate-300">{icon}</div>
      </div>
      <p className="text-3xl font-bold font-mono text-slate-900">{value}</p>
    </div>
  );
}

export default function QuizAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading, isError } = useQuery<QuizAnalytics>({
    queryKey: ["quiz-analytics", id],
    queryFn: () =>
      api.get<QuizAnalytics>(`/api/analytics/quiz/${id}`).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const hasTopics = data?.topic_breakdown && Object.keys(data.topic_breakdown).length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="border-b border-slate-200 px-6 py-4"
        style={{ background: "var(--color-brand)" }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center text-white text-xs font-bold">
              Q
            </div>
            <span className="text-white font-semibold">QuizCraft AI</span>
          </div>
          <Link
            href="/dashboard/instructor"
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: "var(--color-accent)" }}
            />
          </div>
        )}

        {isError && (
          <div className="text-center py-24">
            <p className="text-red-600 font-medium mb-4">Could not load analytics.</p>
            <Link
              href="/dashboard/instructor"
              className="text-sm underline"
              style={{ color: "var(--color-accent)" }}
            >
              Back to dashboard
            </Link>
          </div>
        )}

        {data && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                  Quiz Analytics
                </p>
                <h1 className="text-2xl font-bold text-slate-900">{data.quiz_title}</h1>
              </div>
              <Link
                href={`/analytics/quiz/${id}/leaderboard`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 flex-shrink-0"
                style={{ background: "var(--color-accent)" }}
              >
                <Trophy className="w-4 h-4" />
                Leaderboard
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Attempts"
                value={String(data.total_attempts)}
                icon={<Users className="w-4 h-4" />}
              />
              <StatCard
                label="Average Score"
                value={data.avg_score != null ? `${data.avg_score}%` : "—"}
                icon={<TrendingUp className="w-4 h-4" />}
              />
              <StatCard
                label="Top Score"
                value={data.best_score != null ? `${data.best_score}%` : "—"}
                icon={<Trophy className="w-4 h-4" />}
              />
              <StatCard
                label="Avg Time"
                value={formatTime(data.avg_time_seconds)}
                icon={<Clock className="w-4 h-4" />}
              />
            </div>

            {hasTopics && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900 mb-4">Topic Breakdown</h2>
                <TopicBreakdownChart topicBreakdown={data.topic_breakdown} />
              </div>
            )}

            {!hasTopics && data.total_attempts === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <p className="text-slate-400 text-sm">
                  No attempts yet — share the quiz with students to see analytics here.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
