import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";

type Placement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end";

interface ActionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  options: {
    icon: ReactNode;
    label: string;
    onClick: () => void;
  }[];
  anchorRef?: React.RefObject<HTMLElement>;
  placement?: Placement;
  offset?: { x?: number; y?: number };
  className?: string;
  title?: string;
}

export const ActionPopup = ({
  isOpen,
  onClose,
  options,
  anchorRef,
  placement = "bottom-end",
  offset,
  className,
  title = "Choose an option",
}: ActionPopupProps) => {
  const [style, setStyle] = useState<React.CSSProperties>({});

  const calcPosition = () => {
    const anchor = anchorRef?.current;
    if (!anchor) {
      // fallback: fixed to bottom-right (旧行为)
      setStyle({ bottom: 96, right: 24 });
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const ox = offset?.x ?? 0;
    const oy = offset?.y ?? 8;

    // 使用 fixed 坐标，避免滚动影响
    switch (placement) {
      case "bottom-start":
        setStyle({ top: rect.bottom + oy, left: rect.left + ox });
        break;
      case "bottom-end":
        setStyle({ top: rect.bottom + oy, right: Math.max(8, window.innerWidth - rect.right - ox) });
        break;
      case "top-start":
        setStyle({ bottom: window.innerHeight - rect.top + oy, left: rect.left + ox });
        break;
      case "top-end":
      default:
        setStyle({ bottom: window.innerHeight - rect.top + oy, right: Math.max(8, window.innerWidth - rect.right - ox) });
        break;
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    calcPosition();
    const onResize = () => calcPosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [isOpen, placement, anchorRef?.current]);

  const handleClose = () => {
    haptic.light();
    onClose();
  };

  const handleOptionClick = (option: any) => {
    haptic.medium();
    option.onClick();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300,
              duration: 0.3
            }}
            className={cn("fixed z-50", className)} 
            style={style}
          >
            <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/30 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <X size={16} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              
              {/* Options */}
              <div className="p-2">
                {options.map((option, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ 
                      scale: 1.02,
                      backgroundColor: "rgba(255, 255, 255, 0.7)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOptionClick(option)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-200 group"
                  >
                    <motion.div 
                      className="text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors"
                      whileHover={{ scale: 1.1 }}
                    >
                      {option.icon}
                    </motion.div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                      {option.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
