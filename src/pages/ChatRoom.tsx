/**
 * 💬 Chat Room - Instagram & WhatsApp Style
 * 高质量对话界面，支持文本、语音、文件、图片、视频
 */
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  Send,
  Image as ImageIcon,
  FileText,
  Film,
  Download,
  Check,
  CheckCheck,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useTempMediaStore } from "@/stores/tempMediaStore";
import { chatStream, generateChat } from "@/services/selfAgent";
import { PhotoPicker } from "@/components/PhotoPicker";
import { PhotoAsset } from "@/lib/photoLibrary";

// 卡通头像映射系统
const avatarEmojis: Record<string, string> = {
  "self": "🤖",
  "1": "😊",
  "2": "👨‍👩‍👧‍👦",
  "3": "👥",
  "4": "💼",
};

// 根据ID获取头像emoji
const getAvatarEmoji = (id: string): string => {
  return avatarEmojis[id] || "👤";
};

// Message types
type MessageType = "text" | "image" | "video" | "file" | "voice";
type MessageStatus = "sending" | "sent" | "delivered" | "read";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  content: string;
  timestamp: number;
  status?: MessageStatus;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number; // for voice messages
  thumbnail?: string; // for videos
}

interface ChatInfo {
  id: string;
  name: string;
  avatar?: string;
  type: "individual" | "group" | "ai";
  isOnline?: boolean;
  lastSeen?: number;
  members?: number;
}

