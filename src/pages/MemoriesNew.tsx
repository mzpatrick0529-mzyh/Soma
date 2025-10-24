/**
 * 📸 Memories Page - iOS Photos Style
 * iOS 相册风格的时间线展示，按日期分组，网格布局
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Calendar,
  Grid3x3,
  Search,
  Upload,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { fetchTimeline, type TimelineSection } from "@/services/memories";
import GoogleDataImportModal from "@/components/GoogleDataImportModal";

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
          items: section.items.filter((item: MemoryItem) =>
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
              {totalItems > 0 ? `共 ${totalItems} memories` : "还没有记忆，从导入数据开始"}
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
            <p className="text-sm text-gray-500 mt-4">Loading...</p>
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
                : "点击"导入数据"按钮导入你的 Google Takeout 数据"}
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
                  {section.items.map((item: MemoryItem) => (
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
                      Loading...
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
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        userId={user?.email || user?.id || ""}
        onImportComplete={() => {
          toast.success("导入Completed！");
          loadTimeline(true);
        }}
      />
    </div>
  );
};

export default Memories;

    const matchesTag = !filterTag || memory.tags?.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  // Get all unique tags
  const allTags = Array.from(
    new Set(memories.flatMap((m) => m.tags || []))
  );

  // Handle interactions
  const handleLike = (id: string) => {
    setMemories((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, isLiked: !m.isLiked, likes: m.isLiked ? m.likes - 1 : m.likes + 1 }
          : m
      )
    );
  };

  const handleBookmark = (id: string) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isBookmarked: !m.isBookmarked } : m))
    );
    toast.success("已添加到收藏");
  };

  const handleShare = (id: string) => {
    toast.info("分享功能开发中");
  };

  const popupOptions = [
    {
      icon: <FileText className="h-5 w-5" />,
      label: "文本记忆",
      onClick: () => {
        setShowPopup(false);
        setShowCreateModal(true);
      },
    },
    {
      icon: <ImageIcon className="h-5 w-5" />,
      label: "图片记忆",
      onClick: () => {
        setShowPopup(false);
        toast.info("图片上传功能开发中");
      },
    },
    {
      icon: <Video className="h-5 w-5" />,
      label: "视频记忆",
      onClick: () => {
        setShowPopup(false);
        toast.info("视频录制功能开发中");
      },
    },
    {
      icon: <Mic className="h-5 w-5" />,
      label: "语音记忆",
      onClick: () => {
        setShowPopup(false);
        toast.info("语音录制功能开发中");
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pb-20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-gray-200/50"
      >
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
              Memories
            </h1>
            <Button
              ref={plusBtnRef}
              size="icon"
              variant="ghost"
              onClick={() => setShowPopup(true)}
              className="relative group"
            >
              <motion.div
                whileHover={{ rotate: 90, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Plus className="h-6 w-6 text-gray-700 group-hover:text-indigo-600 transition-colors" />
              </motion.div>
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-3"
          >
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              type="text"
              placeholder="搜索记忆、标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100/80 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-between mb-3"
          >
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`h-8 px-3 ${
                  viewMode === "grid"
                    ? "bg-white shadow-sm"
                    : "hover:bg-transparent"
                }`}
              >
                <Grid3x3 size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`h-8 px-3 ${
                  viewMode === "list"
                    ? "bg-white shadow-sm"
                    : "hover:bg-transparent"
                }`}
              >
                <List size={16} />
              </Button>
            </div>
          </motion.div>

          {/* Tags Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.24 }}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          >
            <Badge
              variant={filterTag === null ? "default" : "outline"}
              className={`cursor-pointer whitespace-nowrap ${
                filterTag === null
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => setFilterTag(null)}
            >
              全部
            </Badge>
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={filterTag === tag ? "default" : "outline"}
                className={`cursor-pointer whitespace-nowrap ${
                  filterTag === tag
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setFilterTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </motion.div>
        </div>
  </motion.header>

      {/* Memories Grid */}
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-4"
          }
        >
          {filteredMemories.map((memory, index) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              index={index * 0.015}
              viewMode={viewMode}
              onLike={handleLike}
              onBookmark={handleBookmark}
              onShare={handleShare}
            />
          ))}
        </div>

        {filteredMemories.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-gray-400 mb-4">
              <Sparkles size={48} className="mx-auto" />
            </div>
            <p className="text-gray-500 text-lg">还没有记忆</p>
            <p className="text-gray-400 text-sm mt-2">点击右上角 + 创建第一memories</p>
          </motion.div>
        )}
      </main>

      {/* Action Popup */}
      <ActionPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        anchorRef={plusBtnRef}
        placement="bottom-end"
        options={popupOptions}
      />

      {/* Create Modal */}
      <CreateContentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          toast.success("记忆已创建");
        }}
      />
    </div>
  );
};

// Memory Card Component
interface MemoryCardProps {
  memory: Memory;
  index: number;
  viewMode: "grid" | "list";
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onShare: (id: string) => void;
}

const MemoryCard = ({
  memory,
  index,
  viewMode,
  onLike,
  onBookmark,
  onShare,
}: MemoryCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index,
        duration: 0.24,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100"
    >
      {/* Media */}
      {memory.media && (
        <div className="relative w-full aspect-video overflow-hidden bg-gray-100">
          {memory.media.type === "image" && (
            <img
              src={memory.media.url}
              alt="memory"
              className="w-full h-full object-cover"
            />
          )}
          {memory.media.type === "video" && (
            <div className="relative">
              <img
                src={memory.media.thumbnail}
                alt="video thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <Video size={24} className="text-indigo-600" />
                </div>
              </div>
            </div>
          )}
          {/* Emotion Badge */}
          {memory.emotion && (
            <div
              className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
                emotionColors[memory.emotion]
              }`}
            >
              {emotionIcons[memory.emotion]} {memory.emotion}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* User Info */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={memory.user.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700">
              {memory.user.name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{memory.user.name}</p>
            <p className="text-xs text-gray-500">{memory.timestamp}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical size={16} className="text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>分享</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">删除</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content Text */}
        <p className="text-gray-800 text-sm mb-3 line-clamp-3">{memory.content}</p>

        {/* Tags */}
        {memory.tags && memory.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {memory.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Location */}
        {memory.location && (
          <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
            <span>📍</span>
            {memory.location}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onLike(memory.id)}
            className="flex items-center gap-1 text-sm"
          >
            <Heart
              size={18}
              className={`transition-colors ${
                memory.isLiked
                  ? "fill-red-500 text-red-500"
                  : "text-gray-400 hover:text-red-500"
              }`}
            />
            <span className={memory.isLiked ? "text-red-500" : "text-gray-600"}>
              {memory.likes}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600"
          >
            <MessageCircle size={18} />
            <span>{memory.comments}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onShare(memory.id)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600"
          >
            <Share2 size={18} />
            <span>{memory.shares}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onBookmark(memory.id)}
          >
            <Bookmark
              size={18}
              className={`transition-colors ${
                memory.isBookmarked
                  ? "fill-indigo-600 text-indigo-600"
                  : "text-gray-400 hover:text-indigo-600"
              }`}
            />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Memories;
