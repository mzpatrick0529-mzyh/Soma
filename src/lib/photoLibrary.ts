/**
 * 📷 Photo Library Access - iOS/Android 相册权限访问
 * 提供跨平台的相册访问功能
 */

export interface PhotoAsset {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  timestamp: number;
  type: "image" | "video";
  duration?: number; // for videos
  thumbnail?: string;
}

export interface AlbumInfo {
  id: string;
  title: string;
  count: number;
  coverUri?: string;
}

/**
 * 检查是否支持相册访问
 */
export const isPhotoLibrarySupported = (): boolean => {
  // 检查是否在移动端浏览器
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /iphone|ipad|ipod|android/.test(userAgent);
  
  // 检查是否支持 File System Access API 或 Media Capture API
  const hasFileAccess = "showOpenFilePicker" in window;
  const hasMediaCapture = "mediaDevices" in navigator;
  
  return isMobile || hasFileAccess || hasMediaCapture;
};

/**
 * 请求相册访问权限（iOS/Android）
 */
export const requestPhotoLibraryPermission = async (): Promise<boolean> => {
  try {
    // 方法 1: 使用 File System Access API (Chrome 86+, Edge 86+)
    if ("showOpenFilePicker" in window) {
      console.log("✅ File System Access API supported");
      return true;
    }

    // 方法 2: 使用 input[type="file"] 间接访问
    if ("HTMLInputElement" in window) {
      console.log("✅ File input method available");
      return true;
    }

    // 方法 3: PWA 模式下检查权限
    if ("permissions" in navigator) {
      // 注意：目前没有标准的 "photo-library" 权限
      // 但可以检查相关权限
      console.log("✅ Permissions API available");
      return true;
    }

    console.warn("⚠️ No photo library access method available");
    return false;
  } catch (error) {
    console.error("❌ Failed to request photo library permission:", error);
    return false;
  }
};

/**
 * 打开相册选择器（单张图片）
 */
export const pickSinglePhoto = async (): Promise<PhotoAsset | null> => {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const asset = await fileToPhotoAsset(file);
      resolve(asset);
    };
    input.click();
  });
};

/**
 * 打开相册选择器（多张图片）
 */
export const pickMultiplePhotos = async (maxCount: number = 10): Promise<PhotoAsset[]> => {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      const limitedFiles = files.slice(0, maxCount);
      
      const assets = await Promise.all(
        limitedFiles.map((file) => fileToPhotoAsset(file))
      );
      
      resolve(assets.filter((asset): asset is PhotoAsset => asset !== null));
    };
    input.click();
  });
};

/**
 * 打开相册选择器（图片+视频）
 */
export const pickMediaAssets = async (
  options: {
    type?: "photo" | "video" | "all";
    multiple?: boolean;
    maxCount?: number;
  } = {}
): Promise<PhotoAsset[]> => {
  const { type = "all", multiple = false, maxCount = 10 } = options;

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    
    // 设置接受的文件类型
    if (type === "photo") {
      input.accept = "image/*";
    } else if (type === "video") {
      input.accept = "video/*";
    } else {
      input.accept = "image/*,video/*";
    }
    
    input.multiple = multiple;
    
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      const limitedFiles = files.slice(0, maxCount);
      
      const assets = await Promise.all(
        limitedFiles.map((file) => fileToPhotoAsset(file))
      );
      
      resolve(assets.filter((asset): asset is PhotoAsset => asset !== null));
    };
    
    input.click();
  });
};

/**
 * 使用原生相机拍照（如果支持）
 */
export const capturePhoto = async (): Promise<PhotoAsset | null> => {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment" as any; // 使用后置摄像头
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const asset = await fileToPhotoAsset(file);
      resolve(asset);
    };
    
    input.click();
  });
};

/**
 * 使用原生相机录制视频（如果支持）
 */
export const captureVideo = async (): Promise<PhotoAsset | null> => {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.capture = "environment" as any;
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const asset = await fileToPhotoAsset(file);
      resolve(asset);
    };
    
    input.click();
  });
};

/**
 * 将 File 对象转换为 PhotoAsset
 */
const fileToPhotoAsset = async (file: File): Promise<PhotoAsset | null> => {
  try {
    const isVideo = file.type.startsWith("video/");
    const uri = URL.createObjectURL(file);
    
    // 获取图片/视频尺寸
    let width = 0;
    let height = 0;
    let duration: number | undefined;
    
    if (isVideo) {
      const video = document.createElement("video");
      video.preload = "metadata";
      
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          width = video.videoWidth;
          height = video.videoHeight;
          duration = Math.floor(video.duration);
          resolve();
        };
        video.src = uri;
      });
    } else {
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => {
          width = img.width;
          height = img.height;
          resolve();
        };
        img.src = uri;
      });
    }
    
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      uri,
      filename: file.name,
      width,
      height,
      timestamp: file.lastModified || Date.now(),
      type: isVideo ? "video" : "image",
      duration,
      thumbnail: uri, // 简化处理，实际应该生成缩略图
    };
  } catch (error) {
    console.error("Failed to convert file to PhotoAsset:", error);
    return null;
  }
};

/**
 * 获取相册列表（模拟，浏览器限制无法真正列举）
 */
export const getAlbums = async (): Promise<AlbumInfo[]> => {
  // 浏览器环境下无法真正获取相册列表
  // 这里返回模拟数据作为示例
  console.warn("⚠️ Browser cannot enumerate photo albums. Returning mock data.");
  
  return [
    {
      id: "recents",
      title: "Recents",
      count: 0,
    },
    {
      id: "favorites",
      title: "Favorites",
      count: 0,
    },
    {
      id: "screenshots",
      title: "Screenshots",
      count: 0,
    },
  ];
};

/**
 * 获取相册中的照片（模拟）
 */
export const getAlbumPhotos = async (
  albumId: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<PhotoAsset[]> => {
  // 浏览器环境下无法真正获取相册照片
  console.warn("⚠️ Browser cannot access photo album contents.");
  return [];
};

/**
 * 保存照片到相册（通过下载）
 */
export const savePhotoToLibrary = async (uri: string, filename?: string): Promise<boolean> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `photo-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log("✅ Photo saved (downloaded)");
    return true;
  } catch (error) {
    console.error("❌ Failed to save photo:", error);
    return false;
  }
};

/**
 * 检测设备类型
 */
export const getDeviceType = (): "ios" | "android" | "web" => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  }
  
  if (/android/.test(userAgent)) {
    return "android";
  }
  
  return "web";
};

/**
 * 获取相册访问提示文案
 */
export const getPhotoLibraryPermissionMessage = (): string => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case "ios":
      return "需要访问您的照片库。请在 iOS 设置中允许此应用访问照片。";
    case "android":
      return "需要访问您的相册。请在 Android 设置中授予存储权限。";
    default:
      return "点击选择照片或视频。";
  }
};

// 默认导出
export default {
  isPhotoLibrarySupported,
  requestPhotoLibraryPermission,
  pickSinglePhoto,
  pickMultiplePhotos,
  pickMediaAssets,
  capturePhoto,
  captureVideo,
  getAlbums,
  getAlbumPhotos,
  savePhotoToLibrary,
  getDeviceType,
  getPhotoLibraryPermissionMessage,
};
