import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface UseSwipeGestureOptions {
  enabled?: boolean;
  threshold?: number;
  velocity?: number;
  preventScroll?: boolean;
}

export const useSwipeGesture = ({
  enabled = true,
  threshold = 100,
  velocity = 0.3,
  preventScroll = false,
}: UseSwipeGestureOptions = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipingHorizontal, setIsSwipingHorizontal] = useState(false);
  
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const touchCurrentRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 页面路由映射
  const routes = [
    "/",         // Memories
    "/chat",     // Chat  
    "/feed",     // Feed
    "/marketplace", // Marketplace
    "/settings"  // Settings
  ];

  const getCurrentIndex = () => {
    return routes.indexOf(location.pathname);
  };

  const navigateToIndex = (index: number) => {
    if (index >= 0 && index < routes.length) {
      navigate(routes[index]);
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    touchCurrentRef.current = { x: touch.clientX, y: touch.clientY };
    setIsSwipingHorizontal(false);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    touchCurrentRef.current = { x: touch.clientX, y: touch.clientY };

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // 确定滑动方向
    if (!isSwipingHorizontal && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsSwipingHorizontal(true);
    }

    // 如果是横向滑动，更新偏移量
    if (isSwipingHorizontal) {
      if (preventScroll) {
        e.preventDefault();
      }
      
      const currentIndex = getCurrentIndex();
      const maxOffset = window.innerWidth * 0.3; // 最大偏移量
      
      // 限制滑动范围
      let offset = deltaX;
      if ((currentIndex === 0 && deltaX > 0) || 
          (currentIndex === routes.length - 1 && deltaX < 0)) {
        offset = deltaX * 0.3; // 边界阻力
      }
      
      setSwipeOffset(Math.max(-maxOffset, Math.min(maxOffset, offset)));
    }
  };

  const handleTouchEnd = () => {
    if (!enabled || !isSwipingHorizontal) {
      setSwipeOffset(0);
      return;
    }

    const deltaX = touchCurrentRef.current.x - touchStartRef.current.x;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const currentVelocity = Math.abs(deltaX) / deltaTime;
    
    const currentIndex = getCurrentIndex();
    let targetIndex = currentIndex;

    // 判断是否触发页面切换
    if (Math.abs(deltaX) > threshold || currentVelocity > velocity) {
      if (deltaX > 0 && currentIndex > 0) {
        // 向右滑动，切换到上一页
        targetIndex = currentIndex - 1;
      } else if (deltaX < 0 && currentIndex < routes.length - 1) {
        // 向左滑动，切换到下一页
        targetIndex = currentIndex + 1;
      }
    }

    // 重置状态
    setSwipeOffset(0);
    setIsSwipingHorizontal(false);

    // 导航到目标页面
    if (targetIndex !== currentIndex) {
      navigateToIndex(targetIndex);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, isSwipingHorizontal]);

  return {
    containerRef,
    swipeOffset,
    isSwipingHorizontal,
    currentIndex: getCurrentIndex(),
    totalPages: routes.length,
  };
};