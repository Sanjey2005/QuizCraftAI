"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "premium" | "outline" | "ghost" | "danger" | "success";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "premium", size = "default", ...props }, ref) => {
    
    // Base styles
    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none";
    
    // Variant styles
    const variants = {
      premium: `
        border border-white text-white
        bg-[linear-gradient(to_right,white_50%,#0A0A0A_50%)] bg-[length:200%_100%] bg-[position:100%_0]
        hover:bg-[position:0_0] hover:text-[#0A0A0A]
      `,
      outline: "border border-[#2A2A2A] text-[#A0A0A0] hover:text-white hover:border-[#3A3A3A] bg-transparent",
      ghost: "text-[#A0A0A0] hover:text-white hover:bg-[#1A1A1A] bg-transparent border border-transparent",
      danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C] border border-transparent",
      success: "bg-[#16A34A] text-white hover:bg-[#15803D] border border-transparent"
    };

    // Size styles
    const sizes = {
      default: "h-11 px-6 py-3 text-sm",
      sm: "h-9 px-4 py-2 text-xs",
      lg: "h-14 px-8 py-4 text-base",
      icon: "h-10 w-10 p-2",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
