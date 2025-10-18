import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "card" | "text" | "avatar" | "button";
  shimmer?: boolean;
}

function Skeleton({ 
  className, 
  variant = "default", 
  shimmer = true, 
  ...props 
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/50",
        shimmer && [
          "relative overflow-hidden",
          "before:absolute before:inset-0",
          "before:-translate-x-full before:bg-gradient-to-r",
          "before:from-transparent before:via-white/20 before:to-transparent",
          "before:animate-shimmer"
        ],
        {
          "h-4": variant === "text",
          "h-10 w-10 rounded-full": variant === "avatar",
          "h-9 w-20 rounded-md": variant === "button",
          "h-48 rounded-lg": variant === "card",
        },
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
