"use client";

import { use, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Check, X, ChevronDown, Loader2, RefreshCw, Compass, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { ScoreHero } from "@/components/analytics/ScoreHero";
import { TopicBreakdownChart } from "@/components/analytics/TopicBreakdownChart";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";


interface AnswerResult { id: string; question_id: string; question_text: string; selected_choice_text: string; correct_choice_text: string; is_correct: boolean; time_spent_seconds: number; explanation: string; }
interface AttemptResult { id: string; quiz: string; score: number; total_questions: number; correct_answers: number; time_spent_seconds: number; topic_breakdown: Record<string, { correct: number; total: number }>; tab_switch_count: number; answers: AnswerResult[]; }

function AnswerCard({ answer, index }: { answer: AnswerResult; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "rounded-2xl border overflow-hidden transition-all duration-300",
        answer.is_correct ? "bg-success/5 border-success/30 hover:border-success/50" : "bg-danger/5 border-danger/30 hover:border-danger/50"
      )}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-start sm:items-center gap-4 p-5 text-left focus:outline-none focus-visible:bg-[#1A1A1A]/5",
        )}
      >
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 sm:mt-0 shadow-lg",
          answer.is_correct ? "bg-success text-white shadow-success/30" : "bg-danger text-white shadow-danger/30"
        )}>
          {answer.is_correct ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </div>
        <span className={cn("flex-1 text-base font-medium leading-snug", answer.is_correct ? "text-primary" : "text-primary")}>
           <span className="text-white/80 font-mono text-sm mr-2">{String(index + 1).padStart(2, '0')}.</span>
           {answer.question_text}
        </span>
        <div className={cn(
           "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
           open ? "bg-[#1A1A1A]/10 text-white" : "bg-transparent text-white/80 hover:bg-[#1A1A1A]/5 hover:text-white"
        )}>
           <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", open && "rotate-180")} />
        </div>
      </button>
      
      <AnimatePresence>
         {open && (
         <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
         >
            <div className="px-5 pb-5 pt-2 space-y-4 border-t border-white/5 ml-12 sm:ml-0">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-surface-2 rounded-xl p-4 border border-white/30">
                     <p className="text-xs text-white/60 uppercase tracking-widest font-bold mb-2">Your answer</p>
                     <p className={cn("text-sm font-medium", answer.is_correct ? "text-success" : "text-danger")}>
                        {answer.selected_choice_text || <span className="text-white/60 italic">Not answered</span>}
                     </p>
                  </div>
                  {!answer.is_correct && (
                     <div className="bg-success/10 rounded-xl p-4 border border-success/30">
                     <p className="text-xs text-success/70 uppercase tracking-widest font-bold mb-2">Correct answer</p>
                     <p className="text-sm font-medium text-success">{answer.correct_choice_text}</p>
                     </div>
                  )}
               </div>
               {answer.explanation && (
                  <div className="p-4 rounded-xl bg-surface-2 border border-white/30 relative overflow-hidden group">
                     {/* subtle gradient glow for explanation */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-[#1A1A1A]/5 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                     <p className="text-xs text-white/80 uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                        Explanation
                     </p>
                     <p className="text-sm text-primary/80 leading-relaxed font-normal">{answer.explanation}</p>
                  </div>
               )}
            </div>
         </motion.div>
         )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AttemptResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError } = useQuery<AttemptResult>({
    queryKey: ["attempt-results", id],
    queryFn: () => api.get<AttemptResult>(`/api/attempts/${id}/results`).then((r) => r.data),
    retry: 2,
  });

  useEffect(() => {
     if (data?.score && data.score >= 70) {
        const canvas = document.createElement("canvas");
        canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999";
        document.body.appendChild(canvas);
        const ctx = canvas.getContext("2d")!;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ["#1E3A5F","#2563EB","#16A34A","#D97706","#DC2626","#a855f7","#ec4899"];
        const particles = Array.from({ length: 120 }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          r: Math.random() * 6 + 4,
          d: Math.random() * 120,
          color: colors[Math.floor(Math.random() * colors.length)],
          tilt: Math.random() * 10 - 10,
          tiltAngle: 0,
          tiltAngleInc: Math.random() * 0.07 + 0.05,
        }));

        let frame: number;
        const draw = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          particles.forEach((p) => {
            p.tiltAngle += p.tiltAngleInc;
            p.y += (Math.cos(p.d) + 3 + p.r / 2) * 0.8;
            p.x += Math.sin(p.d) * 0.8;
            p.tilt = Math.sin(p.tiltAngle - p.d / 3) * 15;
            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
            ctx.stroke();
            if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
          });
          frame = requestAnimationFrame(draw);
        };
        draw();
        const timer = setTimeout(() => { cancelAnimationFrame(frame); canvas.remove(); }, 4000);
        return () => { cancelAnimationFrame(frame); clearTimeout(timer); canvas.remove(); };
     }
  }, [data?.score]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
         <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
         <p className="text-white/80 font-mono uppercase tracking-widest text-xs">Tabulating Results</p>
      </div>
    </div>
  );

  if (isError || !data) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center bg-surface-2 p-8 rounded-2xl border border-white/30 max-w-sm w-full mx-4">
        <AlertTriangle className="w-10 h-10 text-danger mx-auto mb-4" />
        <p className="text-primary font-bold text-lg mb-2">Could not load results</p>
        <p className="text-white/80 text-sm mb-6">There was an issue retrieving your quiz attempt.</p>
        <Link href="/quizzes" className="w-full inline-flex justify-center px-4 py-3 rounded-xl text-sm font-semibold text-black bg-[#1A1A1A] transition-all hover:bg-[#1A1A1A]/90">
           Back to quizzes
        </Link>
      </div>
    </div>
  );

  const hasTopics = data.topic_breakdown && Object.keys(data.topic_breakdown).length > 0;

  return (
    <div className="min-h-screen bg-background">
      <PageWrapper className="max-w-4xl mx-auto py-12 md:py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          {/* Score Header Card */}
          <div className="rounded-3xl p-8 md:p-12 bg-surface-2 border border-white/30 shadow-2xl relative overflow-hidden">
            {/* Ambient Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#1A1A1A]/5 blur-[100px] pointer-events-none" />
            
            <h1 className="text-base text-white/80 font-mono uppercase tracking-widest text-center mb-4">Quiz Complete</h1>
            <ScoreHero score={data.score} correct={data.correct_answers} total={data.total_questions} timeSpent={data.time_spent_seconds} />
            {data.tab_switch_count > 0 && (
              <p className="text-center text-xs mt-6 px-4 py-2 bg-warning/10 border border-warning/30 rounded-lg text-warning mx-auto max-w-xs font-medium inline-block w-full">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                {data.tab_switch_count} tab switch{data.tab_switch_count !== 1 ? "es" : ""} detected
              </p>
            )}
          </div>

          {/* Topic Breakdown */}
          {hasTopics && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="rounded-3xl p-8 bg-surface-2 border border-white/30 shadow-xl overflow-x-auto">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                 <Compass className="w-5 h-5 text-white/80" /> 
                 Topic Breakdown
              </h2>
              <div className="pb-4">
                 <TopicBreakdownChart topicBreakdown={data.topic_breakdown} />
              </div>
            </motion.div>
          )}

          {/* Answer Review */}
          {data.answers.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="rounded-3xl p-8 bg-surface-2 border border-white/30 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1A1A1A]"></span>
                  Review Answers
              </h2>
              <div className="space-y-4">{data.answers.map((a, i) => <AnswerCard key={a.id} answer={a} index={i} />)}</div>
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row gap-4 justify-center pt-8 pb-20">
            <Button asChild variant="outline" className="h-14 px-8 text-base bg-surface-2 border-white/30 text-white hover:bg-surface-2 hover:text-white">
               <Link href={`/quizzes/${data.quiz}/attempt`}>
                  <RefreshCw className="w-4 h-4 mr-2 text-white/80" /> Retry Quiz
               </Link>
            </Button>
            <Button asChild variant="premium" className="h-14 px-8 text-base">
               <Link href="/quizzes">
                  Discover More <Compass className="w-4 h-4 ml-2" />
               </Link>
            </Button>
          </motion.div>

        </motion.div>
      </PageWrapper>
    </div>
  );
}
