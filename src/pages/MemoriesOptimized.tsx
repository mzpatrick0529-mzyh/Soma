/**
 * 📸 Memories Page - Premium Design
 * 参照 Marketplace 的动态弹出效果，完美对标 Chat 界面的渐变色
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Search,
  Grid3x3,
  List,
  Calendar,
  Filter,
  Download,
  Image as ImageIcon,
  FileText,
  Mail,
  MapPin,
  Plus,
  MessageCircle,
  Sparkles,
  Brain,
  TrendingUp,
  Clock,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ActionPopup } from "@/components/ActionPopup";
import { PhotoPicker } from "@/components/PhotoPicker";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useTempMediaStore } from "@/stores/tempMediaStore";
import { fetchTimeline, fetchFolders, type TimelineSection, type MemoryFolder } from "@/services/memories";
import { UnifiedDataImportModal } from "@/components/UnifiedDataImportModal";

type ViewMode = "grid" | "list";
type CategoryFilter = "all" | "gmail" | "drive" | "photos" | "calendar" | "maps";

const categoryIcons: Record<CategoryFilter, any> = {
  all: Sparkles,
  gmail: Mail,
  drive: FileText,
  photos: ImageIcon,
  calendar: Calendar,
  maps: MapPin,
};

const categoryLabels: Record<CategoryFilter, string> = {
  all: "全部",
  gmail: "Gmail",
  drive: "Drive",
  photos: "相册",
  calendar: "日历",
  maps: "地图",
};

const MemoriesOptimized = () => {
  const { user } = useAuthStore();
  const { addTempAssets, tempAssets, clearTempAssets } = useTempMediaStore();
  const navigate = useNavigate();
  const [sections, setSections] = useState<TimelineSection[]>([]);
  const [folders, setFolders] = useState<MemoryFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const plusBtnRef = useRef<HTMLButtonElement>(null);

  // Load timeline
  const loadTimeline = async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    if (!user?.email && !user?.id) {
      toast.error("Please login first");
      return;
    }

    setLoading(true);
    try {
      const userId = user.email || user.id;
      const result = await fetchTimeline(userId, reset ? undefined : cursor, 50);
      
      if (reset) {
        setSections(result.sections);
      } else {
        setSections((prev) => [...prev, ...result.sections]);
      }
      
      setCursor(result.nextCursor);
      setHasMore(Boolean(result.nextCursor));
    } catch (error: any) {
      toast.error(`Failed to load: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline(true);
  }, [user?.email, user?.id]);

  // Load folders once
  useEffect(() => {
    const run = async () => {
      if (!user?.email && !user?.id) return;
      const userId = user.email || user.id;
      try {
        const res = await fetchFolders(userId);
        setFolders(res.folders);
      } catch (error: any) {
        console.error("Load folders failed:", error);
      }
    };
    run();
  }, [user?.email, user?.id]);

  // Filter and search
  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item: any) => {
        const matchesSearch = !searchQuery || 
          item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "all" || item.category?.toLowerCase() === categoryFilter;
        return matchesSearch && matchesCategory;
      }),
    }))
    .filter((section) => section.items.length > 0);

  // Stats
  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);

  // Export
  const handleExport = () => {
    const data = sections.flatMap(s => s.items);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memories-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success("导出成功！");
  };

  // Popup actions
  const popupOptions = [
    {
      icon: <Camera className="h-5 w-5" />,
      label: "访问相册",
      onClick: () => {
        setShowPopup(false);
        setShowPhotoPicker(true);
      },
    },
    {
      icon: <Upload className="h-5 w-5" />,
      label: "Import Data",
      onClick: () => {
        setShowPopup(false);
        setShowImportModal(true);
      },
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: "View Statistics",
      onClick: () => {
        setShowPopup(false);
        navigate("/training/samples");
      },
    },
    {
      icon: <Brain className="h-5 w-5" />,
      label: "Train AI Agent",
      onClick: () => {
        setShowPopup(false);
        toast.info("Training coming soon");
      },
    },
  ];

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "今天";
    if (diffDays === 1) return "昨天";
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Header - Matching Chat style */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 backdrop-blur-xl bg-white/90 border-b border-gray-200/50"
      >
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            {/* Title with gradient - matching Chat */}
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
            >
              Memories
            </motion.h1>

            <div className="flex items-center gap-2">
              {/* Self Agent Button - gradient style */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Button
                  size="sm"
                  onClick={() => navigate("/chat/self")}
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Self Agent
                </Button>
              </motion.div>

              {/* Plus Button - gradient style */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
              >
                <Button
                  ref={plusBtnRef}
                  size="icon"
                  onClick={() => setShowPopup(true)}
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Search & Filters Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2"
          >
            {/* Search */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="搜索记忆..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100/80 border-0 rounded-full text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200"
              />
            </div>

            {/* Category Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-full hover:bg-gray-100/80 transition-all"
                >
                  <Filter className="w-4 h-4" />
                  {categoryLabels[categoryFilter]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>筛选类别</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(categoryLabels).map(([key, label]) => {
                  const Icon = categoryIcons[key as CategoryFilter];
                  return (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setCategoryFilter(key as CategoryFilter)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Mode */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="rounded-full hover:bg-gray-100/80 transition-all"
            >
              {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
            </Button>

            {/* Export */}
            {totalItems > 0 && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleExport}
                className="rounded-full hover:bg-gray-100/80 transition-all"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </motion.div>
        </div>
      </motion.header>

      {/* Stats Bar */}
      {folders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-screen-xl mx-auto px-4 py-3"
        >
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {folders.map((folder, index) => {
              const Icon = categoryIcons[folder.source.toLowerCase() as CategoryFilter] || Sparkles;
              return (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCategoryFilter(folder.source.toLowerCase() as CategoryFilter)}
                    className="gap-2 rounded-full whitespace-nowrap hover:bg-gradient-to-r hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 hover:text-white hover:border-transparent transition-all duration-300"
                  >
                    <Icon className="w-3 h-3" />
                    <span className="text-xs font-medium">{folder.source}</span>
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                      {folder.count}
                    </Badge>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        {loading && sections.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        ) : filteredSections.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
              <ImageIcon className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">还没有记忆</h3>
            <p className="text-gray-500 mb-6 max-w-sm">
              导入您的 Google Takeout 数据，开始构建您的个人记忆库
            </p>
            <Button
              onClick={() => setShowImportModal(true)}
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              导入数据
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {filteredSections.map((section, sectionIndex) => (
              <motion.div
                key={section.date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.05 }}
              >
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-700">{section.title}</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
                </div>

                {/* Items */}
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.items.map((item: any, itemIndex: number) => {
                      const Icon = categoryIcons[item.category?.toLowerCase() as CategoryFilter] || FileText;
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: sectionIndex * 0.05 + itemIndex * 0.02 }}
                          whileHover={{ y: -4, scale: 1.02 }}
                          className="cursor-pointer"
                        >
                          <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                            {item.thumbnailUrl && (
                              <div className="relative h-48 overflow-hidden bg-gray-100">
                                <img
                                  src={item.thumbnailUrl}
                                  alt={item.title || "Memory"}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute top-2 right-2">
                                  <Badge className="bg-white/90 text-gray-700 text-xs">
                                    <Icon className="w-3 h-3 mr-1" />
                                    {item.category || item.type}
                                  </Badge>
                                </div>
                              </div>
                            )}
                            <div className="p-4">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-medium text-gray-900 line-clamp-2 flex-1">
                                  {item.title || "无标题"}
                                </h3>
                                {!item.thumbnailUrl && (
                                  <Icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                )}
                              </div>
                              {item.excerpt && (
                                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                                  {item.excerpt}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>{formatDate(section.date)}</span>
                                <Badge variant="outline" className="text-[10px]">
                                  {item.type || "text"}
                                </Badge>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {section.items.map((item: any, itemIndex: number) => {
                      const Icon = categoryIcons[item.category?.toLowerCase() as CategoryFilter] || FileText;
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: sectionIndex * 0.05 + itemIndex * 0.02 }}
                          whileHover={{ x: 4 }}
                          className="cursor-pointer"
                        >
                          <Card className="p-4 hover:shadow-md transition-all duration-200">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-6 h-6 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">
                                  {item.title || "无标题"}
                                </h3>
                                {item.excerpt && (
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                    {item.excerpt}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <span>{formatDate(section.date)}</span>
                                  <span>•</span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {item.category || item.type}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => loadTimeline(false)}
                  disabled={loading}
                  variant="outline"
                  className="rounded-full"
                >
                  {loading ? "Loading..." : "加载更多"}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Action Popup - Marketplace style */}
      <ActionPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        options={popupOptions}
      />

      {/* Import Modal */}
      <UnifiedDataImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        userId={user?.email || user?.id || ""}
        onComplete={() => {
          setShowImportModal(false);
          loadTimeline(true);
          toast.success("数据导入Completed！");
        }}
      />

      {/* Photo Picker - 临时媒体选择（不Save到数据库） */}
      {showPhotoPicker && (
        <PhotoPicker
          isOpen={showPhotoPicker}
          onClose={() => setShowPhotoPicker(false)}
          onSelect={(assets) => {
            addTempAssets(assets);
            setShowPhotoPicker(false);
            toast.success(`Selected ${assets.length} 个媒体文件（临时存储，仅供 Self Agent 使用）`);
          }}
          maxCount={20}
          allowVideo={true}
          allowMultiple={true}
        />
      )}

      {/* 临时媒体计数提示 */}
      {tempAssets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 right-4 z-40"
        >
          <Card className="p-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              <span className="text-sm font-medium">
                {tempAssets.length} 个临时媒体
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearTempAssets}
                className="text-white hover:bg-white/20"
              >
                清空
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default MemoriesOptimized;
