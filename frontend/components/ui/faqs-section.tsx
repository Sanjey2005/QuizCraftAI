"use client";

import { motion } from "framer-motion";
import { AccordionItem } from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    id: "faq-1",
    question: "How does the AI quiz generation work?",
    answer:
      "QuizCraft AI uses Meta's Llama 3.1 70B model via NVIDIA NIM. You provide a topic or upload a PDF/DOCX file, and the AI generates questions with exactly 4 answer choices per question — one correct, three plausible distractors — plus difficulty scores and topic tags. Generation typically completes in under 30 seconds.",
  },
  {
    id: "faq-2",
    question: "What file formats can I upload for quiz generation?",
    answer:
      "QuizCraft AI accepts PDF and DOCX files. Text is extracted server-side, analyzed for content, and used to craft curriculum-aligned questions. You can also generate quizzes from a plain topic prompt without uploading any file.",
  },
  {
    id: "faq-3",
    question: "Can students see correct answers during a quiz?",
    answer:
      "No. Correct answers are never sent to the client during an active attempt. All grading happens server-side when the student submits. Question order is randomized per attempt and stored on the server, so it cannot be manipulated by the student.",
  },
  {
    id: "faq-4",
    question: "What are classrooms and how do I use them?",
    answer:
      "Instructors can create a classroom which auto-generates a unique 6-character join code. Students enter that code to enroll. Once inside, instructors assign quizzes to the classroom and students only see quizzes assigned to their enrolled classrooms — keeping everything organized per class.",
  },
  {
    id: "faq-5",
    question: "Can I edit or regenerate individual questions before publishing?",
    answer:
      "Yes. After generation completes you are taken to the quiz editor where you can preview every question and its choices. If a question is unsatisfactory, click the regenerate button on that specific question to replace just that one via AI, without affecting the rest of the quiz.",
  },
  {
    id: "faq-6",
    question: "Can I schedule when a quiz becomes available?",
    answer:
      "Yes. Each quiz has an optional availability window with 'available from' and 'available until' fields. Students can only start the quiz within that window. If no window is set, the quiz is always available once published.",
  },
  {
    id: "faq-7",
    question: "Is my data secure and how are accounts protected?",
    answer:
      "Authentication uses JWT tokens stored in httpOnly cookies — they are never accessible to JavaScript, protecting against XSS attacks. All scoring and answer validation is strictly server-side. Tab switches during a quiz are recorded per attempt and visible to the instructor.",
  },
];

export function FaqsSection() {
  return (
    <section className="py-32 px-6 border-t border-[#2A2A2A]">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            Frequently Asked Questions
          </h2>
          <p className="text-[#A0A0A0] text-lg">
            Everything you need to know about QuizCraft AI.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem
              key={item.id}
              title={<span className="text-white font-medium">{item.question}</span>}
              defaultOpen={index === 0}
              className="border-[#2A2A2A]"
            >
              <p className="text-[#A0A0A0] leading-relaxed">{item.answer}</p>
            </AccordionItem>
          ))}
        </motion.div>

        <p className="mt-8 text-[#555555] text-sm">
          Still have questions?{" "}
          <a href="mailto:support@quizcraft.ai" className="text-white hover:underline transition-colors">
            Contact support
          </a>
        </p>
      </div>
    </section>
  );
}
