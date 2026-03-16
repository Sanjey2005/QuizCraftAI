"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  School,
  Sparkles,
  Compass,
  BarChart2,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { getStoredUser, clearUser, type User } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
}

const INSTRUCTOR_LINKS: NavLink[] = [
  { href: "/dashboard/instructor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classrooms", label: "Classrooms", icon: School },
  { href: "/quizzes/generate", label: "Generate Quiz", icon: Sparkles },
  { href: "/quizzes", label: "Discover", icon: Compass },
];

const STUDENT_LINKS: NavLink[] = [
  { href: "/dashboard/student", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classrooms", label: "My Classrooms", icon: School },
  { href: "/quizzes", label: "Discover", icon: Compass },
  { href: "/analytics/me", label: "My Analytics", icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center gap-3 shrink-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black"
          style={{ backgroundColor: "#2563EB" }}
        >
          Q
        </div>
        <span className="font-bold text-[15px] tracking-tight text-white">
          QuizCraft AI
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-2 space-y-0.5 overflow-y-auto custom-scrollbar">
        {links.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                active
                  ? "text-white border-l-[3px] border-white bg-[#1A1A1A] rounded-l-none -ml-3 pl-[14px]"
                  : "text-[#555555] hover:text-[#A0A0A0] hover:bg-[#1A1A1A]"
              )}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      {user && (
        <div className="px-3 pb-4 mt-auto">
          <div className="border-t border-[#2A2A2A] pt-4">
            <div className="flex items-center gap-3 px-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-[#0A0A0A] text-xs font-bold shrink-0"
              >
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.username}
                </p>
                <p className="text-[11px] text-[#A0A0A0] capitalize">
                  {user.role}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-[#555555] hover:text-white hover:bg-[#1A1A1A] transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#111111] border border-[#2A2A2A] text-white shadow-sm md:hidden"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 border-r border-[#2A2A2A]"
        style={{ width: 240, backgroundColor: "#111111" }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside
            className="relative flex flex-col h-full animate-fade-in border-r border-[#2A2A2A]"
            style={{ width: 240, backgroundColor: "#111111" }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 p-1.5 rounded-md text-[#555555] hover:text-white hover:bg-[#1A1A1A]"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
