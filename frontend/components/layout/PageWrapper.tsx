import { cn } from "@/lib/utils";

export function PageWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-[1200px] mx-auto px-6 pt-8 pb-12", className)}>
      {children}
    </div>
  );
}
