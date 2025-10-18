import { useRef, useState } from "react";
import { Plus, UserPlus, Users, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ActionPopup } from "@/components/ActionPopup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// 卡通头像映射
const avatarEmojis: Record<number | string, string> = {
  1: "🤖", // AI Assistant
  2: "👨‍👩‍👧‍👦", // Family Group
  3: "👥", // Best Friends
  4: "💼", // Work Team
};

const mockChats = [
  {
    id: 1,
    name: "AI Assistant",
    lastMessage: "How can I help you today?",
    timestamp: "10:30 AM",
    unread: 2,
    isAI: true,
  },
  {
    id: 2,
    name: "Family Group",
    lastMessage: "Mom: See you at dinner!",
    timestamp: "Yesterday",
    unread: 0,
    isGroup: true,
  },
  {
    id: 3,
    name: "Best Friends",
    lastMessage: "Sarah: That's hilarious! 😂",
    timestamp: "Yesterday",
    unread: 5,
    isGroup: true,
  },
  {
    id: 4,
    name: "Work Team",
    lastMessage: "Meeting at 3 PM tomorrow",
    timestamp: "2 days ago",
    unread: 0,
    isGroup: true,
  },
];

const Chat = () => {
  const [showPopup, setShowPopup] = useState(false);
  const plusBtnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  const popupOptions = [
    {
      icon: <UserPlus className="h-5 w-5" />,
      label: "Add New Contact",
      onClick: () => toast.info("Add contact coming soon"),
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Create New Group",
      onClick: () => toast.info("Create group coming soon"),
    },
  ];

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 backdrop-blur-xl bg-white/90 border-b border-gray-200/50"
      >
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Chats
            </h1>
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
          
          {/* Search Bar */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100/80 border-0 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
            />
          </div>
        </div>
      </motion.header>

      <main className="max-w-screen-xl mx-auto">
        <div className="space-y-1">
          {mockChats.map((chat, index) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="mx-4 p-4 hover:shadow-md cursor-pointer border-0 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white"
                onClick={() => {
                  if (chat.isAI) {
                    navigate("/chat/self");
                  } else {
                    navigate(`/chat/${chat.id}`);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl ${
                      chat.isAI 
                        ? "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" 
                        : chat.isGroup 
                          ? "bg-gradient-to-br from-purple-400 to-pink-400"
                          : "bg-gradient-to-br from-green-500 to-emerald-500"
                    }`}>
                      {avatarEmojis[chat.id] || "👤"}
                    </div>
                    {chat.unread > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
                      >
                        {chat.unread}
                      </motion.div>
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{chat.name}</h3>
                        {chat.isAI && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                            AI
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{chat.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>

      <ActionPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        options={popupOptions}
        anchorRef={plusBtnRef}
        placement="bottom-end"
        offset={{ x: 0, y: 8 }}
        title="Chat Options"
      />
    </div>
  );
};

export default Chat;
