"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { getStoredUser, clearUser, type User } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const STUDENT_LINKS = [
  { href: "/quizzes", label: "Discover" },
  { href: "/analytics/me", label: "My Analytics" },
  { href: "/dashboard/student", label: "Dashboard" },
];

const INSTRUCTOR_LINKS = [
  { href: "/dashboard/instructor", label: "My Quizzes" },
  { href: "/quizzes/generate", label: "Generate" },
  { href: "/quizzes", label: "Discover" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  return (
    <header
      className="sticky top-0 z-50 h-16 backdrop-blur-xl border-b border-white/10"
      style={{ background: "rgba(8,13,26,0.85)" }}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-black shadow-lg transition-transform group-hover:scale-105">
            Q
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            QuizCraft <span className="gradient-text">AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3.5 py-2 rounded-lg text-sm font-medium transition-all",
                isActive(href)
                  ? "text-blue-400 bg-white/8 border border-blue-500/30"
                  : "text-white/55 hover:text-white hover:bg-white/5"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/30 to-violet-600/30 border border-white/10 flex items-center justify-center text-white text-sm font-black">
                  {user.username?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-white leading-none">{user.username}</p>
                  <p className="text-white/35 text-xs capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-white/35 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3.5 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn-primary text-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-white/50 hover:bg-white/5"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden border-b border-white/10 px-6 pb-4 space-y-1"
          style={{ background: "var(--surface-800)" }}
        >
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive(href)
                  ? "text-blue-400 bg-white/8"
                  : "text-white/55 hover:text-white hover:bg-white/5"
              )}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/5 mt-2">
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg w-full"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-white/55"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
