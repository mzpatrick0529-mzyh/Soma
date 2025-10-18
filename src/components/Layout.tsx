import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  // 手势导航集成（注释掉避免类型错误）
  // const { containerRef, swipeOffset, isSwipingHorizontal } = useSwipeGesture({
  //   enabled: true,
  //   threshold: 80,
  //   preventScroll: true,
  // });

  return (
    <div 
      className="min-h-screen"
      // ref={containerRef}
      style={{
        // transform: `translateX(${swipeOffset}px)`,
        // transition: isSwipingHorizontal ? "none" : "transform 0.3s ease-out",
      }}
    >
      {children}
      <BottomNav />
    </div>
  );
};
