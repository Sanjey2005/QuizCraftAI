"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  School,
  Sparkles,
  Compass,
  BarChart2,
  LogOut,
  Brain,
} from "lucide-react";
import { getStoredUser, clearUser, type User } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import {
  SidebarPrimitive,
  SidebarBody,
  DesktopSidebar,
  MobileSidebar,
  SidebarLinkItem,
  useSidebar,
} from "@/components/ui/sidebar-primitives";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const INSTRUCTOR_LINKS: NavLink[] = [
  { href: "/dashboard/instructor", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5 shrink-0 text-[#555555]" /> },
  { href: "/classrooms", label: "Classrooms", icon: <School className="w-5 h-5 shrink-0 text-[#555555]" /> },
  { href: "/quizzes/generate", label: "Generate Quiz", icon: <Sparkles className="w-5 h-5 shrink-0 text-[#555555]" /> },
  { href: "/quizzes", label: "Discover", icon: <Compass className="w-5 h-5 shrink-0 text-[#555555]" /> },
];

const STUDENT_LINKS: NavLink[] = [
  { href: "/dashboard/student", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5 shrink-0 text-[#555555]" /> },
  { href: "/classrooms", label: "My Classrooms", icon: <School className="w-5 h-5 shrink-0 text-[#555555]" /> },
  { href: "/quizzes", label: "Discover", icon: <Compass className="w-5 h-5 shrink-0 text-[#555555]" /> },
  { href: "/analytics/me", label: "My Analytics", icon: <BarChart2 className="w-5 h-5 shrink-0 text-[#555555]" /> },
];

function SidebarContent() {
  const { open, animate } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = () => {
    clearUser();
    router.push("/login");
  };

  const links = user?.role === "instructor" ? INSTRUCTOR_LINKS : STUDENT_LINKS;

  const isActive = (href: string) => {
    if (href === "/quizzes") return pathname === "/quizzes";
    return pathname.startsWith(href);
  };

  const userInitial = user?.username?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 px-2 py-3 mb-2 shrink-0 hover:opacity-80 transition-opacity"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
          style={{ backgroundColor: "#2563EB" }}
        >
          <Brain className="w-4 h-4" />
        </div>
        <motion.span
          animate={{
            display: animate ? (open ? "inline-block" : "none") : "inline-block",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          transition={{ duration: 0.15 }}
          className="font-bold text-[15px] tracking-tight text-white whitespace-pre"
        >
          QuizCraft AI
        </motion.span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto custom-scrollbar">
        {links.map(({ href, label, icon }) => {
          const active = isActive(href);
          return (
            <SidebarLinkItem
              key={href}
              link={{ href, label, icon }}
              className={cn(
                "transition-all duration-150",
                active
                  ? "text-white bg-[#1A1A1A] border-l-[3px] border-white rounded-l-none"
                  : "hover:bg-[#1A1A1A]"
              )}
            />
          );
        })}
      </nav>

      {/* User section */}
      {user && (
        <div className="mt-auto pt-4 border-t border-[#2A2A2A]">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-[#0A0A0A] text-xs font-bold shrink-0">
              {userInitial}
            </div>
            <motion.div
              animate={{
                display: animate ? (open ? "flex" : "none") : "flex",
                opacity: animate ? (open ? 1 : 0) : 1,
              }}
              transition={{ duration: 0.15 }}
              className="flex-1 min-w-0 flex items-center justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.username}</p>
                <p className="text-[11px] text-[#A0A0A0] capitalize">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-[#555555] hover:text-white hover:bg-[#1A1A1A] transition-colors ml-2 shrink-0"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <SidebarPrimitive open={open} setOpen={setOpen}>
      <SidebarBody>
        <DesktopSidebar>
          <SidebarContent />
        </DesktopSidebar>
        <MobileSidebar>
          <SidebarContent />
        </MobileSidebar>
      </SidebarBody>
    </SidebarPrimitive>
  );
}
