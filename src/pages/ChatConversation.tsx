/**
 * Enhanced Chat Conversation Page - WhatsApp + iMessage Inspired
 * Supports text, images, videos, files, voice messages
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Phone, Video, MoreVertical, Send, Plus,
  Image as ImageIcon, Paperclip, Mic, Smile, Check, CheckCheck
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MediaUploader, type MediaFile } from "@/components/MediaUploader";
import { EmojiPicker } from "@/components/EmojiPicker";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { 
  messageBubble, buttonPress, typingIndicator, cardAppear 
} from "@/lib/animations";
import { generateChat } from "@/services/selfAgent";
import { streamChat } from "@/services/streamChat";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import "@/styles/chat-animations.css";

type Message = {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: "text" | "image" | "video" | "file" | "audio";
  mediaUrl?: string;
  status: "sending" | "sent" | "delivered" | "read";
};

type Contact = {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  isTyping?: boolean;
};

export default function ChatConversation() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { contactId } = useParams();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock contact data - replace with real API call
  const contact: Contact = {
    id: contactId || "self",
    name: contactId === "self" ? "My AI Self" : `Contact ${contactId}`,
    avatar: contactId === "self" 
      ? undefined 
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${contactId}`,
    isOnline: true,
    isTyping: false,
  };

  const currentUserId = "me";

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load initial messages
  useEffect(() => {
    setMessages([
      {
        id: "1",
        senderId: contact.id,
        content: contactId === "self" 
          ? "你好！我是你的 Self Agent，有什么可以帮助你的？" 
          : "Hey! How's it going?",
        timestamp: new Date(Date.now() - 3600000),
        type: "text",
        status: "read",
      },
    ]);
  }, [contact.id, contactId]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text && mediaFiles.length === 0) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      content: text,
      timestamp: new Date(),
      type: mediaFiles.length > 0 ? mediaFiles[0].type : "text",
      mediaUrl: mediaFiles[0]?.preview,
      status: "sending",
    };

    setInput("");
    setMediaFiles([]);
    setShowEmojiPicker(false);
    setMessages(prev => [...prev, newMessage]);

    // 构建历史记录
    const history = messages.map(m => ({
      role: m.senderId === currentUserId ? "user" as const : "assistant" as const,
      content: m.content,
    }));
    history.push({ role: "user", content: text });

    // 创建 AI 消息占位符（用于流式输出）
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      senderId: contact.id,
      content: "",
      timestamp: new Date(),
      type: "text",
      status: "sending",
    };

    try {
      // 更新用户消息状态
      setMessages(prev => prev.map(m => 
        m.id === newMessage.id ? { ...m, status: "sent" } : m
      ));

      // 延迟添加 AI 消息（模拟打字延迟）
      setTimeout(() => {
        setMessages(prev => [...prev, aiMessage]);
      }, 300);

      // 根据输入内容判断是否优先召回 Instagram 数据
      const lower = text.toLowerCase();
      const shouldFocusInstagram = /\binstagram\b|\big\b|\bins\b|私信|聊天|对话/.test(lower);
      const sources = shouldFocusInstagram ? ["instagram"] : undefined;

      // 使用流式 API
      await streamChat({
        userId: user?.email || user?.id || "my_google_user",
        history,
        hint: contact.id === "self" ? undefined : `模拟与${contact.name}的对话`,
        sources,
        onChunk: (chunk) => {
          setMessages(prev => prev.map(m =>
            m.id === aiMessageId
              ? { ...m, content: m.content + chunk, status: "delivered" }
              : m
          ));
        },
        onComplete: (fullText) => {
          setMessages(prev => prev.map(m =>
            m.id === aiMessageId
              ? { ...m, content: fullText, status: "delivered" }
              : m
          ));
        },
        onError: (error) => {
          toast.error("发送失败: " + error.message);
          // 移除失败的消息
          setMessages(prev => prev.filter(m => m.id !== aiMessageId));
        },
      });
    } catch (error: any) {
      toast.error("发送失败: " + (error?.message || "未知错误"));
      setMessages(prev => prev.filter(m => m.id !== newMessage.id && m.id !== aiMessageId));
    }
  };

  // Voice recording handler (adds audio message)
  const handleVoiceRecording = async (blob: Blob, duration: number) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      content: `语音消息 (${Math.floor(duration)}秒)`,
      timestamp: new Date(),
      type: "audio",
      mediaUrl: URL.createObjectURL(blob),
      status: "sent",
    };
    setMessages(prev => [...prev, newMessage]);
    toast.success("语音消息已发送");
  };

  const renderMessage = (msg: Message) => {
    const isOwn = msg.senderId === currentUserId;
    
    return (
      <motion.div
        key={msg.id}
        variants={messageBubble}
        initial="hidden"
        animate="visible"
        className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}
      >
        {!isOwn && (
          <Avatar className="h-8 w-8 mr-2 mt-1">
            <AvatarImage src={contact.avatar} />
            <AvatarFallback>{contact.name[0]}</AvatarFallback>
          </Avatar>
        )}
        
        <div
          className={`
            max-w-[70%] rounded-2xl px-4 py-2 shadow-sm
            ${isOwn 
              ? "bg-blue-600 text-white rounded-br-md" 
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md"
            }
          `}
        >
          {/* Media Content */}
          {msg.type === "image" && msg.mediaUrl && (
            <img 
              src={msg.mediaUrl} 
              alt="shared" 
              className="rounded-lg mb-2 max-w-full"
            />
          )}
          {msg.type === "video" && msg.mediaUrl && (
            <video 
              src={msg.mediaUrl} 
              controls 
              className="rounded-lg mb-2 max-w-full"
            />
          )}
          {msg.type === "audio" && msg.mediaUrl && (
            <audio src={msg.mediaUrl} controls className="mb-2" />
          )}

          {/* Text Content */}
          {msg.content && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {msg.content}
            </p>
          )}

          {/* Metadata */}
          <div className={`flex items-center gap-1 mt-1 text-xs ${isOwn ? "text-blue-100" : "text-gray-500"}`}>
            <span>{msg.timestamp.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
            {isOwn && (
              <>
                {msg.status === "sent" && <Check className="h-3 w-3" />}
                {msg.status === "delivered" && <CheckCheck className="h-3 w-3" />}
                {msg.status === "read" && <CheckCheck className="h-3 w-3 text-blue-400" />}
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 35,
        mass: 0.8,
      }}
      className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950"
    >
      {/* Header - 快速渐显 */}
      <motion.header
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.2 }}
        className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 px-4 py-3 flex items-center justify-between z-10"
      >
        <div className="flex items-center gap-3 flex-1">
          <motion.div
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/chat")}
              className="h-9 w-9 text-gray-700 hover:text-indigo-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
          >
            <Avatar className="h-10 w-10 ring-2 ring-indigo-100">
              {contact.id === "self" ? (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">✨</span>
                </div>
              ) : (
                <>
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700">
                    {contact.name[0]}
                  </AvatarFallback>
                </>
              )}
            </Avatar>
          </motion.div>

          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.2 }}
            className="flex-1"
          >
            <h2 className="font-semibold text-gray-900 dark:text-white">{contact.name}</h2>
            <p className="text-xs text-gray-500">
              {contact.isOnline ? (
                <span className="flex items-center gap-1">
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-2 w-2 bg-green-500 rounded-full"
                  />
                  在线
                </span>
              ) : (
                `最后在线: ${contact.lastSeen?.toLocaleString() || "未知"}`
              )}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.2 }}
          className="flex gap-2"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:text-indigo-600">
              <Phone className="h-5 w-5" />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:text-indigo-600">
              <Video className="h-5 w-5" />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:text-indigo-600">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>
      </motion.header>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-4">
        <AnimatePresence mode="popLayout">
          {messages.map(renderMessage)}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {contact.isTyping && (
            <motion.div
              variants={typingIndicator}
              initial="initial"
              animate="animate"
              exit="initial"
              className="flex items-center gap-2 mb-3"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={contact.avatar} />
                <AvatarFallback>{contact.name[0]}</AvatarFallback>
              </Avatar>
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full px-4 py-2 flex gap-2 typing-dots">
                <span className="dot-delay-0" />
                <span className="dot-delay-150" />
                <span className="dot-delay-300" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Media Uploader */}
      <AnimatePresence>
        {showMediaUploader && (
          <motion.div
            variants={cardAppear}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="px-4 py-3 bg-white dark:bg-gray-900 border-t dark:border-gray-800"
          >
            <MediaUploader
              onFilesSelected={setMediaFiles}
              maxFiles={5}
              maxSizeMB={100}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar - 快速响应 */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.2 }}
        className="bg-white dark:bg-gray-900 border-t dark:border-gray-800 px-4 py-3"
      >
        <div className="flex items-end gap-2">
          {/* Attachments */}
          <div className="flex gap-1">
            <motion.div 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-gray-600 hover:text-indigo-600"
                onClick={() => setShowMediaUploader(!showMediaUploader)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <EmojiPicker 
                onSelect={(emoji) => {
                  setInput(prev => prev + emoji);
                  inputRef.current?.focus();
                }} 
              />
            </motion.div>
          </div>

          {/* Text Input - 跟手的输入框 */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="输入消息..."
              className="w-full bg-gray-100 dark:bg-gray-800 border-0 rounded-2xl pr-12 focus:ring-2 focus:ring-indigo-500 transition-all duration-150"
              disabled={isLoading}
            />
          </div>

          {/* Send or Voice */}
          {input.trim() || mediaFiles.length > 0 ? (
            <motion.div
              key="send"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={isLoading}
                className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Send className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </motion.div>
          ) : (
            <VoiceRecorder onRecordingComplete={handleVoiceRecording} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
