import { useLoading } from "@/stores/appStore";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlobalLoadingProps {
  className?: string;
}

export const GlobalLoading = ({ className }: GlobalLoadingProps) => {
  const { isLoading, loadingMessage, progress } = useLoading();

  if (!isLoading) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      "bg-background/80 backdrop-blur-sm",
      className
    )}>
      <div className="bg-card border rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          {/* 加载动画 */}
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            {progress !== undefined && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-xs font-medium text-primary">
                  {Math.round(progress)}%
                </div>
              </div>
            )}
          </div>
          
          {/* 加载文字 */}
          <div className="text-center">
            <p className="font-medium text-foreground">
              {loadingMessage || "加载中..."}
            </p>
            
            {progress !== undefined && (
              <div className="mt-2 w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 简化版的内联加载组件
interface InlineLoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const InlineLoading = ({ 
  message = "加载中...", 
  size = "md",
  className 
}: InlineLoadingProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      <span className={cn("text-muted-foreground", textSizeClasses[size])}>
        {message}
      </span>
    </div>
  );
};