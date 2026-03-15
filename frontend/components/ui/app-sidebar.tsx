import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  BarChart2,
  Trophy,
  PlusCircle,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { getStoredUser, type User } from "@/lib/hooks";
import { api } from "@/lib/api";

const INSTRUCTOR_NAV = [
  { href: "/dashboard/instructor", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/quizzes", icon: BookOpen, label: "Browse Quizzes" },
  { href: "/quizzes/generate", icon: PlusCircle, label: "Generate Quiz" },
  { href: "/analytics/me", icon: BarChart2, label: "Analytics" },
];

const STUDENT_NAV = [
  { href: "/dashboard/student", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/quizzes", icon: BookOpen, label: "Browse Quizzes" },
  { href: "/analytics/me", icon: BarChart2, label: "Analytics" },
];

interface Props {
  role?: "instructor" | "student";
}

export function AppSidebar({ role }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const navItems = role === "instructor" ? INSTRUCTOR_NAV : STUDENT_NAV;

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = async () => {
    try { await api.post("/api/auth/token/refresh"); } catch { /* ignore */ }
    localStorage.clear();
    router.push("/login");
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed left-0 top-0 h-full w-64 z-40 flex flex-col custom-scrollbar"
      style={{
        background: "var(--surface-900)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-6 pb-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 hover-target group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-black shadow-lg transition-transform group-hover:scale-105">
            Q
          </div>
          <div>
            <p className="text-white font-bold text-base leading-none">QuizCraft</p>
            <p className="gradient-text text-[11px] font-bold tracking-wide uppercase mt-0.5">AI</p>
          </div>
        </Link>
      </div>

      {/* Role badge */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="glass rounded-xl px-3 py-2.5 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span className="text-white/60 text-xs font-semibold capitalize">
            {role ?? "user"} account
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar">
        <p className="text-white/25 text-[10px] font-bold uppercase tracking-[0.15em] px-3 mb-3">
          Navigation
        </p>
        <div className="space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== "/dashboard/instructor" && href !== "/dashboard/student" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`hover-target flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  isActive
                    ? "text-white bg-gradient-to-r from-blue-600/20 to-violet-600/10 border border-blue-500/30"
                    : "text-white/45 hover:text-white hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full bg-gradient-to-b from-blue-400 to-violet-500"
                  />
                )}
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? "text-blue-400" : "group-hover:text-white/70"
                  }`}
                />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
              </Link>
            );
          })}
        </div>

        {role === "instructor" && (
          <div className="mt-6">
            <p className="text-white/25 text-[10px] font-bold uppercase tracking-[0.15em] px-3 mb-3">
              Quizzes
            </p>
            <div className="space-y-1">
              <Link href="/analytics/quiz" className={`hover-target flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-white/45 hover:text-white hover:bg-white/5`}>
                <Trophy className="w-4 h-4 flex-shrink-0" />
                Leaderboards
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/5 space-y-2">
        {user && (
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/30 to-violet-600/30 border border-white/10 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
              {user.username?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{user.username}</p>
              <p className="text-white/35 text-xs capitalize">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="hover-target flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </motion.aside>
  );
}
