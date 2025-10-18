// API配置和基础请求函数
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

interface ApiError {
  message: string;
  status: number;
  code?: string;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('auth-storage');
    if (token) {
      try {
        const authData = JSON.parse(token);
        if (authData.state?.token) {
          return { Authorization: `Bearer ${authData.state.token}` };
        }
      } catch (error) {
        console.warn('Invalid auth token in localStorage');
      }
    }
    return {};
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      ...this.defaultHeaders,
      ...this.getAuthHeader(),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          code: errorData.code,
        };
        throw error;
      }

      const responseData = await response.json();
      
      // 适配后端返回的 {success, data} 格式
      if (responseData.success && responseData.data !== undefined) {
        return responseData.data as T;
      }
      
      // 兼容直接返回 data 的旧格式
      if (responseData.data !== undefined) {
        return responseData.data as T;
      }
      
      // 兼容直接返回对象的格式（如某些端点直接返回数据）
      return responseData as T;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          // 网络错误时不使用mock，直接抛出错误让用户知道连接问题
          throw new Error('无法连接到服务器，请检查网络连接或后端服务是否运行');
        }
      }
      
      // 重新抛出API错误
      throw error;
    }
  }

  // 模拟数据fallback
  private getMockData<T>(endpoint: string, method: string): T {
    console.log(`[MOCK API] ${method} ${endpoint}`);
    
    // 根据endpoint返回模拟数据
    if (endpoint.includes('/auth/login')) {
      return {
        user: {
          id: "mock-user-1",
          name: "测试用户",
          email: "test@example.com",
          avatar: "https://i.pravatar.cc/150?img=1",
          bio: "这是一个测试用户账户",
          joinDate: new Date().toISOString(),
        },
        token: "mock-jwt-token-" + Date.now(),
      } as T;
    }

    if (endpoint.includes('/auth/register')) {
      return {
        user: {
          id: "mock-user-" + Date.now(),
          name: "新用户",
          email: "newuser@example.com",
          avatar: "https://i.pravatar.cc/150?img=2",
          bio: "",
          joinDate: new Date().toISOString(),
        },
        token: "mock-jwt-token-" + Date.now(),
      } as T;
    }

    if (endpoint.includes('/memories')) {
      return [
        {
          id: "1",
          user: { name: "Alice Chen", avatar: "https://i.pravatar.cc/150?img=3" },
          content: "刚刚发现了一个很棒的AI工具，效率提升了很多！🚀",
          image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80",
          timestamp: "2小时前",
          likes: 24,
          comments: 5,
          shares: 3,
          isLiked: false,
          isBookmarked: true,
        },
        {
          id: "2", 
          user: { name: "Bob Wang", avatar: "https://i.pravatar.cc/150?img=4" },
          content: "今天的咖啡特别香醇，完美的工作开始 ☕",
          timestamp: "昨天",
          likes: 18,
          comments: 3,
          shares: 1,
          isLiked: true,
          isBookmarked: false,
        },
      ] as T;
    }

    return {} as T;
  }

  // HTTP方法
  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // 文件上传
  async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, string>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeader(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data: ApiResponse<T> = await response.json();
      return data.data;
    } catch (error) {
      // 模拟文件上传
      console.warn('File upload failed, using mock response:', error);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        url: `https://api.synapse-weave.com/uploads/${Date.now()}-${file.name}`,
        filename: file.name,
        size: file.size,
      } as T;
    }
  }
}

// 创建API客户端实例
export const apiClient = new ApiClient(API_BASE_URL);

// 错误处理工具
export const handleApiError = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const apiError = error as ApiError;
    
    // 根据错误状态码显示不同消息
    switch (apiError.status) {
      case 401:
        toast.error('登录已过期，请重新登录');
        // 清除本地存储的认证信息
        localStorage.removeItem('auth-storage');
        window.location.href = '/auth';
        break;
      case 403:
        toast.error('没有权限执行此操作');
        break;
      case 404:
        toast.error('请求的资源不存在');
        break;
      case 429:
        toast.error('请求过于频繁，请稍后再试');
        break;
      case 500:
        toast.error('服务器内部错误，请稍后重试');
        break;
      default:
        toast.error(apiError.message || '操作失败，请重试');
    }
    
    return apiError;
  }
  
  const unknownError = { message: '未知错误', status: 0 };
  toast.error('发生未知错误，请重试');
  return unknownError;
};

// API端点常量
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  
  // 内容相关
  CONTENT: {
    MEMORIES: '/memories',
    CREATE: '/memories',
    LIKE: '/memories/:id/like',
    UNLIKE: '/memories/:id/unlike',
    COMMENTS: '/memories/:id/comments',
    SHARE: '/memories/:id/share',
  },
  
  // 用户相关
  USER: {
    PROFILE: '/user/profile',
    UPDATE: '/user/profile',
    AVATAR: '/user/avatar',
    SETTINGS: '/user/settings',
  },
  
  // 文件上传
  UPLOAD: {
    IMAGE: '/upload/image',
    VIDEO: '/upload/video',
    FILE: '/upload/file',
  },
  
  // 社交功能
  SOCIAL: {
    FOLLOW: '/social/follow',
    UNFOLLOW: '/social/unfollow',
    FOLLOWERS: '/social/followers',
    FOLLOWING: '/social/following',
    NOTIFICATIONS: '/social/notifications',
  },
};

export default apiClient;