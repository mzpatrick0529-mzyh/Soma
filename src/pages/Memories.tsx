import { useRef, useEffect, useState } from "react";
import { Image, Video, FileText, Link2, MoreHorizontal, RotateCcw, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { bounceUp, containerReverseStagger, fadeDown } from "@/lib/motion";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { ActionPopup } from "@/components/ActionPopup";
import { MemoryCard } from "@/components/MemoryCard";
import { MemoryCardListSkeleton } from "@/components/skeletons/MemoryCardSkeleton";
import { CreateContentModal } from "@/components/CreateContentModal";
import { GoogleDataImportModal } from "@/components/GoogleDataImportModal";
import { Button } from "@/components/ui/button";
import { contentService, type Memory } from "@/services/api";
import { MemoriesTimeline } from "@/components/MemoriesTimeline";
import { fetchTimeline, type TimelineSection } from "@/services/memories";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

const sampleMemories = [
  {
    id: "1",
    user: { name: "You", avatar: "https://i.pravatar.cc/150?img=1" },
    content: "Just discovered this amazing AI tool for creative writing. The possibilities are endless! 🚀✨",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80",
    timestamp: "2 hours ago",
    likes: 24,
    comments: 5,
    shares: 3,
    isLiked: true,
    isBookmarked: false,
  },
  {
    id: "2",
    user: { name: "You", avatar: "https://i.pravatar.cc/150?img=2" },
    content: "Morning coffee and some reading. Perfect way to start the day ☕📚",
    timestamp: "Yesterday",
    likes: 18,
    comments: 3,
    shares: 1,
    isLiked: false,
    isBookmarked: true,
  },
  {
    id: "3",
    user: { name: "You", avatar: "https://i.pravatar.cc/150?img=3" },
    content: "Finally completed that project I've been working on! Feeling accomplished 🎉",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80",
    timestamp: "2 days ago",
    likes: 42,
    comments: 8,
    shares: 6,
    isLiked: false,
    isBookmarked: false,
  },
];

const Memories = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGoogleImport, setShowGoogleImport] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [timeline, setTimeline] = useState<TimelineSection[] | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuthStore();

  // 加载内容数据
  const loadMemories = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else if (pageNum === 1) {
        setIsLoading(true);
      }

      // Prefer new timeline API when user exists
      if (user?.email) {
        try {
          const r = await fetchTimeline(user.email, refresh ? undefined : cursor || undefined, 50);
          setTimeline(refresh ? r.sections : [...(timeline ?? []), ...r.sections]);
          setCursor(r.nextCursor);
          setHasMore(Boolean(r.nextCursor));
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        } catch (e) {
          console.warn('timeline api failed, fallback to sample list', e);
        }
      }

      const newMemories = await contentService.getMemories(pageNum, 20);
      
      if (refresh || pageNum === 1) {
        setMemories(newMemories);
      } else {
        setMemories(prev => [...prev, ...newMemories]);
      }
      
      setHasMore(newMemories.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load memories:', error);
      toast.error('加载内容失败');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadMemories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // 下拉刷新
  const handleRefresh = async () => {
    await loadMemories(1, true);
  };

  // 加载更多
  const handleLoadMore = async () => {
    if (!isLoading && hasMore) {
      await loadMemories(page + 1);
    }
  };

  // 内容创建成功回调
  const handleContentCreated = () => {
    loadMemories(1, true);
    toast.success("记忆已保存");
  };

  const popupOptions = [
    {
      icon: <FileText className="h-5 w-5" />,
      label: "创建记忆",
      onClick: () => {
        setShowPopup(false);
        setShowCreateModal(true);
      },
    },
    {
      icon: <Image className="h-5 w-5" />,
      label: "快速拍照",
      onClick: () => toast.info("相机功能开发中"),
    },
    {
      icon: <Video className="h-5 w-5" />,
      label: "录制视频",
      onClick: () => toast.info("视频录制功能开发中"),
    },
    {
      icon: <Link2 className="h-5 w-5" />,
      label: "分享链接",
      onClick: () => toast.info("链接分享功能开发中"),
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
            <div className="flex items-center gap-3">
              {/* Google 数据导入按钮 */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowGoogleImport(true)}
                  className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200/50 shadow-sm"
                  title="导入 Google 数据"
                >
                  <Plus className="h-5 w-5 text-blue-600" />
                </Button>
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900">Memories</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              className="hover:bg-gray-100/80 transition-all duration-200"
            >
              <motion.div
                animate={isLoading ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" }}
              >
                <RotateCcw className="h-6 w-6 text-gray-700" />
              </motion.div>
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-screen-xl mx-auto">
        <motion.div className="space-y-4 px-4 pt-4" variants={containerReverseStagger} initial="hidden" animate="show">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <MemoryCardListSkeleton count={3} />
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {timeline && timeline.length > 0 ? (
                  <MemoriesTimeline sections={timeline} />
                ) : (
                  <div className="space-y-4">
                    {(memories.length > 0 ? memories : sampleMemories).map((memory) => (
                      <motion.div key={memory.id} variants={bounceUp}>
                        <MemoryCard {...memory} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <FloatingActionButton ref={fabRef} onClick={() => setShowPopup(true)} />
      <ActionPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        options={popupOptions}
        anchorRef={fabRef}
        placement="top-end"
        offset={{ y: 12 }}
        title="Create Memory"
      />
      
      <CreateContentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleContentCreated}
      />

      {/* Google 数据导入弹窗 */}
      {user && (
        <GoogleDataImportModal
          isOpen={showGoogleImport}
          onClose={() => setShowGoogleImport(false)}
          userId={user.email || user.id}
          onComplete={() => {
            setShowGoogleImport(false);
            toast.success('数据导入完成！');
            handleRefresh(); // 刷新列表
          }}
        />
      )}
    </div>
  );
};

export default Memories;
