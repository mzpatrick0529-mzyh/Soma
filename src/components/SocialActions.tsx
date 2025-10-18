import { useState } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { toast } from "sonner";

interface SocialActionsProps {
  contentId: string;
  initialLikes?: number;
  initialComments?: number;
  initialShares?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  className?: string;
  onLike?: (liked: boolean, count: number) => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: (bookmarked: boolean) => void;
}

export const SocialActions = ({
  contentId,
  initialLikes = 0,
  initialComments = 0,
  initialShares = 0,
  isLiked = false,
  isBookmarked = false,
  className,
  onLike,
  onComment,
  onShare,
  onBookmark,
}: SocialActionsProps) => {
  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [commentsCount] = useState(initialComments);
  const [sharesCount, setSharesCount] = useState(initialShares);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = async () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const newLikedState = !liked;
    const newLikesCount = newLikedState ? likesCount + 1 : likesCount - 1;
    
    // 立即更新UI（乐观更新）
    setLiked(newLikedState);
    setLikesCount(newLikesCount);
    
    // 触觉反馈
    if (newLikedState) {
      haptic.success();
    } else {
      haptic.light();
    }
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 回调通知父组件
      onLike?.(newLikedState, newLikesCount);
      
    } catch (error) {
      // 如果失败，回滚状态
      setLiked(!newLikedState);
      setLikesCount(newLikedState ? likesCount - 1 : likesCount + 1);
      toast.error("操作失败，请重试");
    } finally {
      setTimeout(() => setIsAnimating(false), 200);
    }
  };

  const handleComment = () => {
    haptic.medium();
    onComment?.();
  };

  const handleShare = async () => {
    haptic.medium();
    
    try {
      // 检查是否支持原生分享
      if (navigator.share) {
        await navigator.share({
          title: 'Synapse Weave Grid',
          text: '查看这个有趣的内容',
          url: `${window.location.origin}/content/${contentId}`,
        });
        
        setSharesCount(prev => prev + 1);
        onShare?.();
      } else {
        // 降级到复制链接
        const url = `${window.location.origin}/content/${contentId}`;
        await navigator.clipboard.writeText(url);
        toast.success("链接已复制到剪贴板");
        
        setSharesCount(prev => prev + 1);
        onShare?.();
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error("分享失败");
      }
    }
  };

  const handleBookmark = async () => {
    const newBookmarkedState = !bookmarked;
    setBookmarked(newBookmarkedState);
    
    haptic.light();
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 200));
      
      toast.success(newBookmarkedState ? "已收藏" : "已取消收藏");
      onBookmark?.(newBookmarkedState);
      
    } catch (error) {
      // 回滚状态
      setBookmarked(!newBookmarkedState);
      toast.error("操作失败，请重试");
    }
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-4">
        {/* 点赞按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={isAnimating}
          className={cn(
            "group relative overflow-hidden transition-all duration-200",
            liked && "text-red-500 hover:text-red-600"
          )}
        >
          <Heart 
            className={cn(
              "h-5 w-5 transition-all duration-200",
              liked && "fill-current scale-110",
              isAnimating && "animate-pulse"
            )} 
          />
          {likesCount > 0 && (
            <span className="ml-1 text-sm font-medium">
              {likesCount.toLocaleString()}
            </span>
          )}
          
          {/* 点赞动画效果 */}
          {isAnimating && liked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-red-500/20 rounded-full animate-ping" />
            </div>
          )}
        </Button>

        {/* 评论按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleComment}
          className="group"
        >
          <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
          {commentsCount > 0 && (
            <span className="ml-1 text-sm font-medium">
              {commentsCount.toLocaleString()}
            </span>
          )}
        </Button>

        {/* 分享按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="group"
        >
          <Share2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
          {sharesCount > 0 && (
            <span className="ml-1 text-sm font-medium">
              {sharesCount.toLocaleString()}
            </span>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {/* 收藏按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBookmark}
          className={cn(
            "group",
            bookmarked && "text-yellow-500 hover:text-yellow-600"
          )}
        >
          <Bookmark 
            className={cn(
              "h-5 w-5 transition-all duration-200",
              bookmarked && "fill-current"
            )} 
          />
        </Button>

        {/* 更多选项 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toast.info("更多选项功能开发中")}
          className="group"
        >
          <MoreHorizontal className="h-5 w-5 group-hover:scale-110 transition-transform" />
        </Button>
      </div>
    </div>
  );
};