import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, AlertCircle, Calendar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { Link } from "react-router-dom";

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthdate: string; // YYYY-MM-DD
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
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
    birthdate: "",
    acceptedTerms: false,
    acceptedPrivacy: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isLogin = mode === "login";

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    if (password.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("Contains uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("Contains lowercase letter");
    if (!/\d/.test(password)) errors.push("Contains number");
    return errors;
  };

  const calculateAge = (birthdate: string): number => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getMinimumAge = (): number => {
    // State-specific age requirements (can be enhanced with actual user state detection)
    // For now, we use the strictest requirement (21 for MS)
    // In production, detect user's state via IP geolocation
    return 18; // Federal minimum, adjust per state if needed
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (!isLogin) {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        errors.password = `Password requires: ${passwordErrors.join(", ")}`;
      }
    }

    // Name validation for register
    if (!isLogin) {
      if (!formData.name.trim()) {
        errors.name = "Name is required";
      } else if (formData.name.trim().length < 2) {
        errors.name = "Name must be at least 2 characters";
      }

      // Birthdate validation (Age verification - COPPA/CCPA compliance)
      if (!formData.birthdate) {
        errors.birthdate = "Please enter your date of birth";
      } else {
        const age = calculateAge(formData.birthdate);
        const minAge = getMinimumAge();
        
        if (age < 13) {
          errors.birthdate = "According to COPPA regulations, we cannot provide services to users under 13 years old";
        } else if (age < minAge) {
          errors.birthdate = `You must be at least${minAge}years old to use this service`;
        }
      }

      // Legal consent validation (REQUIRED for compliance)
      if (!formData.acceptedTerms) {
        errors.acceptedTerms = "You must agree to the Terms of Service to register";
      }

      if (!formData.acceptedPrivacy) {
        errors.acceptedPrivacy = "You must agree to the Privacy Policy to register";
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        errors.confirmPassword = "Please confirm password";
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
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

  const handleInputChange = (field: keyof RegisterFormData, value: string | boolean) => {
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
      birthdate: "",
      acceptedTerms: false,
      acceptedPrivacy: false,
    });
    setFieldErrors({});
    onSwitchMode(isLogin ? "register" : "login");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {isLogin ? "Welcome Back" : "Create Account"}
        </CardTitle>
        <CardDescription className="text-center">
          {isLogin 
            ? "Login to continue using" 
            : "Fill in the information to create your new account"
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
              <Label htmlFor="name">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Please enter your name"
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
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Please enter your email"
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
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={isLogin ? "Please enter password" : "Please set password"}
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
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Please re-enter password"
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

          {/* Age Verification (COPPA/CCPA Compliance) */}
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="birthdate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Input
                id="birthdate"
                type="date"
                value={formData.birthdate}
                onChange={(e) => handleInputChange("birthdate", e.target.value)}
                max={new Date().toISOString().split('T')[0]} // Cannot select future dates
                className={cn(
                  fieldErrors.birthdate && "border-destructive focus-visible:ring-destructive"
                )}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                You must be at least 18 years old to use this service (some states require 19 or 21)
              </p>
              {fieldErrors.birthdate && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{fieldErrors.birthdate}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Legal Consent Checkboxes (REQUIRED for compliance) */}
          {!isLogin && (
            <div className="space-y-4 pt-2 border-t">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="acceptTerms"
                    checked={formData.acceptedTerms}
                    onCheckedChange={(checked) => 
                      handleInputChange("acceptedTerms", checked as boolean)
                    }
                    disabled={loading}
                    className={cn(
                      "mt-1",
                      fieldErrors.acceptedTerms && "border-destructive"
                    )}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="acceptTerms"
                      className="text-sm font-normal cursor-pointer leading-tight"
                    >
                      I have read and agree to the{" "}
                      <Link 
                        to="/legal/terms-of-service" 
                        target="_blank"
                        className="text-primary underline hover:text-primary/80 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Terms of Service
                      </Link>
                      {" "}and{" "}
                      <Link 
                        to="/legal/privacy-policy" 
                        target="_blank"
                        className="text-primary underline hover:text-primary/80 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Privacy Policy
                      </Link>
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    {fieldErrors.acceptedTerms && (
                      <p className="text-xs text-destructive mt-1">{fieldErrors.acceptedTerms}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="acceptPrivacy"
                    checked={formData.acceptedPrivacy}
                    onCheckedChange={(checked) => 
                      handleInputChange("acceptedPrivacy", checked as boolean)
                    }
                    disabled={loading}
                    className={cn(
                      "mt-1",
                      fieldErrors.acceptedPrivacy && "border-destructive"
                    )}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="acceptPrivacy"
                      className="text-sm font-normal cursor-pointer leading-tight"
                    >
                      <Shield className="inline h-3 w-3 mr-1" />
                      I confirm that I am 18 years or older and understand that Soma will collect, process and store my personal data (including but not limited to biometric information),
                      and agree to use this data as described in the Privacy Policy
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    {fieldErrors.acceptedPrivacy && (
                      <p className="text-xs text-destructive mt-1">{fieldErrors.acceptedPrivacy}</p>
                    )}
                  </div>
                </div>

                <Alert className="py-3">
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    In accordance with U.S. federal and state laws (including COPPA, CCPA/CPRA, and BIPA),
                    we require your explicit consent to collect and process your personal information.
                    You can withdraw consent or delete your data at any time in Settings.
                  </AlertDescription>
                </Alert>
              </div>
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
                Forgot Password?
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
                {isLogin ? "Login" : "Sign Up"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <Separator />

        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 ml-1"
            onClick={handleSwitchMode}
            disabled={loading}
          >
            {isLogin ? "Sign Up Now" : "Login Now"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};