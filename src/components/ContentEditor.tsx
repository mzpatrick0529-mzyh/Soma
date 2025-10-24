import { useState, useRef, useCallback } from "react";
import type React from "react";
import { Image, Video, FileText, Smile, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";

interface MediaFile {
  id: string;
  type: "image" | "video" | "document";
  file: File;
  preview?: string;
  uploading?: boolean;
  error?: string;
}

interface ContentEditorProps {
  onSubmit: (content: {
    text: string;
    media: MediaFile[];
    tags?: string[];
  }) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  maxLength?: number;
  allowMedia?: boolean;
  className?: string;
}

export const ContentEditor = ({
  onSubmit,
  onCancel,
  placeholder = "分享你的想法...",
  maxLength = 500,
  allowMedia = true,
  className,
}: ContentEditorProps) => {
  const [text, setText] = useState("");
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto调整文本区域高度
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  const handleTextChange = (value: string) => {
    if (value.length <= maxLength) {
      setText(value);
      adjustTextareaHeight();
      
      // Auto提取标签
      const hashtagRegex = /#[\w\u4e00-\u9fa5]+/g;
      const extractedTags = value.match(hashtagRegex) || [];
      setTags(extractedTags.map(tag => tag.slice(1))); // 移除 # 号
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const list = event.target?.files;
    const files: File[] = list ? Array.from(list) : [];
    
  files.forEach((file: File) => {
      const id = Date.now() + Math.random().toString();
      let type: MediaFile["type"] = "document";
      
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type.startsWith("video/")) type = "video";
      
      const newMedia: MediaFile = {
        id,
        type,
        file,
        uploading: true,
      };

      // 为图片and视频生成预览
      if (type === "image" || type === "video") {
        const reader = new FileReader();
        reader.onload = (e) => {
          setMedia(prev => prev.map(item => 
            item.id === id 
              ? { ...item, preview: (e.target?.result as string) || undefined, uploading: false }
              : item
          ));
        };
        reader.readAsDataURL(file);
      } else {
        newMedia.uploading = false;
      }

      setMedia(prev => [...prev, newMedia]);
    });

    // 重置文件输入
    if (event.target) {
      event.target.value = "";
    }
  };

  const removeMedia = (id: string) => {
    haptic.light();
    setMedia(prev => prev.filter(item => item.id !== id));
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = text.slice(0, start) + emoji + text.slice(end);
      
      if (newText.length <= maxLength) {
        setText(newText);
        
        // 恢复光标位置
        setTimeout(() => {
          textarea.setSelectionRange(start + emoji.length, start + emoji.length);
          textarea.focus();
        }, 0);
      }
    }
    setShowEmojiPicker(false);
  };

  const handleSubmit = async () => {
    if (!text.trim() && media.length === 0) return;
    
    haptic.medium();
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        text: text.trim(),
        media,
        tags: tags.length > 0 ? tags : undefined,
      });
      
      // 重置表单
      setText("");
      setMedia([]);
      setTags([]);
      haptic.success();
    } catch (error) {
      haptic.error();
      console.error("Submit failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = (text.trim().length > 0 || media.length > 0) && !isSubmitting;

  // 常用表情
  const commonEmojis = ["😊", "😂", "❤️", "👍", "🎉", "🔥", "💯", "🚀", "✨", "🌟"];

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      {/* 文本输入区 */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[100px] resize-none border-0 p-0 text-base placeholder:text-muted-foreground focus-visible:ring-0"
          onInput={adjustTextareaHeight}
        />
        
        {/* 字数统计 */}
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          {text.length}/{maxLength}
        </div>
      </div>

      {/* 媒体预览 */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {media.map((item) => (
            <div key={item.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                {item.type === "image" && item.preview && (
                  <img
                    src={item.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
                {item.type === "video" && item.preview && (
                  <video
                    src={item.preview}
                    className="w-full h-full object-cover"
                    muted
                  />
                )}
                {item.type === "document" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs text-center mt-2 px-2">
                      {item.file.name}
                    </span>
                  </div>
                )}
                
                {item.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeMedia(item.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 标签显示 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* 表情选择器 */}
      {showEmojiPicker && (
        <div className="p-3 border rounded-lg bg-background">
          <div className="grid grid-cols-5 gap-2">
            {commonEmojis.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => insertEmoji(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 工具栏 */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2">
          {allowMedia && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="h-9 w-9"
              >
                <Image className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={isSubmitting}
                className="h-9 w-9"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="min-w-[80px]"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                发布
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </Card>
  );
};