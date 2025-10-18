import { useRef, useState } from "react";
import { Plus, PenSquare, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionPopup } from "@/components/ActionPopup";
import { MemoryCard } from "@/components/MemoryCard";
import { MemoryCardListSkeleton } from "@/components/skeletons/MemoryCardSkeleton";
import { InfiniteScrollIndicator } from "@/components/InfiniteScrollIndicator";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { bounceUp, containerReverseStagger, fadeDown } from "@/lib/motion";

const mockFeed = [
  {
    id: "1",
    user: { name: "Sarah Chen", avatar: "" },
    content: "Exploring the new art gallery downtown. So many inspiring pieces! 🎨",
    image: "https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=800&auto=format&fit=crop&q=80",
    timestamp: "1 hour ago",
    likes: 156,
    comments: 23,
  },
  {
    id: "2",
    user: { name: "Mike Johnson", avatar: "" },
    content: "Weekend hiking adventure completed! The view from the top was worth every step 🏔️",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80",
    timestamp: "3 hours ago",
    likes: 234,
    comments: 45,
  },
  {
    id: "3",
    user: { name: "Emma Wilson", avatar: "" },
    content: "Just launched my new project! Excited to share this with you all 🚀",
    timestamp: "5 hours ago",
    likes: 189,
    comments: 67,
  },
  {
    id: "4",
    user: { name: "David Kim", avatar: "" },
    content: "Cooking up something special tonight. Italian cuisine never disappoints! 🍝",
    image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&auto=format&fit=crop&q=80",
    timestamp: "Yesterday",
    likes: 298,
    comments: 34,
  },
];

const Feed = () => {
  const [showPopup, setShowPopup] = useState(false);
  const plusBtnRef = useRef<HTMLButtonElement>(null);
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState(mockFeed);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // 模拟加载更多数据
  const loadMorePosts = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 生成更多模拟数据
    const newPosts = Array.from({ length: 3 }, (_, index) => ({
      id: String(allPosts.length + index + 1),
      user: { 
        name: ["Alex Park", "Jordan Smith", "Taylor Lee", "Casey Wong"][Math.floor(Math.random() * 4)], 
        avatar: "" 
      },
      content: [
        "Just discovered an amazing coffee shop! ☕",
        "Beautiful sunset today 🌅",
        "Working on an exciting new project 💻",
        "Great workout session this morning 💪"
      ][Math.floor(Math.random() * 4)],
      timestamp: `${Math.floor(Math.random() * 12)} hours ago`,
      likes: Math.floor(Math.random() * 300),
      comments: Math.floor(Math.random() * 50),
    }));

    setAllPosts(prev => [...prev, ...newPosts]);
    setPage(prev => prev + 1);
    
    // 模拟有限数据
    if (page >= 5) {
      setHasMore(false);
    }
    
    setLoading(false);
  };

  // 滚动监听
  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop
      >= document.documentElement.offsetHeight - 1000
    ) {
      loadMorePosts();
    }
  };

  useState(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const popupOptions = [
    {
      icon: <PenSquare className="h-5 w-5" />,
      label: "Create Post",
      onClick: () => toast.info("Create post coming soon"),
    },
    {
      icon: <Bell className="h-5 w-5" />,
      label: "Notifications",
      onClick: () => toast.info("Notifications coming soon"),
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
            <h1 className="text-3xl font-bold text-gray-900">Feed</h1>
            <Button
              ref={plusBtnRef}
              size="icon"
              variant="ghost"
              onClick={() => setShowPopup(true)}
              className="hover:bg-gray-100/80 transition-all duration-200"
            >
              <Plus className="h-6 w-6 text-gray-700" />
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-screen-xl mx-auto">
        <motion.div className="space-y-4 px-4 pt-4" variants={containerReverseStagger} initial="hidden" animate="show">
          {allPosts.map((post) => (
            <motion.div key={post.id} variants={bounceUp}>
              <MemoryCard {...post} />
            </motion.div>
          ))}
          
          {/* 无限滚动指示器 */}
          <motion.div variants={bounceUp}>
            <InfiniteScrollIndicator
              loading={loading}
              hasMore={hasMore}
              error={null}
              onRetry={loadMorePosts}
            />
          </motion.div>
        </motion.div>
      </main>

      <ActionPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        options={popupOptions}
        anchorRef={plusBtnRef}
        placement="bottom-end"
        offset={{ y: 8 }}
      />
    </div>
  );
};

export default Feed;
