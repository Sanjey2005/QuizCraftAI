"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/hooks";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { cn } from "@/lib/utils";

interface GeneratePayload {
  topic: string;
  num_questions: number;
  difficulty: "easy" | "medium" | "hard";
}

import { motion } from "framer-motion";

interface StatusResponse {
  id: string;
  generation_status: "pending" | "generating" | "completed" | "failed";
}

export default function GenerateQuizPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [generatedQuizId, setGeneratedQuizId] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
    } else if (user.role !== "instructor") {
      router.push("/quizzes");
    }
  }, [router]);

  const generateMutation = useMutation({
    mutationFn: async (data: GeneratePayload) => {
      const res = await api.post<{ quiz_id: string; status_url: string }>(
        "/api/quizzes/generate",
        data
      );
      return res.data;
    },
    onSuccess: (data) => {
      setGeneratedQuizId(data.quiz_id);
    },
  });

  const { data: statusData } = useQuery<StatusResponse>({
    queryKey: ["quiz-status", generatedQuizId],
    queryFn: () =>
      api
        .get<StatusResponse>(`/api/quizzes/${generatedQuizId}/status`)
        .then((r) => r.data),
    enabled: !!generatedQuizId,
    refetchInterval: (query) => {
      const s = query.state.data?.generation_status;
      if (s === "completed" || s === "failed") return false;
      return 3000;
    },
  });

  const currentStatus = statusData?.generation_status;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratedQuizId(null);
    generateMutation.mutate({ topic, num_questions: numQuestions, difficulty });
  };

  const handleRetry = () => {
    setGeneratedQuizId(null);
    generateMutation.reset();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Generate a Quiz</h1>
          <p className="text-slate-500 text-sm mt-1">
            Describe your topic and let AI do the rest
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {!generatedQuizId ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  placeholder="e.g. Photosynthesis, World War II, Python loops…"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">
                    Number of questions
                  </label>
                  <span className="text-sm font-semibold font-mono text-[var(--color-accent)]">
                    {numQuestions}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>1</span>
                  <span>50</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Difficulty
                </label>
                <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50 gap-1">
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        "flex-1 py-2 text-sm font-medium rounded-md transition-all capitalize",
                        difficulty === d
                          ? "bg-white shadow-sm text-[var(--color-brand)]"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {generateMutation.isError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  Generation failed. Please try again.
                </p>
              )}

              <button
                type="submit"
                disabled={generateMutation.isPending}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                style={{ background: "var(--color-brand)" }}
              >
                {generateMutation.isPending ? "Submitting…" : "Generate Quiz ✦"}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="font-semibold text-slate-800 mb-1">
                  Generating your quiz
                </h2>
                <p className="text-sm text-slate-500">
                  <span className="font-medium">{topic}</span> · {numQuestions}{" "}
                  questions · {difficulty}
                </p>
              </div>
              <div className="pt-2">
                <MultiStepLoader status={currentStatus ?? "pending"} />
              </div>

              {currentStatus === "completed" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <button
                    onClick={() => router.push(`/quizzes/${generatedQuizId}`)}
                    className="w-full mt-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg"
                    style={{ background: "var(--color-brand)" }}
                  >
                    View Quiz Info →
                  </button>
                </motion.div>
              )}

              {currentStatus === "failed" && (
                <button
                  onClick={handleRetry}
                  className="w-full mt-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
