"use client";

import { PlusIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Logo = {
  src: string;
  alt: string;
};

const LOGOS: Logo[] = [
  { src: "https://svgl.app/library/nvidia_wordmark.svg",  alt: "NVIDIA" },
  { src: "https://svgl.app/library/nextjs_icon_dark.svg", alt: "Next.js" },
  { src: "https://svgl.app/library/django.svg",           alt: "Django" },
  { src: "https://svgl.app/library/postgresql.svg",       alt: "PostgreSQL" },
  { src: "https://svgl.app/library/redis.svg",            alt: "Redis" },
  { src: "https://svgl.app/library/tailwindcss.svg",      alt: "Tailwind CSS" },
  { src: "https://svgl.app/library/vercel_wordmark.svg",  alt: "Vercel" },
  { src: "https://svgl.app/library/railway-light.svg",    alt: "Railway" },
];

function LogoCard({
  logo,
  className,
  children,
}: {
  logo: Logo;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center bg-[#0A0A0A] px-4 py-10 md:p-12",
        className
      )}
    >
      <img
        src={logo.src}
        alt={logo.alt}
        className="pointer-events-none h-5 select-none brightness-0 invert"
        height="auto"
        width="auto"
      />
      {children}
    </div>
  );
}

export function LogoCloud() {
  return (
    <section className="py-32 px-6 border-t border-[#2A2A2A]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <h2 className="text-center text-[#A0A0A0] text-base font-medium mb-10 tracking-tight">
          Built on industry-leading technology
        </h2>

        <div className="relative grid grid-cols-2 border-x border-[#2A2A2A] md:grid-cols-4">
          {/* Full-width top border */}
          <div className="-translate-x-1/2 -top-px pointer-events-none absolute left-1/2 w-screen border-t border-[#2A2A2A]" />

          {/* Row 1 */}
          <LogoCard logo={LOGOS[0]} className="relative border-r border-b border-[#2A2A2A] bg-[#111111]">
            <PlusIcon className="-right-[12.5px] -bottom-[12.5px] absolute z-10 size-6 text-[#2A2A2A]" strokeWidth={1} />
          </LogoCard>

          <LogoCard logo={LOGOS[1]} className="border-b border-[#2A2A2A] md:border-r md:border-[#2A2A2A]" />

          <LogoCard logo={LOGOS[2]} className="relative border-r border-b border-[#2A2A2A] md:bg-[#111111]">
            <PlusIcon className="-right-[12.5px] -bottom-[12.5px] absolute z-10 size-6 text-[#2A2A2A]" strokeWidth={1} />
            <PlusIcon className="-bottom-[12.5px] -left-[12.5px] absolute z-10 hidden size-6 text-[#2A2A2A] md:block" strokeWidth={1} />
          </LogoCard>

          <LogoCard logo={LOGOS[3]} className="border-b border-[#2A2A2A] bg-[#111111] md:bg-[#0A0A0A]" />

          {/* Row 2 */}
          <LogoCard logo={LOGOS[4]} className="relative border-r border-[#2A2A2A] bg-[#111111] md:bg-[#0A0A0A]" />

          <LogoCard logo={LOGOS[5]} className="md:border-r md:border-[#2A2A2A]" />

          <LogoCard logo={LOGOS[6]} className="border-r border-[#2A2A2A]" />

          <LogoCard logo={LOGOS[7]} className="bg-[#111111]" />

          {/* Full-width bottom border */}
          <div className="-translate-x-1/2 -bottom-px pointer-events-none absolute left-1/2 w-screen border-b border-[#2A2A2A]" />
        </div>
      </motion.div>
    </section>
  );
}
