import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { forwardRef } from "react";
import { motion } from "framer-motion";

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
  fixed?: boolean; // 是否使用固定定位（默认 true）
}

export const FloatingActionButton = forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
({ onClick, className, fixed = true }, ref) => {
  const handleClick = () => {
    haptic.medium(); // 中等强度触感反馈
    onClick();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(fixed && "fixed bottom-20 right-6", "z-50")}
    >
      <Button
        ref={ref}
        onClick={handleClick}
        className={cn(
          "h-14 w-14 rounded-full p-0 shadow-2xl backdrop-blur-xl bg-gradient-to-br from-blue-500/90 to-purple-600/90 hover:from-blue-600/90 hover:to-purple-700/90 border border-white/30",
          "transition-all duration-300 ease-out",
          className
        )}
        size="icon"
      >
        <Plus className="h-7 w-7 text-white stroke-[2.5]" />
      </Button>
    </motion.div>
  );
});

FloatingActionButton.displayName = "FloatingActionButton";
