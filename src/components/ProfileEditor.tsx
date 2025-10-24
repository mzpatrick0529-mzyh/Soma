import { useState, useRef } from "react";
import { Camera, Save, X, User, Mail, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { toast } from "sonner";

interface ProfileEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditor = ({ isOpen, onClose }: ProfileEditorProps) => {
  const { user, updateUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    // 检查文件大小 (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片大小不能超过5MB");
      return;
    }

    setAvatarFile(file);

    // 生成预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 重置文件输入
    if (event.target) {
      event.target.value = "";
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    // 模拟上传到云存储
    setIsUploading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 在真实应用中，这里会上传到云存储服务
      // 这里返回一个模拟的URL
      const mockUrl = `https://api.synapse-weave.com/avatars/${Date.now()}-${file.name}`;
      
      toast.success("头像上传成功");
      return mockUrl;
    } catch (error) {
      toast.error("头像Upload failed");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    haptic.medium();
    setIsSaving(true);

    try {
      let avatarUrl = user?.avatar;

      // 如果有新头像，先上传
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile);
      }

      // 模拟API调用Save用户信息
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 更新本地状态
      updateUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        bio: formData.bio.trim(),
        avatar: avatarUrl,
      });

      toast.success("Profile更新成功");
      haptic.success();
      onClose();
    } catch (error) {
      toast.error("Save失败，请Retry");
      haptic.error();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // 重置表单
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      bio: user?.bio || "",
    });
    setAvatarFile(null);
    setAvatarPreview(user?.avatar || "");
    onClose();
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 头像Edit */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview} alt="Avatar" />
                <AvatarFallback className="text-lg">
                  {getInitials(formData.name || "User")}
                </AvatarFallback>
              </Avatar>
              
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isSaving}
              >
                <Camera className="h-4 w-4" />
              </Button>
              
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground text-center">
              点击相机图标更换头像
              <br />
              支持 JPG、PNG 格式，最大5MB
            </p>
          </div>

          {/* 表单字段 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Please enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="pl-9"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Please enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-9"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">个人简介</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="bio"
                  placeholder="介绍一下自己..."
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="pl-9 min-h-[80px] resize-none"
                  maxLength={200}
                  disabled={isSaving}
                />
              </div>
              <div className="text-xs text-muted-foreground text-right">
                {formData.bio.length}/200
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarSelect}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
};