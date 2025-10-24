import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number;
}

interface AppState extends LoadingState {
  // 网络状态
  isOnline: boolean;
  
  // 错误状态
  error: string | null;
  
  // Notifications状态
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message?: string;
    timestamp: number;
    read: boolean;
  }>;
}

interface AppActions {
  // 加载状态管理
  setLoading: (loading: boolean, message?: string, progress?: number) => void;
  clearLoading: () => void;
  
  // 网络状态管理
  setOnlineStatus: (online: boolean) => void;
  
  // 错误管理
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Notifications管理
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      isLoading: false,
      loadingMessage: undefined,
      progress: undefined,
      isOnline: navigator.onLine,
      error: null,
      notifications: [],

      // 加载状态管理
      setLoading: (loading: boolean, message?: string, progress?: number) => {
        set({ 
          isLoading: loading, 
          loadingMessage: loading ? message : undefined,
          progress: loading ? progress : undefined,
        });
      },

      clearLoading: () => {
        set({ isLoading: false, loadingMessage: undefined, progress: undefined });
      },

      // 网络状态管理
      setOnlineStatus: (online: boolean) => {
        set({ isOnline: online });
        
        // 网络状态变化时添加Notifications
        if (!online) {
          get().addNotification({
            type: 'warning',
            title: '网络连接已断开',
            message: '请检查您的网络连接',
          });
        } else {
          get().addNotification({
            type: 'success',
            title: '网络连接已恢复',
          });
        }
      },

      // 错误管理
      setError: (error: string | null) => {
        set({ error });
        
        if (error) {
          get().addNotification({
            type: 'error',
            title: '操作失败',
            message: error,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // Notifications管理
      addNotification: (notification) => {
        const newNotification = {
          ...notification,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          read: false,
        };

        set(state => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // 最多保留50条Notifications
        }));

        // Auto移除非错误Notifications（5秒后）
        if (notification.type !== 'error') {
          setTimeout(() => {
            get().removeNotification(newNotification.id);
          }, 5000);
        }
      },

      markNotificationRead: (id: string) => {
        set(state => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      removeNotification: (id: string) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }));
      },

      clearAllNotifications: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: 'app-store',
    }
  )
);

// 清理网络监听（可在应用卸载时调用）
export const cleanupNetworkListeners = () => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  }
};

// 监听网络状态变化
const handleOnline = () => useAppStore.getState().setOnlineStatus(true);
const handleOffline = () => useAppStore.getState().setOnlineStatus(false);

if (typeof window !== 'undefined') {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}

// 便捷的Hook用于获取特定状态
export const useLoading = () => {
  const { isLoading, loadingMessage, progress, setLoading, clearLoading } = useAppStore();
  return { isLoading, loadingMessage, progress, setLoading, clearLoading };
};

export const useNetworkStatus = () => {
  const { isOnline, setOnlineStatus } = useAppStore();
  return { isOnline, setOnlineStatus };
};

export const useAppError = () => {
  const { error, setError, clearError } = useAppStore();
  return { error, setError, clearError };
};

export const useNotifications = () => {
  const { 
    notifications, 
    addNotification, 
    markNotificationRead, 
    removeNotification, 
    clearAllNotifications 
  } = useAppStore();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return { 
    notifications, 
    unreadCount,
    addNotification, 
    markNotificationRead, 
    removeNotification, 
    clearAllNotifications 
  };
};