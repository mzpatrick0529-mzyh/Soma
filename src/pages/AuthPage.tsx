import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/AuthForm";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { login, register, isLoading, error, isAuthenticated, clearError } = useAuthStore();
  const navigate = useNavigate();

  // 如果已经登录，重定向到主页
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // 清除错误信息
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      await login({ email: data.email, password: data.password });
      toast.success("登录成功，欢迎回来！");
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleRegister = async (data: { 
    name: string; 
    email: string; 
    password: string; 
    confirmPassword: string; 
  }) => {
    try {
      await register({ name: data.name, email: data.email, password: data.password });
      toast.success("注册成功，欢迎加入！");
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleForgotPassword = () => {
    toast.info("密码重置功能开发中...");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
            Synapse Weave
          </h1>
          <p className="text-muted-foreground">
            连接记忆，编织未来
          </p>
        </div>

        <AuthForm
          mode={mode}
          onSubmit={mode === "login" ? handleLogin : handleRegister}
          onSwitchMode={setMode}
          onForgotPassword={handleForgotPassword}
          loading={isLoading}
          error={error || undefined}
        />

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>测试账户：test@example.com</p>
          <p>密码：password123</p>
        </div>
      </div>
    </div>
  );
};