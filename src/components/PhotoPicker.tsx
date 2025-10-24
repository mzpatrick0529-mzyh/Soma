/**
 * 📷 Photo Picker Component - 相册选择器组件
 * 提供用户友好的照片/视频选择界面
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image, Video, Camera, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  pickMultiplePhotos,
  pickMediaAssets,
  capturePhoto,
  captureVideo,
  requestPhotoLibraryPermission,
  getPhotoLibraryPermissionMessage,
  PhotoAsset,
} from "@/lib/photoLibrary";
import { toast } from "sonner";

interface PhotoPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assets: PhotoAsset[]) => void;
  maxCount?: number;
  allowVideo?: boolean;
  allowMultiple?: boolean;
}

export const PhotoPicker = ({
  isOpen,
  onClose,
  onSelect,
  maxCount = 10,
  allowVideo = true,
  allowMultiple = true,
}: PhotoPickerProps) => {
  const [selectedAssets, setSelectedAssets] = useState<PhotoAsset[]>([]);
  const [loading, setLoading] = useState(false);

  // 选择照片
  const handlePickPhotos = async () => {
    setLoading(true);
    try {
      const hasPermission = await requestPhotoLibraryPermission();
      if (!hasPermission) {
        toast.error(getPhotoLibraryPermissionMessage());
        setLoading(false);
        return;
      }

      const assets = allowMultiple
        ? await pickMultiplePhotos(maxCount)
        : await pickMediaAssets({ type: "photo", multiple: false });

      if (assets.length > 0) {
        setSelectedAssets(assets);
        toast.success(`Selected ${assets.length} 张照片`);
      }
    } catch (error: any) {
      toast.error(`选择照片失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 选择视频
  const handlePickVideos = async () => {
    setLoading(true);
    try {
      const hasPermission = await requestPhotoLibraryPermission();
      if (!hasPermission) {
        toast.error(getPhotoLibraryPermissionMessage());
        setLoading(false);
        return;
      }

      const assets = await pickMediaAssets({
        type: "video",
        multiple: allowMultiple,
        maxCount,
      });

      if (assets.length > 0) {
        setSelectedAssets(assets);
        toast.success(`Selected ${assets.length} 个视频`);
      }
    } catch (error: any) {
      toast.error(`选择视频失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 拍照
  const handleTakePhoto = async () => {
    setLoading(true);
    try {
      const asset = await capturePhoto();
      if (asset) {
        setSelectedAssets([asset]);
        toast.success("照片已拍摄");
      }
    } catch (error: any) {
      toast.error(`拍照失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 录制视频
  const handleRecordVideo = async () => {
    setLoading(true);
    try {
      const asset = await captureVideo();
      if (asset) {
        setSelectedAssets([asset]);
        toast.success("视频已录制");
      }
    } catch (error: any) {
      toast.error(`录制失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 确认选择
  const handleConfirm = () => {
    if (selectedAssets.length === 0) {
      toast.warning("请先选择照片或视频");
      return;
    }
    onSelect(selectedAssets);
    setSelectedAssets([]);
    onClose();
  };

  // Cancel
  const handleCancel = () => {
    setSelectedAssets([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <Card className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  选择媒体
                </h3>
                <Button size="icon" variant="ghost" onClick={handleCancel}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Options */}
                <div className="grid grid-cols-2 gap-3">
                  {/* 从相册选择照片 */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePickPhotos}
                    disabled={loading}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all duration-200 disabled:opacity-50"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Image className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      相册照片
                    </span>
                  </motion.button>

                  {/* 拍照 */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleTakePhoto}
                    disabled={loading}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 disabled:opacity-50"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      拍照
                    </span>
                  </motion.button>

                  {allowVideo && (
                    <>
                      {/* 从相册选择视频 */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePickVideos}
                        disabled={loading}
                        className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 transition-all duration-200 disabled:opacity-50"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                          <Video className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          相册视频
                        </span>
                      </motion.button>

                      {/* 录制视频 */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRecordVideo}
                        disabled={loading}
                        className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 transition-all duration-200 disabled:opacity-50"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          录制视频
                        </span>
                      </motion.button>
                    </>
                  )}
                </div>

                {/* Selected Assets Preview */}
                {selectedAssets.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Selected {selectedAssets.length} 项
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedAssets.map((asset) => (
                        <div
                          key={asset.id}
                          className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                        >
                          {asset.type === "image" ? (
                            <img
                              src={asset.uri}
                              alt={asset.filename}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={asset.uri}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirm Button */}
                {selectedAssets.length > 0 && (
                  <Button
                    onClick={handleConfirm}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    确认选择 ({selectedAssets.length})
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
