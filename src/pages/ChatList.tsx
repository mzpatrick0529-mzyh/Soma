/**
 * 💬 Chat List Page - Soma Style
 * Unified chat list design with smooth scrolling animation and complete interactive features
 */
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  Search,
  Plus,
  UserPlus,
  Users,
  Pin,
  Archive,
  Trash2,
  MoreVertical,
  Check,
  CheckCheck,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ActionPopup } from "@/components/ActionPopup";
import { toast } from "sonner";
import { designTokens } from "@/lib/design-system";
import {
  pageSlideIn,
  cardAppear,
  staggerContainer,
  listItem,
  somaSpring,
} from "@/lib/animations";

// Types
interface Chat {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  isPinned: boolean;
  isArchived: boolean;
  isOnline: boolean;
  isTyping: boolean;
  isSelfAgent?: boolean;
  messageStatus?: "sent" | "delivered" | "read";
  isGroup?: boolean;
}

// Mock Data
const mockChats: Chat[] = [
  {
    id: "self",
    name: "My AI Self",
    lastMessage: "I've been thinking about your question...",
    timestamp: "2m ago",
    unread: 0,
    isPinned: true,
    isArchived: false,
    isOnline: true,
    isTyping: false,
    isSelfAgent: true,
    messageStatus: "read",
  },
  {
    id: "1",
    name: "Sarah Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    lastMessage: "See you at the coffee shop! ☕",
    timestamp: "5m ago",
    unread: 3,
    isPinned: true,
    isArchived: false,
    isOnline: true,
    isTyping: false,
    messageStatus: "delivered",
  },
  {
    id: "2",
    name: "Design Team",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=Design",
    lastMessage: "Alex: The new mockups look great!",
    timestamp: "1h ago",
    unread: 12,
    isPinned: false,
    isArchived: false,
    isOnline: true,
    isTyping: true,
    isGroup: true,
  },
  {
    id: "3",
    name: "Mom",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mom",
    lastMessage: "Don't forget to call grandma 💕",
    timestamp: "2h ago",
    unread: 0,
    isPinned: false,
    isArchived: false,
    isOnline: false,
    isTyping: false,
    messageStatus: "read",
  },
  {
    id: "4",
    name: "Study Group",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=Study",
    lastMessage: "You: Thanks for the notes!",
    timestamp: "Yesterday",
    unread: 0,
    isPinned: false,
    isArchived: false,
    isOnline: false,
    isTyping: false,
    isGroup: true,
    messageStatus: "read",
  },
  {
    id: "5",
    name: "John Smith",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    lastMessage: "Sounds good! Let's meet tomorrow.",
    timestamp: "2 days ago",
    unread: 0,
    isPinned: false,
    isArchived: false,
    isOnline: false,
    isTyping: false,
    messageStatus: "sent",
  },
];

const ChatList = () => {
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const plusBtnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  // Filter chats
  const filteredChats = chats.filter((chat) => {
    const matchesSearch = chat.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch && !chat.isArchived;
  });

  const pinnedChats = filteredChats.filter((c) => c.isPinned);
  const regularChats = filteredChats.filter((c) => !c.isPinned);

  // Actions
  const handleChatClick = (chatId: string) => {
    if (chatId === "self") {
      navigate("/chat/self");
    } else {
      navigate(`/chat/${chatId}`);
    }
  };

  const handlePinChat = (chatId: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, isPinned: !chat.isPinned } : chat
      )
    );
    toast.success("Chat pinned");
  };

  const handleArchiveChat = (chatId: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, isArchived: true } : chat
      )
    );
    toast.success("Chat archived");
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    toast.success("Chat deleted");
  };

  const popupOptions = [
    {
      icon: <UserPlus className="h-5 w-5" />,
      label: "New Contact",
      onClick: () => {
        setShowPopup(false);
        toast.info("Add contact coming soon");
      },
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "New Group",
      onClick: () => {
        setShowPopup(false);
        toast.info("Create group coming soon");
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pb-20">
      {/* Header - 固定不动的头部 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-gray-200/50"
      >
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
              Chat
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

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="relative"
          >
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100/80 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
            />
          </motion.div>
        </div>
      </motion.header>

      {/* Chat List - 逐一弹出效果 */}
      <main className="max-w-screen-xl mx-auto px-4 py-2">
        <div className="space-y-1">
          {/* Pinned Chats */}
          {pinnedChats.length > 0 && (
            <div className="mb-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="flex items-center gap-2 px-3 py-2"
              >
                <Pin size={14} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Pinned
                </span>
              </motion.div>
              {pinnedChats.map((chat, index) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  index={index}
                  onChatClick={handleChatClick}
                  onPin={handlePinChat}
                  onArchive={handleArchiveChat}
                  onDelete={handleDeleteChat}
                />
              ))}
            </div>
          )}

          {/* Regular Chats */}
          {regularChats.map((chat, index) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              index={index + pinnedChats.length}
              onChatClick={handleChatClick}
              onPin={handlePinChat}
              onArchive={handleArchiveChat}
              onDelete={handleDeleteChat}
            />
          ))}
        </div>

        {filteredChats.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <p className="text-gray-500">No messages found</p>
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
    </div>
  );
};

