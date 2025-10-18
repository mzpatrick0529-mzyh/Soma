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

  // 如果需要认证但用户未登录，重定向到登录页
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // 如果不需要认证但用户已登录，重定向到主页（用于登录页）
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};