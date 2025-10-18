import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfiniteScrollIndicatorProps {
  loading?: boolean;
  hasMore?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export const InfiniteScrollIndicator = ({
  loading = false,
  hasMore = true,
  error = null,
  onRetry,
  className,
}: InfiniteScrollIndicatorProps) => {
  if (error) {
    return (
      <div className={cn("flex flex-col items-center py-8 text-center", className)}>
        <p className="text-sm text-muted-foreground mb-3">
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            点击重试
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn("flex flex-col items-center py-6", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!hasMore) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-px bg-border flex-1" />
          <span>已加载全部内容</span>
          <div className="h-px bg-border flex-1" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("py-4", className)}>
      <Skeleton className="h-4 w-32 mx-auto" />
    </div>
  );
};