export default function ChatRoom() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tempAssets, clearTempAssets } = useTempMediaStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingInterval = useRef<number | null>(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  // Chat info (would come from API in production)
  const [chatInfo, setChatInfo] = useState<ChatInfo>({
    id: chatId || "self",
    name: chatId === "self" ? "Self Agent" : `Contact ${chatId}`,
    type: chatId === "self" ? "ai" : "individual",
    isOnline: true,
  });

  // Load chat history from localStorage
  useEffect(() => {
    const storageKey = `chat_history_${chatId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    } else if (chatId === "self") {
      // Add welcome message for Self Agent
      setMessages([
        {
          id: "welcome",
          senderId: "self-agent",
          senderName: "Self Agent",
          type: "text",
          content: "你好！我是你的 Self Agent，基于你的记忆数据训练而成。我可以模拟你的思考、Languageand行为方式。有什么我可以帮助你的吗？",
          timestamp: Date.now(),
          status: "read",
        },
      ]);
    }
  }, [chatId]);

  // Save chat history
  useEffect(() => {
    if (messages.length > 0) {
      const storageKey = `chat_history_${chatId}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, chatId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle send message
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      senderId: user?.id || "current-user",
      senderName: user?.name || "You",
      type: "text",
      content: text,
      timestamp: Date.now(),
      status: "sent",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    // If Self Agent, get AI response
    if (chatId === "self" && user) {
      setIsTyping(true);
      setLoading(true);
      try {
        const userId = user.email || user.id;
        const history = messages
          .filter((m) => m.type === "text")
          .map((m) => ({
            role: m.senderId === user.id ? ("user" as const) : ("assistant" as const),
            content: m.content,
          }));
        
        // 添加当前用户消息
        let currentMessage = text;
        
        // 如果有临时媒体，附加媒体信息到消息上下文
        if (tempAssets.length > 0) {
          const mediaInfo = tempAssets.map((asset, idx) => {
            return `[${asset.type === "photo" ? "IMAGE" : "VIDEO"}] ${asset.uri}`;
          }).join("\n");
          currentMessage = `${text}\n\n媒体附件:\n${mediaInfo}`;
          
          toast.info(`正在处理 ${tempAssets.length} 个媒体文件...`);
        }
        
        history.push({ role: "user", content: currentMessage });

        // Try streaming first
        let response = "";
        try {
          for await (const chunk of chatStream({ userId, history, useContext: true })) {
            response += chunk;
            // Update AI message in real-time
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.senderId === "self-agent") {
                return [...prev.slice(0, -1), { ...last, content: response }];
              }
              return [
                ...prev,
                {
                  id: `msg_${Date.now()}_ai`,
                  senderId: "self-agent",
                  senderName: "Self Agent",
                  type: "text" as MessageType,
                  content: response,
                  timestamp: Date.now(),
                  status: "read" as MessageStatus,
                },
              ];
            });
          }
        } catch (streamErr) {
          // Fallback to non-streaming
          const resp = await generateChat({ userId, history });
          response = resp.text;
          setMessages((prev) => [
            ...prev,
            {
              id: `msg_${Date.now()}_ai`,
              senderId: "self-agent",
              senderName: "Self Agent",
              type: "text",
              content: response,
              timestamp: Date.now(),
              status: "read",
            },
          ]);
        }
      } catch (error: any) {
        toast.error(`AI response failed: ${error.message}`);
      } finally {
        setIsTyping(false);
        setLoading(false);
      }
    } else {
      // Simulate message sent status update
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMsg.id ? { ...m, status: "delivered" as MessageStatus } : m
          )
        );
      }, 1000);
    }
  };

  // Handle file attachment
  const handleFileAttach = (type: "file" | "image" | "video" | "library") => {
    if (type === "library") {
      setShowPhotoPicker(true);
      return;
    }
    if (type === "file") fileInputRef.current?.click();
    if (type === "image") imageInputRef.current?.click();
    if (type === "video") videoInputRef.current?.click();
  };

  // Handle photo library selection
  const handlePhotoLibrarySelect = (assets: PhotoAsset[]) => {
    assets.forEach((asset) => {
      const msg: Message = {
        id: `msg_${Date.now()}_${Math.random()}`,
        senderId: user?.id || "current-user",
        senderName: user?.name || "You",
        type: asset.type === "video" ? "video" : "image",
        content: `Sent a ${asset.type}`,
        timestamp: Date.now(),
        status: "sent",
        fileName: asset.filename,
        fileUrl: asset.uri,
        thumbnail: asset.thumbnail,
        duration: asset.duration,
      };
      setMessages((prev) => [...prev, msg]);
    });
    toast.success(`已发送 ${assets.length} 个文件`);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: MessageType) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const msg: Message = {
      id: `msg_${Date.now()}`,
      senderId: user?.id || "current-user",
      senderName: user?.name || "You",
      type,
      content: `Sent a ${type}`,
      timestamp: Date.now(),
      status: "sent",
      fileName: file.name,
      fileSize: file.size,
      fileUrl: URL.createObjectURL(file),
    };

    setMessages((prev) => [...prev, msg]);
    toast.success(`${type} sent successfully`);
  };

  // Handle voice recording
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      clearInterval(recordingInterval.current!);
      setIsRecording(false);

      const msg: Message = {
        id: `msg_${Date.now()}`,
        senderId: user?.id || "current-user",
        senderName: user?.name || "You",
        type: "voice",
        content: "Voice message",
        timestamp: Date.now(),
        status: "sent",
        duration: recordingTime,
      };

      setMessages((prev) => [...prev, msg]);
      setRecordingTime(0);
      toast.success("Voice message sent");
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingTime(0);
      recordingInterval.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      toast.info("Recording...");
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Render message status icon
  const renderStatusIcon = (status?: MessageStatus) => {
    switch (status) {
      case "sending":
        return <Clock className="h-3 w-3 text-gray-400" />;
      case "sent":
        return <Check className="h-3 w-3 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  // Render message bubble
  const renderMessage = (msg: Message, index: number) => {
    const isOwn = msg.senderId === user?.id || msg.senderId === "current-user";
    const showAvatar = !isOwn && (index === messages.length - 1 || messages[index + 1]?.senderId !== msg.senderId);

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={`flex gap-2 mb-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar */}
        {showAvatar && !isOwn ? (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback 
              className={
                msg.senderId === "self-agent"
                  ? "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white text-lg"
                  : "bg-gradient-to-br from-purple-400 to-pink-400 text-white text-lg"
              }
            >
              {msg.senderId === "self-agent" ? getAvatarEmoji("self") : getAvatarEmoji(chatId || "1")}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 flex-shrink-0" />
        )}

        {/* Message Bubble */}
        <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
          {msg.type === "text" && (
            <div
              className={`rounded-2xl px-4 py-2 ${
                isOwn
                  ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
          )}

          {msg.type === "image" && (
            <div className="rounded-2xl overflow-hidden">
              <img
                src={msg.fileUrl}
                alt={msg.fileName}
                className="max-w-full h-auto max-h-80 object-cover"
              />
            </div>
          )}

          {msg.type === "video" && (
            <div className="rounded-2xl overflow-hidden bg-black">
              <video src={msg.fileUrl} controls className="max-w-full h-auto max-h-80" />
            </div>
          )}

          {msg.type === "file" && (
            <div
              className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${
                isOwn ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-gray-100"
              }`}
            >
              <div className={`p-2 rounded-lg ${isOwn ? "bg-white/20" : "bg-gray-200"}`}>
                <FileText className={`h-5 w-5 ${isOwn ? "text-white" : "text-gray-600"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isOwn ? "text-white" : "text-gray-900"}`}>
                  {msg.fileName}
                </p>
                <p className={`text-xs ${isOwn ? "text-white/70" : "text-gray-500"}`}>
                  {msg.fileSize ? formatFileSize(msg.fileSize) : "Unknown size"}
                </p>
              </div>
              <Download className={`h-4 w-4 flex-shrink-0 ${isOwn ? "text-white" : "text-gray-600"}`} />
            </div>
          )}

          {msg.type === "voice" && (
            <div
              className={`rounded-2xl px-4 py-3 flex items-center gap-3 min-w-[200px] ${
                isOwn ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-gray-100"
              }`}
            >
              <div className={`p-2 rounded-full ${isOwn ? "bg-white/20" : "bg-gray-200"}`}>
                <Mic className={`h-4 w-4 ${isOwn ? "text-white" : "text-gray-600"}`} />
              </div>
              <div className="flex-1">
                <div className="h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full" />
              </div>
              <span className={`text-xs ${isOwn ? "text-white/70" : "text-gray-500"}`}>
                {msg.duration ? `${msg.duration}s` : "0:00"}
              </span>
            </div>
          )}

          {/* Timestamp & Status */}
          <div className="flex items-center gap-1 mt-1 px-1">
            <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
            {isOwn && renderStatusIcon(msg.status)}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 pb-16">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 backdrop-blur-xl bg-white/90 border-b border-gray-200/50 z-30"
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate("/chat")}
              className="hover:bg-gray-100/80"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <Avatar className="h-10 w-10">
              <AvatarImage src={chatInfo.avatar} />
              <AvatarFallback 
                className={
                  chatInfo.type === "ai"
                    ? "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white text-2xl"
                    : "bg-gradient-to-br from-purple-400 to-pink-400 text-white text-2xl"
                }
              >
                {getAvatarEmoji(chatInfo.id)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className={
                  chatInfo.type === "ai"
                    ? "font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                    : "font-semibold text-gray-900"
                }>
                  {chatInfo.name}
                </h2>
                {chatInfo.type === "ai" && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full font-medium">
                    AI
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {isTyping
                  ? "typing..."
                  : chatInfo.isOnline
                  ? "online"
                  : `last seen ${chatInfo.lastSeen ? formatTime(chatInfo.lastSeen) : "recently"}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="hover:bg-gray-100/80">
              <Phone className="h-5 w-5 text-gray-600" />
            </Button>
            <Button size="icon" variant="ghost" className="hover:bg-gray-100/80">
              <Video className="h-5 w-5 text-gray-600" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="hover:bg-gray-100/80">
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>View Contact</DropdownMenuItem>
                <DropdownMenuItem>Media, Links, Docs</DropdownMenuItem>
                <DropdownMenuItem>Search</DropdownMenuItem>
                <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">Clear Chat</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
              chatInfo.type === "ai" 
                ? "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
                : "bg-gradient-to-br from-purple-400 to-pink-400"
            }`}>
              <span className="text-4xl">{getAvatarEmoji(chatInfo.id)}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {chatInfo.type === "ai" ? "开始与你的 AI 对话" : "开始对话"}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
              {chatInfo.type === "ai" 
                ? "我是基于你的记忆数据训练的 AI，可以模拟你的思考and行为方式"
                : `发送消息开始与 ${chatInfo.name} 聊天`
              }
            </p>
          </motion.div>
        ) : (
          messages.map((msg, index) => renderMessage(msg, index))
        )}

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-2 mb-2"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback 
                  className={
                    chatInfo.type === "ai"
                      ? "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white text-lg"
                      : "bg-gradient-to-br from-purple-400 to-pink-400 text-white text-lg"
                  }
                >
                  {getAvatarEmoji(chatInfo.id)}
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 backdrop-blur-xl bg-white/90 border-t border-gray-200/50 px-4 py-3 z-30">
        <div className="flex items-end gap-2">
          {/* Attachment Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="hover:bg-gray-100/80 flex-shrink-0"
              >
                <Paperclip className="h-5 w-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => handleFileAttach("library")}>
                <ImageIcon className="h-4 w-4 mr-2" />
                📷 从相册选择
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleFileAttach("file")}>
                <FileText className="h-4 w-4 mr-2" />
                Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFileAttach("image")}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Photo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFileAttach("video")}>
                <Film className="h-4 w-4 mr-2" />
                Video
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            aria-label="Upload file"
            onChange={(e) => handleFileSelect(e, "file")}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="Upload image"
            onChange={(e) => handleFileSelect(e, "image")}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            aria-label="Upload video"
            onChange={(e) => handleFileSelect(e, "video")}
          />

          {/* Text Input */}
          <div className="flex-1 relative">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message..."
              className="w-full pr-12 rounded-full bg-gray-100 border-0 focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={loading}
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
            >
              <Smile className="h-5 w-5 text-gray-400" />
            </Button>
          </div>

          {/* Send/Voice Button */}
          {inputText.trim() ? (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={loading}
              className="bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex-shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={toggleRecording}
              className={`flex-shrink-0 ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 animate-pulse"
                  : "bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              }`}
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Recording Timer */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 flex items-center justify-center gap-2 text-sm text-red-500"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Recording: {recordingTime}s
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Photo Picker Modal */}
      <PhotoPicker
        isOpen={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        onSelect={handlePhotoLibrarySelect}
        maxCount={10}
        allowVideo={true}
        allowMultiple={true}
      />
    </div>
  );
}
