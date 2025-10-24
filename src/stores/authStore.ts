import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService, type LoginData, type RegisterData, type User as ApiUser, type AuthResponse } from '@/services/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  joinDate?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (data: LoginData) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (data: LoginData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.login(data);
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          return response;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Login失败",
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.register(data);
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          return response;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Sign Up失败",
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.warn('Logout API call failed:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
          localStorage.removeItem('auth-storage');
        }
      },

      clearError: () => {
        set({ error: null });
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates };
          set({ user: updatedUser });
          
          // Save到localStorage
          const persistData = {
            user: updatedUser,
            token: get().token,
            isAuthenticated: get().isAuthenticated,
          };
          localStorage.setItem('auth-storage', JSON.stringify({ state: persistData }));
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);