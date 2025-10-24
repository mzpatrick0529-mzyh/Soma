import { useState } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SocialActions } from "./SocialActions";
import { CommentModal } from "./CommentModal";
import { contentService } from "@/services/api";
import { toast } from "sonner";

interface MemoryCardProps {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export const MemoryCard = ({ 
  id,
  user, 
  content, 
  image, 
  timestamp, 
  likes, 
  comments, 
  shares = 0,
  isLiked = false,
  isBookmarked = false 
}: MemoryCardProps) => {
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleLike = async (liked: boolean, count: number) => {
    try {
      if (liked) {
        await contentService.likeMemory(id);
      } else {
        await contentService.unlikeMemory(id);
      }
      console.log(`Post ${id} ${liked ? 'liked' : 'unliked'}, new count: ${count}`);
    } catch (error) {
      toast.error('操作失败，请Retry');
      console.error('Like/unlike failed:', error);
    }
  };

  const handleComment = () => {
    setIsCommentModalOpen(true);
  };

  const handleShare = async () => {
    try {
      await contentService.shareMemory(id);
      console.log(`Post ${id} shared`);
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleBookmark = (bookmarked: boolean) => {
    console.log(`Post ${id} ${bookmarked ? 'bookmarked' : 'unbookmarked'}`);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="p-4">
            <motion.div 
              className="flex items-center gap-3 mb-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-gray-900">{user.name}</h3>
                <p className="text-xs text-gray-500">{timestamp}</p>
              </div>
            </motion.div>
            
            <motion.p 
              className="text-sm mb-3 text-gray-800 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {content}
            </motion.p>
            
            {image && (
              <motion.div 
                className="rounded-lg overflow-hidden mb-3 shadow-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
              >
                <img src={image} alt="Memory" className="w-full h-48 object-cover" />
              </motion.div>
            )}
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <SocialActions
                contentId={id}
                initialLikes={likes}
                initialComments={comments}
                initialShares={shares}
                isLiked={isLiked}
                isBookmarked={isBookmarked}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
                onBookmark={handleBookmark}
                className="pt-3 border-t border-gray-100"
              />
            </motion.div>
          </div>
        </Card>
      </motion.div>
      
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        contentId={id}
      />
    </>
  );
};
