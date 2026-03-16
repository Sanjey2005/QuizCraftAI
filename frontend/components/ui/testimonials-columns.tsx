"use client";

import React from "react";
import { motion } from "framer-motion";

type Testimonial = {
  text: string;
  image: string;
  name: string;
  role: string;
};

const testimonials: Testimonial[] = [
  // Column 1
  {
    text: "QuizCraft AI saved me hours every week. I drop in my lecture slides and get a ready-to-assign quiz in under a minute. My students love the experience.",
    image: "https://randomuser.me/api/portraits/women/11.jpg",
    name: "Ms. Priya Nair",
    role: "High School Teacher",
  },
  {
    text: "The topic breakdown analytics are incredible. I can immediately see which concepts students are struggling with and adjust my lessons accordingly.",
    image: "https://randomuser.me/api/portraits/men/22.jpg",
    name: "Dr. James Whitfield",
    role: "University Lecturer",
  },
  {
    text: "Being able to set availability windows means I can schedule assessments in advance and never worry about opening them manually.",
    image: "https://randomuser.me/api/portraits/women/33.jpg",
    name: "Sarah Kim",
    role: "Online Course Creator",
  },
  // Column 2
  {
    text: "I joined my classroom with a 6-letter code in seconds. Taking quizzes on QuizCraft feels smooth and fair — the timer never glitched once.",
    image: "https://randomuser.me/api/portraits/men/44.jpg",
    name: "Arjun Mehta",
    role: "Student",
  },
  {
    text: "The leaderboard after each quiz makes learning genuinely competitive. Our class engagement has gone up noticeably since we started using it.",
    image: "https://randomuser.me/api/portraits/women/55.jpg",
    name: "Fatima Al-Rashid",
    role: "Student",
  },
  {
    text: "The per-question regeneration feature is a game changer. If an AI-generated question is off-topic, I fix it without starting the whole quiz over.",
    image: "https://randomuser.me/api/portraits/men/66.jpg",
    name: "Carlos Rivera",
    role: "Instructor",
  },
  // Column 3
  {
    text: "We rolled QuizCraft AI out to 200 students in a single day. Zero setup friction, and the classroom management tools are exactly what we needed.",
    image: "https://randomuser.me/api/portraits/men/77.jpg",
    name: "Principal Thomas O'Brien",
    role: "Academy Director",
  },
  {
    text: "Server-side scoring gives me full confidence in the results. No browser tricks, no cheating — the integrity system just works.",
    image: "https://randomuser.me/api/portraits/women/88.jpg",
    name: "Dr. Aisha Bello",
    role: "Assessment Specialist",
  },
  {
    text: "Uploading a DOCX lecture note and getting 10 curriculum-aligned questions in 20 seconds is something I still find impressive every time I use it.",
    image: "https://randomuser.me/api/portraits/men/99.jpg",
    name: "Prof. Li Wei",
    role: "Computer Science Dept.",
  },
];

const firstColumn  = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn  = testimonials.slice(6, 9);

export function TestimonialsColumn({
  className,
  testimonials: items,
  duration = 10,
}: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) {
  return (
    <div className={className}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[...new Array(2).fill(0)].map((_, outerIndex) => (
          <React.Fragment key={outerIndex}>
            {items.map(({ text, image, name, role }, i) => (
              <div
                key={i}
                className="p-8 rounded-lg border border-[#2A2A2A] bg-[#111111] max-w-xs w-full"
              >
                <p className="text-[#A0A0A0] leading-relaxed text-sm">{text}</p>
                <div className="flex items-center gap-3 mt-5">
                  <img
                    src={image}
                    alt={name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-white text-sm leading-5">{name}</span>
                    <span className="text-[#555555] text-xs leading-5">{role}</span>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="py-32 px-6 border-t border-[#2A2A2A]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center max-w-[540px] mx-auto mb-16"
        >
          <div className="border border-[#2A2A2A] py-1 px-4 rounded-lg text-[#A0A0A0] text-sm mb-5">
            Testimonials
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight text-center text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            Loved by teachers and students
          </h2>
          <p className="text-center mt-4 text-[#A0A0A0]">
            See what educators and learners say about QuizCraft AI.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
}
