/**
 * 🌊 Feed Page - Soma Style
 * Twitter/X 风格时间线，Following/Discover 双模式，高质量社交体验
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  TrendingUp,
  Sparkles,
  Heart,
  MessageCircle,
  Repeat2,
  Share2,
  Bookmark,
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  Smile,
  MapPin,
  Hash,
  Send,
  X,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Types
interface Post {
  id: string;
  user: {
    name: string;
    username: string;
    avatar?: string;
    verified?: boolean;
  };
  content: string;
  media?: {
    type: "image" | "video";
    url: string;
  }[];
  timestamp: string;
  likes: number;
  retweets: number;
  comments: number;
  isLiked: boolean;
  isRetweeted: boolean;
  isBookmarked: boolean;
  hashtags?: string[];
}

// Mock Data
const mockPosts: Post[] = [
  {
    id: "1",
    user: {
      name: "AI Research Lab",
      username: "@ailab",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ailab",
      verified: true,
    },
    content: "刚发布了我们的最新研究论文！在多模态学习领域取得了突破性进展 🚀\n\n论文链接：https://arxiv.org/...\n\n#AI #MachineLearning #Research",
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80",
      },
    ],
    timestamp: "2小时前",
    likes: 342,
    retweets: 128,
    comments: 45,
    isLiked: false,
    isRetweeted: false,
    isBookmarked: false,
    hashtags: ["AI", "MachineLearning", "Research"],
  },
  {
    id: "2",
    user: {
      name: "Design Studio",
      username: "@designstudio",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=design",
    },
    content: "新项目上线！用了 3 个月打磨的产品设计，终于和大家见面了 ✨\n\n每一个细节都经过反复推敲，希望能给用户带来愉悦的体验。",
    timestamp: "4小时前",
    likes: 567,
    retweets: 234,
    comments: 89,
    isLiked: true,
    isRetweeted: false,
    isBookmarked: true,
  },
  {
    id: "3",
    user: {
      name: "Tech News",
      username: "@technews",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=tech",
      verified: true,
    },
    content: "⚡️ 快讯：Apple 发布全新 Vision Pro 更新\n\n• 新增多任务处理功能\n• 性能提升 40%\n• 续航时间延长至 8 小时\n\n这可能是 VR/AR 行业的转折点！",
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1593642532400-2682810df593?w=800&auto=format&fit=crop&q=80",
      },
    ],
    timestamp: "昨天",
    likes: 1234,
    retweets: 567,
    comments: 234,
    isLiked: true,
    isRetweeted: true,
    isBookmarked: false,
    hashtags: ["Apple", "VisionPro", "VR"],
  },
  {
    id: "4",
    user: {
      name: "Startup Founder",
      username: "@founder",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=founder",
    },
    content: "创业第 365 天 🎉\n\n从想法到产品，从 0 到 10000 用户，这一年学到太多。\n\n感谢每一位支持我们的用户，我们会继续努力！",
    timestamp: "2天前",
    likes: 890,
    retweets: 345,
    comments: 156,
    isLiked: false,
    isRetweeted: false,
    isBookmarked: true,
  },
];

const trendingTopics = [
  { tag: "AI开发者大会", posts: "12.3K" },
  { tag: "产品设计", posts: "8.9K" },
  { tag: "创业故事", posts: "6.7K" },
  { tag: "科技新闻", posts: "15.2K" },
];

const Feed = () => {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedMode, setFeedMode] = useState<"following" | "discover">("following");
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeContent, setComposeContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle post interactions
  const handleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const handleRetweet = (id: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? {
              ...post,
              isRetweeted: !post.isRetweeted,
              retweets: post.isRetweeted ? post.retweets - 1 : post.retweets + 1,
            }
          : post
      )
    );
    toast.success(posts.find((p) => p.id === id)?.isRetweeted ? "已取消转发" : "已转发");
  };

  const handleBookmark = (id: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id ? { ...post, isBookmarked: !post.isBookmarked } : post
      )
    );
    toast.success("已添加到书签");
  };

  const handleComment = (id: string) => {
    toast.info("评论功能开发中");
  };

  const handleShare = (id: string) => {
    toast.info("分享功能开发中");
  };

  const handleCompose = () => {
    if (!composeContent.trim()) return;
    toast.success("发布成功！");
    setComposeContent("");
    setShowComposeModal(false);
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery.trim()) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const contentMatch = post.content.toLowerCase().includes(lowerQuery);
    const userMatch =
      post.user.name.toLowerCase().includes(lowerQuery) ||
      post.user.username.toLowerCase().includes(lowerQuery);
    const hashtagMatch = post.hashtags?.some((tag) =>
      tag.toLowerCase().includes(lowerQuery)
    );
    return contentMatch || userMatch || hashtagMatch;
  });

  useEffect(() => {
    if (showComposeModal && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showComposeModal]);

  return (
    <div className="min-h-screen bg-white pb-20">
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
              Feed
            </h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-4"
          >
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              type="text"
              placeholder="Search feed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100/80 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
            />
          </motion.div>

          {/* Mode Switcher */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="flex border-b border-gray-200"
          >
            <button
              onClick={() => setFeedMode("following")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
                feedMode === "following"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Following
              {feedMode === "following" && (
                <motion.div
                  layoutId="feedModeIndicator"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
            </button>
            <button
              onClick={() => setFeedMode("discover")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
                feedMode === "discover"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                <Sparkles size={16} />
                Discover
              </span>
              {feedMode === "discover" && (
                <motion.div
                  layoutId="feedModeIndicator"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          </motion.div>
        </div>
      </motion.header>

      <div className="max-w-screen-lg mx-auto flex gap-6">
        {/* Main Feed */}
        <main className="flex-1 border-r border-gray-200/50">
          <AnimatePresence mode="wait">
            {filteredPosts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                index={index * 0.015}
                onLike={handleLike}
                onRetweet={handleRetweet}
                onComment={handleComment}
                onBookmark={handleBookmark}
                onShare={handleShare}
              />
            ))}
          </AnimatePresence>
        </main>

        {/* Sidebar - Trending */}
        <aside className="hidden lg:block w-80 py-4 pr-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03, duration: 0.24 }}
            className="sticky top-20"
          >
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="搜索..."
                className="w-full px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Trending Topics */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-600" />
                热门话题
              </h3>
              <div className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <motion.button
                    key={topic.tag}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.045 + index * 0.015 }}
                    whileHover={{ x: 4 }}
                    className="w-full text-left p-3 rounded-xl hover:bg-white transition-colors"
                  >
                    <p className="text-sm text-gray-500 mb-1">正在流行</p>
                    <p className="font-semibold text-gray-900">#{topic.tag}</p>
                    <p className="text-xs text-gray-500 mt-1">{topic.posts} 条帖子</p>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </aside>
      </div>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 25 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowComposeModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full shadow-lg flex items-center justify-center z-40"
      >
        <Plus size={24} />
      </motion.button>

      {/* Compose Modal */}
      <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>发布新内容</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              ref={textareaRef}
              placeholder="分享你的想法..."
              value={composeContent}
              onChange={(e) => setComposeContent(e.target.value)}
              className="min-h-[150px] resize-none border-0 focus-visible:ring-0 text-base"
            />
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="text-indigo-600">
                  <ImageIcon size={20} />
                </Button>
                <Button variant="ghost" size="icon" className="text-indigo-600">
                  <Video size={20} />
                </Button>
                <Button variant="ghost" size="icon" className="text-indigo-600">
                  <Smile size={20} />
                </Button>
                <Button variant="ghost" size="icon" className="text-indigo-600">
                  <Hash size={20} />
                </Button>
                <Button variant="ghost" size="icon" className="text-indigo-600">
                  <MapPin size={20} />
                </Button>
              </div>
              <Button
                onClick={handleCompose}
                disabled={!composeContent.trim()}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
              >
                <Send size={16} className="mr-2" />
                发布
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Post Card Component
interface PostCardProps {
  post: Post;
  index: number;
  onLike: (id: string) => void;
  onRetweet: (id: string) => void;
  onComment: (id: string) => void;
  onBookmark: (id: string) => void;
  onShare: (id: string) => void;
}

const PostCard = ({
  post,
  index,
  onLike,
  onRetweet,
  onComment,
  onBookmark,
  onShare,
}: PostCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index,
        duration: 0.24,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="border-b border-gray-200/50 p-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="h-12 w-12">
          <AvatarImage src={post.user.avatar} />
          <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700">
            {post.user.name[0]}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* User Info */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{post.user.name}</span>
              {post.user.verified && (
                <span className="text-blue-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                  </svg>
                </span>
              )}
              <span className="text-gray-500 text-sm">{post.user.username}</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500 text-sm">{post.timestamp}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal size={16} className="text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>分享到...</DropdownMenuItem>
                <DropdownMenuItem>复制链接</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>不感兴趣</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">举报</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Post Content */}
          <p className="text-gray-900 mb-3 whitespace-pre-wrap">{post.content}</p>

          {/* Media */}
          {post.media && post.media.length > 0 && (
            <div className="mb-3 rounded-2xl overflow-hidden border border-gray-200">
              {post.media[0].type === "image" && (
                <img
                  src={post.media[0].url}
                  alt="post media"
                  className="w-full aspect-video object-cover"
                />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between max-w-md mt-2">
            {/* Comment */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onComment(post.id)}
              className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-indigo-50 transition-colors">
                <MessageCircle size={18} />
              </div>
              <span className="text-sm">{post.comments}</span>
            </motion.button>

            {/* Retweet */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onRetweet(post.id)}
              className={`flex items-center gap-2 transition-colors group ${
                post.isRetweeted
                  ? "text-green-600"
                  : "text-gray-500 hover:text-green-600"
              }`}
            >
              <div
                className={`p-2 rounded-full transition-colors ${
                  post.isRetweeted
                    ? "bg-green-50"
                    : "group-hover:bg-green-50"
                }`}
              >
                <Repeat2 size={18} />
              </div>
              <span className="text-sm">{post.retweets}</span>
            </motion.button>

            {/* Like */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-2 transition-colors group ${
                post.isLiked ? "text-red-600" : "text-gray-500 hover:text-red-600"
              }`}
            >
              <div
                className={`p-2 rounded-full transition-colors ${
                  post.isLiked ? "bg-red-50" : "group-hover:bg-red-50"
                }`}
              >
                <Heart
                  size={18}
                  className={post.isLiked ? "fill-current" : ""}
                />
              </div>
              <span className="text-sm">{post.likes}</span>
            </motion.button>

            {/* Bookmark */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onBookmark(post.id)}
              className={`p-2 rounded-full transition-colors ${
                post.isBookmarked
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              <Bookmark
                size={18}
                className={post.isBookmarked ? "fill-current" : ""}
              />
            </motion.button>

            {/* Share */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onShare(post.id)}
              className="p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Share2 size={18} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default Feed;
