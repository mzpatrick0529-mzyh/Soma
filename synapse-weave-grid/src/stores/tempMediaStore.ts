/**
 * 临时媒体存储 Store
 * 用于 Memories 界面选择的照片/视频，不保存到数据库
 * 仅在与 Self Agent 对话时可用
 */

import { create } from "zustand";

export interface PhotoAsset {
  uri: string;
  type: "photo" | "video";
  thumbnail?: string;
  duration?: number;
  width?: number;
  height?: number;
}

interface TempMediaState {
  // 临时选中的媒体资产（不持久化）
  tempAssets: PhotoAsset[];
  
  // 添加临时媒体
  addTempAssets: (assets: PhotoAsset[]) => void;
  
  // 移除指定临时媒体
  removeTempAsset: (uri: string) => void;
  
  // 清空所有临时媒体
  clearTempAssets: () => void;
  
  // 获取临时媒体（供 Self Agent 使用）
  getTempAssets: () => PhotoAsset[];
}

export const useTempMediaStore = create<TempMediaState>((set, get) => ({
  tempAssets: [],
  
  addTempAssets: (assets) => {
    set((state) => ({
      tempAssets: [...state.tempAssets, ...assets],
    }));
  },
  
  removeTempAsset: (uri) => {
    set((state) => ({
      tempAssets: state.tempAssets.filter((asset) => asset.uri !== uri),
    }));
  },
  
  clearTempAssets: () => {
    set({ tempAssets: [] });
  },
  
  getTempAssets: () => {
    return get().tempAssets;
  },
}));
