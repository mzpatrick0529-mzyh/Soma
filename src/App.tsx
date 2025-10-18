import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GlobalLoading } from "./components/GlobalLoading";
import { NotificationCenter, NetworkStatus } from "./components/NotificationCenter";
import Memories from "./pages/MemoriesOptimized";
import Chat from "./pages/Chat";
import ChatRoom from "./pages/ChatRoom";
import Feed from "./pages/FeedNew";
import Marketplace from "./pages/MarketplaceNew";
import Settings from "./pages/SettingsNew";
import { AuthPage } from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import ProviderDiagnostics from "./pages/ProviderDiagnostics";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <GlobalLoading />
        <NotificationCenter />
        <NetworkStatus />
        <BrowserRouter>
        <Routes>
          {/* 公开路由 - 登录页 */}
          <Route 
            path="/auth" 
            element={
              <ProtectedRoute requireAuth={false}>
                <AuthPage />
              </ProtectedRoute>
            } 
          />
          
          {/* 受保护的路由 */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute requireAuth={true}>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Memories />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/chat/:chatId" element={<ChatRoom />} />
                    <Route path="/feed" element={<Feed />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/settings/provider" element={<ProviderDiagnostics />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } 
          />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
