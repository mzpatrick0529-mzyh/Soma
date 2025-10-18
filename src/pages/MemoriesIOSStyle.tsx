/**
 * 📸 Memories Page - iOS Photos Style
 * iOS 相册风格的时间线展示，按日期分组，网格布局
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Search,
  Grid3x3,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { fetchTimeline, type TimelineSection } from "@/services/memories";
import { GoogleDataImportModal } from "@/components/GoogleDataImportModal";

// Types
interface MemoryItem {
  id: string;
  text: string;
  createdAt: number;
  source?: string;
  type?: string;
  category?: string;
}

const Memories = () => {
  const { user } = useAuthStore();
  const [sections, setSections] = useState<TimelineSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Load timeline
  const loadTimeline = async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    if (!user?.email && !user?.id) {
      toast.error("请先登录");
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
      toast.error(`加载失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline(true);
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

  // 过滤搜索
  const filteredSections = searchQuery
    ? sections
        .map((section) => ({
          ...section,
          items: section.items.filter((item: any) =>
            item.text?.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((section) => section.items.length > 0)
    : sections;

  // 统计
  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <div className="pb-20 min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              我的记忆
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalItems > 0 ? `共 ${totalItems} 条记忆` : "还没有记忆，从导入数据开始"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportModal(true)}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              导入数据
            </Button>
            <Button variant="outline" size="icon">
              <Grid3x3 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索记忆..."
            className="pl-10 bg-white/80 backdrop-blur-sm border-gray-200"
          />
        </div>

        {/* Timeline Sections */}
        {loading && sections.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 mt-4">加载中...</p>
          </div>
        ) : filteredSections.length === 0 ? (
          <Card className="p-12 text-center bg-white/60 backdrop-blur-sm">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery ? "没有找到匹配的记忆" : "还没有记忆"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchQuery
                ? "试试其他关键词"
                : '点击"导入数据"按钮导入你的 Google Takeout 数据'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowImportModal(true)} className="gap-2">
                <Upload className="w-4 h-4" />
                开始导入
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-8">
            {filteredSections.map((section) => (
              <motion.div
                key={section.date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Section Header - iOS style sticky */}
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md py-2 px-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">
                      {section.title}
                    </h2>
                    <Badge variant="secondary" className="text-xs">
                      {section.items.length} 条
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {getTimeLabel(section.date)}
                  </p>
                </div>

                {/* Grid Layout - iOS Photos style */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {section.items.map((item: any) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative aspect-square group cursor-pointer"
                    >
                      <Card className="h-full p-3 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all overflow-hidden">
                        <div className="h-full flex flex-col">
                          <p className="text-xs text-gray-600 line-clamp-4 flex-1">
                            {item.text}
                          </p>
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock className="w-3 h-3" />
                            {new Date(item.createdAt).toLocaleDateString("zh-CN", {
                              month: "numeric",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                        {/* 悬浮时显示更多信息 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                          <p className="text-white text-[10px] font-medium">
                            {item.source || "Google"}
                          </p>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
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
                      加载中...
                    </>
                  ) : (
                    <>加载更多</>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Import Modal */}
      <GoogleDataImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        userId={user?.email || user?.id || ""}
        onComplete={() => {
          toast.success("导入完成！");
          loadTimeline(true);
        }}
      />
    </div>
  );
};

export default Memories;