// Chat Item Component with Swipe Gesture
interface ChatItemProps {
  chat: Chat;
  index: number;
  onChatClick: (id: string) => void;
  onPin: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

const ChatItem = ({
  chat,
  index,
  onChatClick,
  onPin,
  onArchive,
  onDelete,
}: ChatItemProps) => {
  const [swipeX, setSwipeX] = useState(0);
  const [showActions, setShowActions] = useState(false);

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.x < -80) {
      setShowActions(true);
    } else {
      setSwipeX(0);
      setShowActions(false);
    }
  };

  const getStatusIcon = () => {
    if (chat.messageStatus === "sent") {
      return <Check size={14} className="text-gray-400" />;
    } else if (chat.messageStatus === "delivered") {
      return <CheckCheck size={14} className="text-gray-400" />;
    } else if (chat.messageStatus === "read") {
      return <CheckCheck size={14} className="text-indigo-600" />;
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1], // Soma spring curve
      }}
      className="relative overflow-hidden"
    >
      {/* Swipe Actions Background */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-4 bg-gradient-to-l from-red-50 to-transparent"
          >
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                onArchive(chat.id);
                setShowActions(false);
              }}
              className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <Archive size={18} className="text-gray-600" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                onDelete(chat.id);
                setShowActions(false);
              }}
              className="h-10 w-10 rounded-full bg-red-100 hover:bg-red-200"
            >
              <Trash2 size={18} className="text-red-600" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Item */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        onClick={() => !showActions && onChatClick(chat.id)}
        whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.05)" }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer bg-white relative"
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-14 w-14 border-2 border-gray-100">
            {chat.isSelfAgent ? (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-xl font-bold">✨</span>
              </div>
            ) : (
              <>
                <AvatarImage src={chat.avatar} alt={chat.name} />
                <AvatarFallback>{chat.name[0]}</AvatarFallback>
              </>
            )}
          </Avatar>
          {chat.isOnline && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
            />
          )}
          {chat.isGroup && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white">
              <Users size={10} className="text-gray-600" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">
                {chat.name}
              </h3>
              {chat.isPinned && (
                <Pin size={12} className="text-indigo-600 flex-shrink-0" />
              )}
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {chat.timestamp}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {chat.messageStatus && (
                <span className="flex-shrink-0">{getStatusIcon()}</span>
              )}
              <p
                className={`text-sm truncate ${
                  chat.unread > 0
                    ? "font-medium text-gray-900"
                    : "text-gray-600"
                } ${chat.isTyping ? "text-indigo-600 italic" : ""}`}
              >
                {chat.isTyping ? "typing..." : chat.lastMessage}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {chat.unread > 0 && (
                <Badge
                  variant="default"
                  className="h-5 min-w-[20px] px-1.5 bg-indigo-600 hover:bg-indigo-600 text-white text-xs font-semibold"
                >
                  {chat.unread > 99 ? "99+" : chat.unread}
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onPin(chat.id)}>
                    <Pin size={16} className="mr-2" />
                    {chat.isPinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onArchive(chat.id)}>
                    <Archive size={16} className="mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(chat.id)}
                    className="text-red-600"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChatList;
