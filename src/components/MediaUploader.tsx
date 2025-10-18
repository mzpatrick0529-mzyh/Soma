/**
 * Advanced Media Uploader - Support images, videos, files, voice
 * Instagram + WhatsApp inspired
 */
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Image, Video, File, Mic, X, Upload, Camera,
  Loader2, Check, AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cardAppear, buttonPress } from "@/lib/animations";
import { designTokens } from "@/lib/design-system";
import { toast } from "sonner";

export type MediaType = "image" | "video" | "file" | "audio";

export interface MediaFile {
  id: string;
  type: MediaType;
  file: File;
  preview?: string;
  uploadProgress?: number;
  status: "pending" | "uploading" | "success" | "error";
}

interface MediaUploaderProps {
  onFilesSelected: (files: MediaFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: MediaType[];
  className?: string;
}

export function MediaUploader({
  onFilesSelected,
  maxFiles = 10,
  maxSizeMB = 50,
  acceptedTypes = ["image", "video", "file", "audio"],
  className = "",
}: MediaUploaderProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptString = () => {
    const typeMap: Record<MediaType, string> = {
      image: "image/*",
      video: "video/*",
      file: ".pdf,.doc,.docx,.txt,.zip",
      audio: "audio/*",
    };
    return acceptedTypes.map(t => typeMap[t]).join(",");
  };

  const validateFile = (file: File): MediaType | null => {
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > maxSizeMB) {
      toast.error(`文件 ${file.name} 超过大小限制 ${maxSizeMB}MB`);
      return null;
    }

    if (file.type.startsWith("image/") && acceptedTypes.includes("image")) return "image";
    if (file.type.startsWith("video/") && acceptedTypes.includes("video")) return "video";
    if (file.type.startsWith("audio/") && acceptedTypes.includes("audio")) return "audio";
    if (acceptedTypes.includes("file")) return "file";

    toast.error(`不支持的文件类型: ${file.type}`);
    return null;
  };

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    
    const newFiles: MediaFile[] = [];
    Array.from(fileList).forEach((file, idx) => {
      if (files.length + newFiles.length >= maxFiles) {
        toast.warning(`最多只能上传 ${maxFiles} 个文件`);
        return;
      }

      const type = validateFile(file);
      if (!type) return;

      const mediaFile: MediaFile = {
        id: `${Date.now()}-${idx}`,
        type,
        file,
        status: "pending",
        uploadProgress: 0,
      };

      // Generate preview for images/videos
      if (type === "image" || type === "video") {
        const reader = new FileReader();
        reader.onload = (e) => {
          mediaFile.preview = e.target?.result as string;
          setFiles(prev => prev.map(f => f.id === mediaFile.id ? { ...f, preview: mediaFile.preview } : f));
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(mediaFile);
    });

    if (newFiles.length > 0) {
      const updated = [...files, ...newFiles];
      setFiles(updated);
      onFilesSelected(updated);
    }
  }, [files, maxFiles, onFilesSelected]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    const updated = files.filter(f => f.id !== id);
    setFiles(updated);
    onFilesSelected(updated);
  };

  const getIcon = (type: MediaType) => {
    const iconMap = { image: Image, video: Video, file: File, audio: Mic };
    const Icon = iconMap[type];
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <motion.div
        variants={cardAppear}
        initial="hidden"
        animate="visible"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center transition-all
          ${isDragging 
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
            : "border-gray-300 dark:border-gray-700 hover:border-gray-400"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={getAcceptString()}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">拖拽文件到此处</h3>
        <p className="text-sm text-gray-500 mb-4">或点击按钮选择文件</p>
        
        <div className="flex gap-2 justify-center flex-wrap">
          <motion.div variants={buttonPress} whileTap="tap" whileHover="hover">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Image className="h-4 w-4" />
              图片
            </Button>
          </motion.div>
          <motion.div variants={buttonPress} whileTap="tap" whileHover="hover">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Video className="h-4 w-4" />
              视频
            </Button>
          </motion.div>
          <motion.div variants={buttonPress} whileTap="tap" whileHover="hover">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <File className="h-4 w-4" />
              文件
            </Button>
          </motion.div>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          支持最大 {maxSizeMB}MB, 最多 {maxFiles} 个文件
        </p>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file) => (
              <motion.div
                key={file.id}
                variants={cardAppear}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border"
              >
                {/* Preview/Icon */}
                <div className="flex-shrink-0">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      {getIcon(file.type)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {file.status === "uploading" && file.uploadProgress !== undefined && (
                    <Progress value={file.uploadProgress} className="h-1 mt-2" />
                  )}
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                  {file.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                  {file.status === "success" && <Check className="h-4 w-4 text-green-500" />}
                  {file.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {file.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
