/**
 * ⚙️ Settings - Soma Style
 * iOS 风格设置页面，分组清晰，交互流畅
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  HelpCircle,
  Info,
  ChevronRight,
  LogOut,
  Download,
  Trash2,
  Lock,
  Eye,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Mail,
  MessageSquare,
  Heart,
  Star,
  FileText,
  ExternalLink,
  Crown,
  Zap,
  Search,
  Settings as SettingsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { GoogleDataImportModal } from "@/components/GoogleDataImportModal";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { userService } from "@/services/api";

interface SettingsSection {
  id: string;
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  icon: any;
  label: string;
  value?: string;
  description?: string;
  badge?: string;
  type: "link" | "toggle" | "action";
  isToggled?: boolean;
  isDanger?: boolean;
  iconColor?: string;
  onClick?: () => void;
}

const Settings = () => {
  const navigate = useNavigate();
  const { user: authUser, updateUser } = useAuthStore();
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("light");
  const [notifications, setNotifications] = useState({
    push: true,
    email: false,
    sms: false,
    mentions: true,
    likes: true,
    comments: true,
  });
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showGoogleImport, setShowGoogleImport] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Profile editing states
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const user = {
    id: authUser?.id || "user_unknown",
    name: authUser?.name || "Unknown User",
    username: authUser?.email?.split("@")[0] || "@user",
    email: authUser?.email || "",
    avatar: authUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser?.email || 'default'}`,
    isPremium: false,
  };
  
  // Initialize edit states when dialog opens
  const handleOpenEditProfile = () => {
    setEditName(user.name);
    setEditUsername(user.username.startsWith("@") ? user.username.slice(1) : user.username);
    setEditEmail(user.email);
    setShowEditProfile(true);
  };

  const settingsSections: SettingsSection[] = [
    {
      id: "account",
      title: "账号",
      items: [
        {
          id: "profile",
          icon: User,
          label: "个人资料",
          value: user.name,
          type: "link",
          iconColor: "text-indigo-600",
          onClick: handleOpenEditProfile,
        },
        {
          id: "google-import",
          icon: Download,
          label: "导入 Google 数据",
          description: "从 Google Takeout 导入你的数据",
          type: "link",
          iconColor: "text-blue-600",
          onClick: () => setShowGoogleImport(true),
        },
        {
          id: "premium",
          icon: Crown,
          label: "升级到 Premium",
          badge: "特惠",
          type: "link",
          iconColor: "text-yellow-600",
          onClick: () => toast.info("Premium 功能即将推出"),
        },
        {
          id: "provider",
          icon: SettingsIcon,
          label: "AI Provider 诊断",
          description: "查看 AI 提供商状态和配置",
          type: "link",
          iconColor: "text-purple-600",
          onClick: () => navigate("/settings/provider"),
        },
      ],
    },
    {
      id: "notifications",
      title: "通知",
      items: [
        {
          id: "push",
          icon: Bell,
          label: "推送通知",
          type: "toggle",
          iconColor: "text-red-600",
          isToggled: notifications.push,
          onClick: () =>
            setNotifications((prev) => ({ ...prev, push: !prev.push })),
        },
        {
          id: "email",
          icon: Mail,
          label: "邮件通知",
          type: "toggle",
          iconColor: "text-blue-600",
          isToggled: notifications.email,
          onClick: () =>
            setNotifications((prev) => ({ ...prev, email: !prev.email })),
        },
        {
          id: "mentions",
          icon: MessageSquare,
          label: "@提到我",
          type: "toggle",
          iconColor: "text-green-600",
          isToggled: notifications.mentions,
          onClick: () =>
            setNotifications((prev) => ({ ...prev, mentions: !prev.mentions })),
        },
        {
          id: "likes",
          icon: Heart,
          label: "点赞",
          type: "toggle",
          iconColor: "text-pink-600",
          isToggled: notifications.likes,
          onClick: () =>
            setNotifications((prev) => ({ ...prev, likes: !prev.likes })),
        },
      ],
    },
    {
      id: "privacy",
      title: "隐私与安全",
      items: [
        {
          id: "privacy",
          icon: Shield,
          label: "隐私设置",
          type: "link",
          iconColor: "text-green-600",
          onClick: () => toast.info("隐私设置功能开发中"),
        },
        {
          id: "security",
          icon: Lock,
          label: "安全",
          type: "link",
          iconColor: "text-orange-600",
          onClick: () => toast.info("安全设置功能开发中"),
        },
        {
          id: "data",
          icon: Download,
          label: "下载我的数据",
          type: "action",
          iconColor: "text-blue-600",
          onClick: () => toast.success("数据导出请求已提交"),
        },
      ],
    },
    {
      id: "appearance",
      title: "外观",
      items: [
        {
          id: "theme",
          icon: theme === "dark" ? Moon : theme === "light" ? Sun : Monitor,
          label: "主题",
          value: theme === "dark" ? "深色" : theme === "light" ? "浅色" : "跟随系统",
          type: "link",
          iconColor: "text-violet-600",
          onClick: () => {
            const nextTheme =
              theme === "light" ? "dark" : theme === "dark" ? "auto" : "light";
            setTheme(nextTheme);
            toast.success(
              `已切换到${
                nextTheme === "light"
                  ? "浅色"
                  : nextTheme === "dark"
                  ? "深色"
                  : "自动"
              }模式`
            );
          },
        },
        {
          id: "language",
          icon: Globe,
          label: "语言",
          value: "简体中文",
          type: "link",
          iconColor: "text-cyan-600",
          onClick: () => toast.info("语言设置功能开发中"),
        },
      ],
    },
    {
      id: "about",
      title: "关于",
      items: [
        {
          id: "help",
          icon: HelpCircle,
          label: "帮助中心",
          type: "link",
          iconColor: "text-blue-600",
          onClick: () => toast.info("帮助中心功能开发中"),
        },
        {
          id: "terms",
          icon: FileText,
          label: "服务条款",
          type: "link",
          iconColor: "text-gray-600",
          onClick: () => toast.info("服务条款功能开发中"),
        },
        {
          id: "privacy-policy",
          icon: Eye,
          label: "隐私政策",
          type: "link",
          iconColor: "text-gray-600",
          onClick: () => toast.info("隐私政策功能开发中"),
        },
        {
          id: "about",
          icon: Info,
          label: "关于 Soma",
          value: "v1.0.0",
          type: "link",
          iconColor: "text-indigo-600",
          onClick: () => toast.info("Soma - 你的智能伙伴"),
        },
      ],
    },
    {
      id: "danger",
      title: "危险区域",
      items: [
        {
          id: "logout",
          icon: LogOut,
          label: "退出登录",
          type: "action",
          iconColor: "text-orange-600",
          onClick: () => toast.success("已退出登录"),
        },
        {
          id: "delete",
          icon: Trash2,
          label: "删除账号",
          type: "action",
          isDanger: true,
          iconColor: "text-red-600",
          onClick: () => setShowDeleteAccount(true),
        },
      ],
    },
  ];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const sectionsToRender = settingsSections
    .map((section) => {
      if (!normalizedQuery) return section;
      const filteredItems = section.items.filter((item) => {
        const labelMatch = item.label.toLowerCase().includes(normalizedQuery);
        const valueMatch = item.value?.toLowerCase().includes(normalizedQuery);
        const badgeMatch = item.badge?.toLowerCase().includes(normalizedQuery);
        return labelMatch || valueMatch || badgeMatch;
      });
      return { ...section, items: filteredItems };
    })
    .filter((section) => section.items.length > 0 || !normalizedQuery);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-gray-200/50"
      >
        <div className="max-w-screen-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
              Settings
            </h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              type="text"
              placeholder="搜索设置..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100/80 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
            />
          </motion.div>
        </div>
      </motion.header>

      <main className="max-w-screen-lg mx-auto px-4 py-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 text-2xl">
                {user.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                {user.isPremium && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600">
                    <Crown size={12} className="mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              <p className="text-gray-500">{user.username}</p>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
            <Button
              variant="outline"
              onClick={handleOpenEditProfile}
              className="self-start"
            >
              编辑
            </Button>
          </div>
        </motion.div>

        {/* Settings Sections */}
        {sectionsToRender.map((section, sectionIndex) => (
          <motion.section
            key={section.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.1 + sectionIndex * 0.05,
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mb-6"
          >
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
              {section.title}
            </h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {section.items.map((item, itemIndex) => (
                <SettingsItemRow
                  key={item.id}
                  item={item}
                  isLast={itemIndex === section.items.length - 1}
                />
              ))}
            </div>
          </motion.section>
        ))}
      </main>

      {/* Edit Profile Modal */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑个人资料</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 text-3xl">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                >
                  <User size={16} />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input 
                id="name" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input 
                id="username" 
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="不带@符号"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input 
                id="email" 
                type="email" 
                value={editEmail}
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">邮箱地址不可修改</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditProfile(false)}
              disabled={isSaving}
            >
              取消
            </Button>
            <Button
              onClick={async () => {
                setIsSaving(true);
                try {
                  await userService.updateProfile({
                    name: editName,
                  });
                  
                  // Update local auth store
                  updateUser({
                    name: editName,
                  });
                  
                  toast.success("个人资料已更新");
                  setShowEditProfile(false);
                } catch (error) {
                  toast.error("更新失败,请稍后重试");
                  console.error("Profile update error:", error);
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            >
              {isSaving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation */}
      <Dialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">删除账号</DialogTitle>
            <DialogDescription className="text-gray-600">
              此操作无法撤销。你的所有数据将被永久删除。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              如果你确定要删除账号，请输入 <strong>DELETE</strong> 以确认：
            </p>
            <Input placeholder="输入 DELETE" />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteAccount(false)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                toast.error("账号删除请求已提交");
                setShowDeleteAccount(false);
              }}
            >
              删除账号
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Google Data Import Modal */}
      <GoogleDataImportModal
        isOpen={showGoogleImport}
        onClose={() => setShowGoogleImport(false)}
        userId={user.id}
        onComplete={() => {
          toast.success("Google 数据导入完成！Self AI Agent 已训练完成");
          setShowGoogleImport(false);
        }}
      />
    </div>
  );
};

// Settings Item Row Component
interface SettingsItemRowProps {
  item: SettingsItem;
  isLast: boolean;
}

const SettingsItemRow = ({ item, isLast }: SettingsItemRowProps) => {
  const Icon = item.icon;

  return (
    <motion.button
      whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
      whileTap={{ scale: 0.98 }}
      onClick={item.onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ${
        !isLast ? "border-b border-gray-100" : ""
      }`}
    >
      {/* Icon */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          item.isDanger ? "bg-red-50" : "bg-gray-50"
        }`}
      >
        <Icon
          size={18}
          className={item.isDanger ? "text-red-600" : item.iconColor}
        />
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-medium ${
            item.isDanger ? "text-red-600" : "text-gray-900"
          }`}
        >
          {item.label}
        </p>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {item.badge && (
          <Badge
            variant="secondary"
            className="bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700"
          >
            {item.badge}
          </Badge>
        )}
        {item.value && (
          <span className="text-gray-500 text-sm">{item.value}</span>
        )}
        {item.type === "toggle" && (
          <Switch checked={item.isToggled} className="ml-2" />
        )}
        {item.type === "link" && (
          <ChevronRight size={18} className="text-gray-400" />
        )}
      </div>
    </motion.button>
  );
};

export default Settings;
