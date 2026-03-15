"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/hooks";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { cn } from "@/lib/utils";

interface GeneratePayload {
  topic: string;
  num_questions: number;
  difficulty: "easy" | "medium" | "hard";
}

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
    if (!user) router.push("/login");
    else if (user.role !== "instructor") router.push("/quizzes");
  }, [router]);

  const generateMutation = useMutation({
    mutationFn: async (data: GeneratePayload) => {
      const res = await api.post<{ quiz_id: string; status_url: string }>("/api/quizzes/generate", data);
      return res.data;
    },
    onSuccess: (data) => setGeneratedQuizId(data.quiz_id),
  });

  const { data: statusData } = useQuery<StatusResponse>({
    queryKey: ["quiz-status", generatedQuizId],
    queryFn: () => api.get<StatusResponse>(`/api/quizzes/${generatedQuizId}/status`).then((r) => r.data),
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

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-900)" }}>
      <PageWrapper className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Generate a Quiz</h1>
          <p className="text-white/40 text-sm">Describe your topic and let AI do the rest</p>
        </div>

        <div
          className="rounded-2xl p-8 gradient-border"
          style={{ background: "var(--surface-800)" }}
        >
          {!generatedQuizId ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  placeholder="e.g. Photosynthesis, World War II, Python loops..."
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
                  style={{ background: "var(--surface-700)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(37,99,235,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-white/60">Number of questions</label>
                  <span className="text-sm font-black font-mono text-blue-400">{numQuestions}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-white/25 mt-1">
                  <span>1</span><span>50</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Difficulty</label>
                <div className="flex rounded-xl p-1 gap-1" style={{ background: "var(--surface-700)" }}>
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all capitalize",
                        difficulty === d
                          ? "bg-white/10 text-white shadow-sm"
                          : "text-white/35 hover:text-white/60"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {generateMutation.isError && (
                <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                  Generation failed. Please try again.
                </p>
              )}

              <button
                type="submit"
                disabled={generateMutation.isPending}
                className="w-full btn-primary py-3.5 justify-center disabled:opacity-50"
              >
                {generateMutation.isPending ? "Submitting..." : "Generate Quiz ✦"}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="font-bold text-white mb-1">Generating your quiz</h2>
                <p className="text-sm text-white/40">
                  <span className="text-white/70 font-medium">{topic}</span> · {numQuestions} questions · {difficulty}
                </p>
              </div>
              <div className="pt-2">
                <MultiStepLoader status={currentStatus ?? "pending"} />
              </div>
              {currentStatus === "completed" && (
                <button
                  onClick={() => router.push(`/quizzes/${generatedQuizId}/edit`)}
                  className="w-full btn-primary py-3.5 justify-center"
                >
                  Preview &amp; Publish →
                </button>
              )}
              {currentStatus === "failed" && (
                <button
                  onClick={() => { setGeneratedQuizId(null); generateMutation.reset(); }}
                  className="w-full py-2.5 text-sm font-semibold text-white/50 border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>
      </PageWrapper>
    </div>
  );
}
