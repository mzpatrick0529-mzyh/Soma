import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Bell, 
  Lock, 
  Palette, 
  Globe, 
  HelpCircle, 
  Shield,
  LogOut,
  ChevronRight,
  Edit3,
  FileText,
  ScrollText
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/authStore";
import { ProfileEditor } from "@/components/ProfileEditor";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { bounceUp, containerReverseStagger, fadeDown } from "@/lib/motion";

const Settings = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("已Security退出");
  };

  const settingsSections = [
    {
      title: "应用设置",
      items: [
        { icon: Bell, label: "Notifications设置", subtitle: "管理Push Notifications", onClick: () => toast.info("Notifications设置功能开发中") },
        { icon: Lock, label: "Privacy & Security", subtitle: "账户Security设置", onClick: () => toast.info("Privacy settings feature under development") },
        { icon: Palette, label: "ThemeAppearance", subtitle: "个性化界面", onClick: () => toast.info("Theme设置功能开发中") },
        { icon: Globe, label: "Language与地区", subtitle: "本地化设置", onClick: () => toast.info("Language settings feature under development") },
      ],
    },
    {
      title: "法律与合规",
      items: [
        { 
          icon: FileText, 
          label: "Terms of Service", 
          subtitle: "查看Terms of Serviceand使用协议", 
          onClick: () => navigate("/legal/terms-of-service")
        },
        { 
          icon: ScrollText, 
          label: "Privacy Policy", 
          subtitle: "了解数据收集and隐私保护", 
          onClick: () => navigate("/legal/privacy-policy")
        },
      ],
    },
    {
      title: "帮助与支持",
      items: [
        { icon: Shield, label: "数据Security", subtitle: "账户Security与数据保护", onClick: () => toast.info("Security settings feature under development") },
        { icon: HelpCircle, label: "帮助与支持", subtitle: "获取帮助", onClick: () => toast.info("帮助功能开发中") },
      ],
    },
  ];
  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        variants={fadeDown}
        initial="hidden"
        animate="show"
        className="sticky top-0 z-30 backdrop-blur-xl bg-white/90 border-b border-gray-200/50"
      >
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </motion.header>

      <main className="max-w-screen-xl mx-auto">
        <motion.div className="space-y-6 px-4 pt-4" variants={containerReverseStagger} initial="hidden" animate="show">
          {/* 用户资料卡片 */}
          {user && (
            <motion.div variants={bounceUp}>
              <Card className="overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <motion.div variants={bounceUp}>
                      <Avatar className="h-16 w-16 ring-2 ring-white shadow-lg">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                    
                    <motion.div className="flex-1" variants={bounceUp}>
                      <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                      <p className="text-gray-600">{user.email}</p>
                      {user.bio && (
                        <p className="text-sm text-gray-500 mt-1">{user.bio}</p>
                      )}
                      {user.joinDate && (
                        <p className="text-xs text-gray-400 mt-2">
                          加入于 {new Date(user.joinDate).toLocaleDateString('zh-CN')}
                        </p>
                      )}
                    </motion.div>
                    
                    <motion.div variants={bounceUp} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setIsProfileEditorOpen(true)}
                        className="bg-white/50 hover:bg-white/80 border-gray-200"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
          
          <motion.div variants={bounceUp}>
            <Separator />
          </motion.div>
          
          {settingsSections.map((section) => (
            <motion.div key={section.title} variants={bounceUp}>
              <h2 className="text-sm font-semibold text-gray-500 mb-3 px-2">
                {section.title}
              </h2>
              <Card className="overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                <motion.div variants={containerReverseStagger}>
                {section.items.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.label}
                      onClick={item.onClick}
                      className={`w-full flex items-center justify-between p-4 hover:bg-gray-50/80 transition-all duration-200 ${
                        index !== section.items.length - 1 ? "border-b border-gray-100" : ""
                      }`}
                      variants={bounceUp}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        >
                          <Icon className="h-5 w-5 text-blue-600" />
                        </motion.div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900">{item.label}</div>
                          {item.subtitle && (
                            <div className="text-sm text-gray-500">{item.subtitle}</div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </motion.button>
                  );
                })}
                </motion.div>
              </Card>
            </motion.div>
          ))}

          <motion.div className="mt-8 space-y-4" variants={bounceUp}>
            <Card className="overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-sm">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start p-4 h-auto text-red-600 hover:text-red-700 hover:bg-red-50/80"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </Button>
              </motion.div>
            </Card>

            <motion.div className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl text-center border border-gray-100 shadow-sm" variants={bounceUp}>
              <p className="text-sm text-gray-600">
                Synapse Weave v1.0.0
              </p>
              <p className="text-xs text-gray-500 mt-1">
                连接记忆，编织未来
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </main>
      
      <ProfileEditor 
        isOpen={isProfileEditorOpen}
        onClose={() => setIsProfileEditorOpen(false)}
      />
    </div>
  );
};

export default Settings;
