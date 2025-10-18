import { Home, MessageCircle, Users, Store, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, path: "/" },
  { icon: MessageCircle, path: "/chat" },
  { icon: Users, path: "/feed" },
  { icon: Store, path: "/marketplace" },
  { icon: Settings, path: "/settings" },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    // 触感反馈
    haptic.selection();
    navigate(path);
  };

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex justify-around items-stretch h-16 max-w-screen-xl mx-auto px-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <motion.button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 relative",
                "transition-colors duration-150"
              )}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                delay: index * 0.015,
                duration: 0.24,
                ease: [0.16, 1, 0.3, 1]
              }}
              whileTap={{ scale: 0.92 }}
            >
              {/* Active Indicator - 顶部条纹，固定宽度居中 */}
              {isActive && (
                <motion.div
                  className="absolute top-0 w-12 h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 rounded-b-full"
                  style={{
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                  layoutId="activeTab"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              
              {/* Icon Container - 垂直居中 */}
              <motion.div
                className="relative flex items-center justify-center"
                animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {/* Active Background Glow */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-xl blur-md scale-150"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ duration: 0.2 }}
                  />
                )}

                {/* Icon */}
                <motion.div
                  className={cn(
                    "relative z-10 p-2.5 rounded-2xl transition-colors duration-150",
                    isActive
                      ? "bg-gradient-to-br from-indigo-50 to-violet-50"
                      : "hover:bg-gray-50"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-colors duration-150",
                      isActive ? "text-indigo-600" : "text-gray-500"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </motion.div>
              </motion.div>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};
