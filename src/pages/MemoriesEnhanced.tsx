/**
 * 📸 Memories Page - Enhanced with Chat Style
 * Fully aligned with Chat interface design style and animation effects
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
  Clock,
  Filter,
  Download,
  Image as ImageIcon,
  FileText,
  Mail,
  MapPin,
  Plus,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { fetchTimeline, fetchFolders, fetchFolderItems, type TimelineSection, type MemoryFolder } from "@/services/memories";
import { GoogleDataImportModal } from "@/components/GoogleDataImportModal";
import {
  pageSlideIn,
  cardAppear,
  staggerContainer,
  listItem,
  somaSpring,
} from "@/lib/animations";

// Types
interface MemoryItem {
  id: string;
  text: string;
  createdAt: number;
  source?: string;
  type?: string;
  category?: string;
  metadata?: any;
}

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
  all: "All",
  gmail: "Gmail",
  drive: "Drive",
  photos: "Photos",
  calendar: "Calendar",
  maps: "Maps",
};

const MemoriesEnhanced = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [sections, setSections] = useState<TimelineSection[]>([]);
  const [folders, setFolders] = useState<MemoryFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const plusBtnRef = useRef<HTMLButtonElement>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Load timeline or folder items
  const loadTimeline = async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    if (!user?.email && !user?.id) {
      toast.error("Please login first");
      return;
    }

    setLoading(true);
    try {
      const userId = user.email || user.id;
      let result: { sections: TimelineSection[]; nextCursor: number | null };
      if (activeFolder) {
        const r = await fetchFolderItems(userId, activeFolder, 100);
        result = { sections: r.sections, nextCursor: null };
        setCursor(null);
        setHasMore(false);
      } else {
        result = await fetchTimeline(userId, reset ? undefined : cursor, 50);
      }
      
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
  }, [user?.email, user?.id, activeFolder]);

  // Load folders once
  useEffect(() => {
    const run = async () => {
      if (!user?.email && !user?.id) return;
      const userId = user.email || user.id;
      const res = await fetchFolders(userId);
      setFolders(res.folders);
    };
    run();
  }, [user?.email, user?.id]);

  // 按日期分组时间段
  const getTimeLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "今天";
    if (diffDays === 1) return "昨天";
    if (diffDays < 7) return "本周";
    if (diffDays < 30) return "本月";
    if (diffDays < 90) return "最近三个月";
    if (diffDays < 365) return "今年";
    return date.getFullYear() + "年";
  };

  // 过滤搜索and分类
  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item: any) => {
        const matchesSearch = !searchQuery || item.text?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "all" || item.source?.toLowerCase().includes(categoryFilter);
        return matchesSearch && matchesCategory;
      }),
    }))
    .filter((section) => section.items.length > 0);

  // 统计
  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);

  // 导出功能
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

  // 快速锚点滚动
  const scrollToSection = (date: string) => {
    const element = document.getElementById(`section-${date}`);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  // 提取唯一日期作为锚点
  const uniqueDates = Array.from(new Set(filteredSections.map(s => getTimeLabel(s.date))));

  // 预览内容（截取前100字或识别图片）
  const getPreview = (item: any) => {
    // 优先显示 title，如果没有则从 text 提取
    const title = item.title || (item.text ? item.text.slice(0, 30) + (item.text.length > 30 ? '...' : '') : '无标题');
    
    // 检查是否为图片类型
    if (item.type === 'photo' || item.type === 'image' || item.metadata?.contentType?.startsWith('image/')) {
      return { 
        type: 'image', 
        content: item.metadata?.url || item.metadata?.thumbnail || '',
        title,
        excerpt: item.text?.slice(0, 80) || item.metadata?.description || ''
      };
    }
    
    // 文字类型：显示摘要
    const excerpt = item.excerpt || item.text?.slice(0, 120) || item.content?.slice(0, 120) || '';
    return { 
      type: 'text', 
      content: excerpt + (excerpt.length >= 120 ? '...' : ''),
      title,
      excerpt
    };
  };

  return (
    <motion.div
      className="pb-20 min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30"
      variants={pageSlideIn}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Header - 完全对标 Chat 风格 */}
        <div className="flex items-center justify-between">
          <div>
            <motion.h1
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={somaSpring}
            >
              Memories
            </motion.h1>
            <motion.p
              className="text-sm text-gray-500 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {totalItems > 0 ? `共 ${totalItems} memories` : "还没有记忆，从导入数据开始"}
            </motion.p>
          </div>

          <div className="flex gap-2">
            {/* 导出按钮 */}
            {totalItems > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                导出
              </Button>
            )}

            {/* 分类筛选 */}
            <DropdownMenu open={showFilterMenu} onOpenChange={setShowFilterMenu}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {categoryLabels[categoryFilter]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>按类别筛选</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(categoryLabels).map(([key, label]) => {
                  const Icon = categoryIcons[key as CategoryFilter];
                  return (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => {
                        setCategoryFilter(key as CategoryFilter);
                        setShowFilterMenu(false);
                      }}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 视图切换 */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
            </Button>

            {/* 导入按钮 */}
            <Button
              ref={plusBtnRef}
              size="sm"
              onClick={() => setShowImportModal(true)}
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Upload className="w-4 h-4" />
              导入
            </Button>
            
            {/* Self Agent 对话按钮 */}
            <Button
              size="sm"
              onClick={() => navigate("/chat/self")}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            >
              <MessageCircle className="w-4 h-4" />
              Self Agent
            </Button>
          </div>
        </div>

        {/* Folders grid */}
        {!activeFolder && folders.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {folders.map((f) => (
              <motion.div key={f.id} whileHover={{ y: -2 }} className="cursor-pointer" onClick={() => setActiveFolder(f.id)}>
                <Card className="p-3 bg-white border-gray-200 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-800 truncate capitalize">{f.source}</p>
                    <Badge variant="secondary" className="text-[10px]">{f.count}</Badge>
                  </div>
                  <div className="space-y-1">
                    {f.previews.map((p) => (
                      <p key={p.id} className="text-[11px] text-gray-600 line-clamp-1">{p.excerpt}</p>
                    ))}
                    {f.previews.length === 0 && (
                      <p className="text-[11px] text-gray-400">暂无预览</p>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* 快速锚点导航 */}
        {uniqueDates.length > 0 && (
          <motion.div
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {uniqueDates.slice(0, 5).map((label, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => {
                  const section = filteredSections.find(s => getTimeLabel(s.date) === label);
                  if (section) scrollToSection(section.date);
                }}
              >
                {label}
              </Badge>
            ))}
          </motion.div>
        )}

        {/* Search - 完全对标 Chat 风格 */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索记忆..."
            className="pl-10 bg-white/80 backdrop-blur-sm border-gray-200"
          />
        </motion.div>

        {/* Folder breadcrumb */}
        {activeFolder && (
          <div className="flex items-center gap-2 -mb-2">
            <Button variant="ghost" size="sm" onClick={() => setActiveFolder(null)} className="px-2 text-blue-600">返回</Button>
            <span className="text-sm text-gray-500">当前文件夹：</span>
            <Badge variant="secondary" className="capitalize">{activeFolder}</Badge>
          </div>
        )}

        {/* Timeline Sections */}
        {loading && sections.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 mt-4">Loading...</p>
          </div>
        ) : filteredSections.length === 0 ? (
          <Card className="p-12 text-center bg-white/60 backdrop-blur-sm">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {searchQuery || categoryFilter !== "all" ? "没有找到匹配的记忆" : "还没有记忆"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchQuery || categoryFilter !== "all"
                ? "试试其他关键词或筛选条件"
                : '点击"导入"按钮导入你的 Google Takeout 数据'}
            </p>
            {!searchQuery && categoryFilter === "all" && (
              <Button onClick={() => setShowImportModal(true)} className="gap-2">
                <Upload className="w-4 h-4" />
                开始导入
              </Button>
            )}
          </Card>
        ) : (
          <motion.div
            className="space-y-6"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {filteredSections.map((section, sectionIdx) => (
              <motion.div
                key={section.date}
                id={`section-${section.date}`}
                variants={listItem}
                custom={sectionIdx}
                className="space-y-3"
              >
                {/* Section Header - Sticky 吸顶 */}
                <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md py-2 px-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">
                      {section.title}
                    </h2>
                    <Badge variant="secondary" className="text-xs">
                      {section.items.length} 条
                    </Badge>
                  </div>
                  <p className="text-xs mt-0.5 text-gray-500">
                    {getTimeLabel(section.date)}
                  </p>
                </div>

                {/* Memory Items - 网格或列表视图 */}
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2"
                      : "space-y-2"
                  }
                >
                  <AnimatePresence mode="popLayout">
                    {section.items.map((item: any, idx: number) => {
                      const preview = getPreview(item);
                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ delay: idx * 0.05, ...somaSpring }}
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className={viewMode === "grid" ? "relative aspect-square group cursor-pointer" : "cursor-pointer"}
                        >
                          <Card
                            className={`${viewMode === "grid" ? "h-full" : ""} p-3 hover:shadow-lg transition-all overflow-hidden bg-white border-gray-200`}
                          >
                            {viewMode === "grid" ? (
                              <div className="h-full flex flex-col">
                                {preview.type === 'image' ? (
                                  <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded mb-2 overflow-hidden flex items-center justify-center">
                                    {preview.content ? (
                                      <img src={preview.content} alt={preview.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <ImageIcon className="w-8 h-8 text-gray-400" />
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex-1 overflow-hidden mb-2">
                                    <p className="text-xs font-medium text-gray-800 mb-1 line-clamp-1">
                                      {preview.title}
                                    </p>
                                    <p className="text-[11px] line-clamp-3 text-gray-600">
                                      {preview.content}
                                    </p>
                                  </div>
                                )}
                                <div className="flex items-center justify-between mt-auto">
                                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                                      month: "numeric",
                                      day: "numeric",
                                    })}
                                  </div>
                                  <Badge variant="secondary" className="text-[9px] px-1 py-0">
                                    {item.type || 'text'}
                                  </Badge>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-3">
                                <Avatar className="w-10 h-10 flex-shrink-0">
                                  <AvatarFallback className="bg-blue-600">
                                    {preview.type === 'image' ? (
                                      <ImageIcon className="w-5 h-5 text-white" />
                                    ) : (
                                      <FileText className="w-5 h-5 text-white" />
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-gray-800 truncate">
                                      {preview.title}
                                    </span>
                                    <Badge variant="secondary" className="text-[10px]">
                                      {item.type || 'text'}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    {item.source || "Memory"} · {new Date(item.createdAt).toLocaleDateString("en-US")}
                                  </p>
                                  <p className="text-sm line-clamp-2 text-gray-600">
                                    {preview.content}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* 悬浮时显示更多信息 */}
                            {viewMode === "grid" && (
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                                <p className="text-white text-[11px] font-medium truncate">
                                  {preview.title}
                                </p>
                                <p className="text-white/80 text-[10px]">
                                  {item.source || "Google"}
                                </p>
                              </div>
                            )}
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="text-center py-4">
                <Button
                  variant="outline"
                  onClick={() => loadTimeline(false)}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>加载更多</>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Import Modal */}
      <GoogleDataImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        userId={user?.email || user?.id || ""}
        onComplete={() => {
          toast.success("导入Completed！");
          loadTimeline(true);
        }}
      />
    </motion.div>
  );
};

export default MemoriesEnhanced;
