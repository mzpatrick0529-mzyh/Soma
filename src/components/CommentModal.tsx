import { useState, useRef, useEffect } from "react";
import { Send, X, Heart, MoreHorizontal, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { toast } from "sonner";

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
  parentId?: string;
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  initialComments?: Comment[];
}

export const CommentModal = ({ 
  isOpen, 
  onClose, 
  contentId, 
  initialComments = [] 
}: CommentModalProps) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 模拟评论数据
  const mockComments: Comment[] = [
    {
      id: "1",
      author: { id: "user1", name: "Alice Chen", avatar: "" },
      content: "这个内容很有趣！感谢分享 👍",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      likes: 12,
      isLiked: false,
      replies: [
        {
          id: "1-1",
          author: { id: "user2", name: "Bob Wang", avatar: "" },
          content: "完全同意！",
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          likes: 3,
          isLiked: true,
          parentId: "1",
        }
      ]
    },
    {
      id: "2",
      author: { id: "user3", name: "Carol Liu", avatar: "" },
      content: "非常实用的信息，已经收藏了！",
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      likes: 8,
      isLiked: false,
    }
  ];

  useEffect(() => {
    if (isOpen && comments.length === 0) {
      // 模拟加载评论
      setTimeout(() => {
        setComments(mockComments);
      }, 500);
    }
  }, [isOpen]);

  useEffect(() => {
    if (replyTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyTo]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    haptic.medium();

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));

      const comment: Comment = {
        id: Date.now().toString(),
        author: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        },
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
        likes: 0,
        isLiked: false,
        parentId: replyTo || undefined,
      };

      if (replyTo) {
        // 添加回复
        setComments(prev => prev.map(c => {
          if (c.id === replyTo) {
            return {
              ...c,
              replies: [...(c.replies || []), comment]
            };
          }
          return c;
        }));
      } else {
        // 添加新评论
        setComments(prev => [comment, ...prev]);
      }

      setNewComment("");
      setReplyTo(null);
      toast.success("评论发布成功");

    } catch (error) {
      toast.error("评论发布失败，请Retry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string, isReply = false, parentId?: string) => {
    haptic.light();

    try {
      if (isReply && parentId) {
        // Likes回复
        setComments(prev => prev.map(c => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: c.replies?.map(r => {
                if (r.id === commentId) {
                  return {
                    ...r,
                    isLiked: !r.isLiked,
                    likes: r.isLiked ? r.likes - 1 : r.likes + 1,
                  };
                }
                return r;
              })
            };
          }
          return c;
        }));
      } else {
        // Likes评论
        setComments(prev => prev.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              isLiked: !c.isLiked,
              likes: c.isLiked ? c.likes - 1 : c.likes + 1,
            };
          }
          return c;
        }));
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      toast.error("操作失败");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const CommentItem = ({ 
    comment, 
    isReply = false, 
    parentId 
  }: { 
    comment: Comment; 
    isReply?: boolean; 
    parentId?: string; 
  }) => (
    <div className={cn("space-y-3", isReply && "ml-8 pt-3")}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.author.avatar} />
          <AvatarFallback className="text-xs">
            {getInitials(comment.author.name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{comment.author.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatTime(comment.createdAt)}
              </span>
            </div>
            <p className="text-sm">{comment.content}</p>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLikeComment(comment.id, isReply, parentId)}
              className={cn(
                "h-6 px-2 text-xs",
                comment.isLiked && "text-red-500"
              )}
            >
              <Heart className={cn(
                "h-3 w-3 mr-1",
                comment.isLiked && "fill-current"
              )} />
              {comment.likes > 0 && comment.likes}
            </Button>
            
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(comment.id)}
                className="h-6 px-2 text-xs"
              >
                <Reply className="h-3 w-3 mr-1" />
                回复
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.info("更多操作功能开发中")}
              className="h-6 px-2"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* 显示回复 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map(reply => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              isReply={true} 
              parentId={comment.id}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>评论 {comments.length > 0 && `(${comments.length})`}</DialogTitle>
        </DialogHeader>

        {/* 评论列表 */}
        <ScrollArea className="flex-1 px-1">
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无评论，来发表第一条吧！
              </div>
            ) : (
              comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* 评论输入框 */}
        <div className="space-y-3">
          {replyTo && (
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded p-2">
              <span>回复评论中...</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          <div className="flex gap-3">
            {user && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className="flex-1 space-y-2">
              <Textarea
                ref={textareaRef}
                placeholder={replyTo ? "写下你的回复..." : "写下你的评论..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px] resize-none"
                disabled={isSubmitting}
              />
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {newComment.length}/500
                </span>
                
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  size="sm"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      发布
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};