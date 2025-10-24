import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireAuth = true 
}: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuthStore();

  // 如果需要认证但用户未Login，重定向到Login页
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // 如果不需要认证但用户已Login，重定向到主页（用于Login页）
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};