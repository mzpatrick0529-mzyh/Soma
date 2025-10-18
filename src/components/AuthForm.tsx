import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (data: LoginFormData | RegisterFormData) => Promise<void>;
  onSwitchMode: (mode: "login" | "register") => void;
  onForgotPassword?: () => void;
  loading?: boolean;
  error?: string;
}

export const AuthForm = ({
  mode,
  onSubmit,
  onSwitchMode,
  onForgotPassword,
  loading = false,
  error,
}: AuthFormProps) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isLogin = mode === "login";

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push("至少8个字符");
    if (!/[A-Z]/.test(password)) errors.push("包含大写字母");
    if (!/[a-z]/.test(password)) errors.push("包含小写字母");
    if (!/\d/.test(password)) errors.push("包含数字");
    return errors;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      errors.email = "邮箱不能为空";
    } else if (!validateEmail(formData.email)) {
      errors.email = "请输入有效的邮箱地址";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "密码不能为空";
    } else if (!isLogin) {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        errors.password = `密码需要: ${passwordErrors.join(", ")}`;
      }
    }

    // Name validation for register
    if (!isLogin) {
      if (!formData.name.trim()) {
        errors.name = "姓名不能为空";
      } else if (formData.name.trim().length < 2) {
        errors.name = "姓名至少2个字符";
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        errors.confirmPassword = "请确认密码";
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "两次输入的密码不一致";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      haptic.error();
      return;
    }

    haptic.medium();

    try {
      if (isLogin) {
        await onSubmit({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await onSubmit({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });
      }
      haptic.success();
    } catch (error) {
      haptic.error();
    }
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSwitchMode = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setFieldErrors({});
    onSwitchMode(isLogin ? "register" : "login");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {isLogin ? "欢迎回来" : "创建账户"}
        </CardTitle>
        <CardDescription className="text-center">
          {isLogin 
            ? "登录您的账户以继续使用" 
            : "填写信息创建您的新账户"
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="请输入您的姓名"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={cn(
                    "pl-9",
                    fieldErrors.name && "border-destructive focus-visible:ring-destructive"
                  )}
                  disabled={loading}
                />
              </div>
              {fieldErrors.name && (
                <p className="text-sm text-destructive">{fieldErrors.name}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="请输入您的邮箱"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={cn(
                  "pl-9",
                  fieldErrors.email && "border-destructive focus-visible:ring-destructive"
                )}
                disabled={loading}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-sm text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={isLogin ? "请输入密码" : "请设置密码"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={cn(
                  "pl-9 pr-9",
                  fieldErrors.password && "border-destructive focus-visible:ring-destructive"
                )}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {fieldErrors.password && (
              <p className="text-sm text-destructive">{fieldErrors.password}</p>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="请再次输入密码"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={cn(
                    "pl-9 pr-9",
                    fieldErrors.confirmPassword && "border-destructive focus-visible:ring-destructive"
                  )}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          )}

          {isLogin && onForgotPassword && (
            <div className="text-right">
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-sm"
                onClick={onForgotPassword}
                disabled={loading}
              >
                忘记密码？
              </Button>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? "登录" : "注册"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <Separator />

        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            {isLogin ? "还没有账户？" : "已有账户？"}
          </span>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 ml-1"
            onClick={handleSwitchMode}
            disabled={loading}
          >
            {isLogin ? "立即注册" : "立即登录"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};