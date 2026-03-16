"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

const NO_SIDEBAR_ROUTES = ["/", "/login", "/register"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideSidebar =
    NO_SIDEBAR_ROUTES.includes(pathname) || pathname.endsWith("/attempt");

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className="flex-1 min-h-screen overflow-y-auto bg-background"
      >
        {children}
      </main>
    </div>
  );
}
