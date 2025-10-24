import { ReactNode, useRef, useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
  maxPullDistance?: number;
}

export const PullToRefresh = ({
  children,
  onRefresh,
  disabled = false,
  threshold = 60,
  maxPullDistance = 120,
}: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isAtTop = useRef(true);

  const checkIfAtTop = () => {
    if (!containerRef.current) return false;
    return containerRef.current.scrollTop === 0;
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    isAtTop.current = checkIfAtTop();
    if (isAtTop.current) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || isRefreshing || !isPulling || !isAtTop.current) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    
    if (distance > 0) {
      e.preventDefault();
      const dampedDistance = Math.min(
        distance * 0.5, // 阻尼效果
        maxPullDistance
      );
      setPullDistance(dampedDistance);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing || !isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [disabled, isRefreshing, isPulling, pullDistance, threshold]);

  const getRefreshIndicatorState = () => {
    if (isRefreshing) return "refreshing";
    if (pullDistance >= threshold) return "ready";
    if (pullDistance > 0) return "pulling";
    return "idle";
  };

  const refreshState = getRefreshIndicatorState();
  const indicatorOpacity = Math.min(pullDistance / threshold, 1);
  const rotation = isRefreshing ? 360 : (pullDistance / threshold) * 180;

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto h-full"
      style={{
        transform: `translateY(${isPulling ? pullDistance * 0.3 : 0}px)`,
        transition: isPulling ? "none" : "transform 0.3s ease-out",
      }}
    >
      {/* Refresh指示器 */}
      <div
        className={cn(
          "absolute top-0 left-1/2 transform -translate-x-1/2 z-50",
          "flex items-center justify-center w-12 h-12",
          "bg-background/80 backdrop-blur-sm rounded-full shadow-lg",
          "transition-all duration-300 ease-out"
        )}
        style={{
          transform: `translateY(${pullDistance > 0 ? pullDistance - 60 : -60}px)`,
          opacity: indicatorOpacity,
        }}
      >
        <RotateCcw
          className={cn(
            "w-6 h-6 text-primary transition-transform duration-300",
            isRefreshing && "animate-spin"
          )}
          style={{
            transform: `rotate(${rotation}deg)`,
          }}
        />
      </div>

      {/* 状态文字 */}
      {pullDistance > 0 && (
        <div
          className={cn(
            "absolute top-0 left-1/2 transform -translate-x-1/2 z-40",
            "text-xs text-muted-foreground text-center mt-14 px-2 py-1",
            "bg-background/60 backdrop-blur-sm rounded-md",
            "transition-all duration-300 ease-out"
          )}
          style={{
            transform: `translateY(${pullDistance - 60}px)`,
            opacity: indicatorOpacity,
          }}
        >
          {refreshState === "pulling" && "下拉Refresh"}
          {refreshState === "ready" && "松开Refresh"}
          {refreshState === "refreshing" && "正在Refresh..."}
        </div>
      )}

      {children}
    </div>
  );
};