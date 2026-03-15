"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { CustomCursor } from "@/components/ui/custom-cursor";

const HIDE_NAVBAR_ROUTES = ["/", "/login", "/register"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideNavbar = HIDE_NAVBAR_ROUTES.includes(pathname) ||
    pathname.endsWith("/attempt");

  return (
    <>
      <CustomCursor />
      {!hideNavbar && <Navbar />}
      {children}
    </>
  );
}
