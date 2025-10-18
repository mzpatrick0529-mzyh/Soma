import { apiClient, handleApiError, API_ENDPOINTS } from '../lib/api';

// 用户认证相关类型
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  joinDate?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// 内容相关类型
export interface Memory {
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

export interface CreateMemoryData {
  content: string;
  image?: File;
  hashtags?: string[];
}

export interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
  parentId?: string;
}

// 认证服务
export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      return await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      return await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post<void>(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      handleApiError(error);
    }
  },

  async refreshToken(): Promise<AuthResponse> {
    try {
      return await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getProfile(): Promise<User> {
    try {
      return await apiClient.get<User>(API_ENDPOINTS.AUTH.PROFILE);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// 内容服务
export const contentService = {
  async getMemories(page = 1, limit = 20): Promise<Memory[]> {
    try {
      return await apiClient.get<Memory[]>(`${API_ENDPOINTS.CONTENT.MEMORIES}?page=${page}&limit=${limit}`);
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  async createMemory(data: CreateMemoryData): Promise<Memory> {
    try {
      const formData = new FormData();
      formData.append('content', data.content);
      
      if (data.image) {
        formData.append('image', data.image);
      }
      
      if (data.hashtags) {
        formData.append('hashtags', JSON.stringify(data.hashtags));
      }

      return await apiClient.post<Memory>(API_ENDPOINTS.CONTENT.CREATE, formData);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async likeMemory(memoryId: string): Promise<{ liked: boolean; count: number }> {
    try {
      return await apiClient.post<{ liked: boolean; count: number }>(
        API_ENDPOINTS.CONTENT.LIKE.replace(':id', memoryId)
      );
    } catch (error) {
      handleApiError(error);
      return { liked: false, count: 0 };
    }
  },

  async unlikeMemory(memoryId: string): Promise<{ liked: boolean; count: number }> {
    try {
      return await apiClient.post<{ liked: boolean; count: number }>(
        API_ENDPOINTS.CONTENT.UNLIKE.replace(':id', memoryId)
      );
    } catch (error) {
      handleApiError(error);
      return { liked: true, count: 0 };
    }
  },

  async getComments(memoryId: string): Promise<Comment[]> {
    try {
      return await apiClient.get<Comment[]>(
        API_ENDPOINTS.CONTENT.COMMENTS.replace(':id', memoryId)
      );
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  async addComment(memoryId: string, content: string, parentId?: string): Promise<Comment> {
    try {
      return await apiClient.post<Comment>(
        API_ENDPOINTS.CONTENT.COMMENTS.replace(':id', memoryId),
        { content, parentId }
      );
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async shareMemory(memoryId: string): Promise<{ shared: boolean; count: number }> {
    try {
      return await apiClient.post<{ shared: boolean; count: number }>(
        API_ENDPOINTS.CONTENT.SHARE.replace(':id', memoryId)
      );
    } catch (error) {
      handleApiError(error);
      return { shared: false, count: 0 };
    }
  },
};

// 用户服务
export const userService = {
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      return await apiClient.put<User>(API_ENDPOINTS.USER.UPDATE, data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async uploadAvatar(file: File): Promise<{ url: string }> {
    try {
      return await apiClient.uploadFile<{ url: string }>(API_ENDPOINTS.UPLOAD.IMAGE, file);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getSettings(): Promise<Record<string, any>> {
    try {
      return await apiClient.get<Record<string, any>>(API_ENDPOINTS.USER.SETTINGS);
    } catch (error) {
      handleApiError(error);
      return {};
    }
  },

  async updateSettings(settings: Record<string, any>): Promise<void> {
    try {
      await apiClient.put<void>(API_ENDPOINTS.USER.SETTINGS, settings);
    } catch (error) {
      handleApiError(error);
    }
  },
};

// 文件上传服务
export const uploadService = {
  async uploadImage(file: File): Promise<{ url: string; filename: string }> {
    try {
      return await apiClient.uploadFile<{ url: string; filename: string }>(
        API_ENDPOINTS.UPLOAD.IMAGE,
        file
      );
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async uploadVideo(file: File): Promise<{ url: string; filename: string }> {
    try {
      return await apiClient.uploadFile<{ url: string; filename: string }>(
        API_ENDPOINTS.UPLOAD.VIDEO,
        file
      );
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// 社交服务
export const socialService = {
  async getNotifications(): Promise<any[]> {
    try {
      return await apiClient.get<any[]>(API_ENDPOINTS.SOCIAL.NOTIFICATIONS);
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  async followUser(userId: string): Promise<{ following: boolean }> {
    try {
      return await apiClient.post<{ following: boolean }>(API_ENDPOINTS.SOCIAL.FOLLOW, { userId });
    } catch (error) {
      handleApiError(error);
      return { following: false };
    }
  },

  async unfollowUser(userId: string): Promise<{ following: boolean }> {
    try {
      return await apiClient.post<{ following: boolean }>(API_ENDPOINTS.SOCIAL.UNFOLLOW, { userId });
    } catch (error) {
      handleApiError(error);
      return { following: true };
    }
  },
};