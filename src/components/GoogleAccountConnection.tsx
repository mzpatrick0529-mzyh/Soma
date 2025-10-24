import React, { useState, useEffect } from "react";
import { Mail, Calendar, Database, Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useToast } from "@/hooks/use-toast";

interface GoogleConnectionStatus {
  connected: boolean;
  email?: string;
  name?: string;
  connectedAt?: number;
  lastSyncAt?: number;
  syncStatus?: "idle" | "syncing" | "completed" | "error";
  syncError?: string;
}

interface GoogleAccountConnectionProps {
  userId: string;
}

export function GoogleAccountConnection({ userId }: GoogleAccountConnectionProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<GoogleConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // 加载连接状态
  const loadStatus = async () => {
    try {
      const response = await fetch(
        `http://localhost:8787/api/google-sync/status?userId=${encodeURIComponent(userId)}`
      );

      if (!response.ok) {
        throw new Error("Failed to load connection status");
      }

      const data = await response.json();
      setStatus(data);
    } catch (error: any) {
      console.error("Failed to load Google connection status:", error);
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  // 连接 Google Account
  const handleConnect = async () => {
    try {
      const response = await fetch(
        `http://localhost:8787/api/google-sync/auth-url?userId=${encodeURIComponent(userId)}`
      );

      if (!response.ok) {
        throw new Error("Failed to get auth URL");
      }

      const data = await response.json();
      
      // 跳转到 Google 授权页面
      window.location.href = data.authUrl;
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message || "无法连接到 Google Account",
        variant: "destructive",
      });
    }
  };

  // 断开连接
  const handleDisconnect = async () => {
    const confirmed = window.confirm(
      "确定要断开 Google Account连接吗？\n\n已同步的数据不会被删除，但将停止Auto同步。"
    );

    if (!confirmed) return;

    setDisconnecting(true);
    try {
      const response = await fetch(
        "http://localhost:8787/api/google-sync/revoke",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to revoke connection");
      }

      toast({
        title: "已断开连接",
        description: "Google Account已断开，数据同步已停止",
      });

      await loadStatus();
    } catch (error: any) {
      toast({
        title: "断开失败",
        description: error.message || "无法断开 Google Account连接",
        variant: "destructive",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  // 手动触发同步
  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch(
        "http://localhost:8787/api/google-sync/trigger",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to trigger sync");
      }

      toast({
        title: "同步已启动",
        description: "正在后台同步 Google 数据，请稍候...",
      });

      // 轮询状态更新
      const interval = setInterval(async () => {
        await loadStatus();
        if (status?.syncStatus !== "syncing") {
          clearInterval(interval);
          setSyncing(false);
        }
      }, 3000);

      // 10分钟后停止轮询
      setTimeout(() => {
        clearInterval(interval);
        setSyncing(false);
      }, 600000);
    } catch (error: any) {
      toast({
        title: "同步失败",
        description: error.message || "无法触发数据同步",
        variant: "destructive",
      });
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadStatus();

    // 检查 URL 参数中是否有连接结果
    const params = new URLSearchParams(window.location.search);
    const googleParam = params.get("google");
    const errorMessage = params.get("message");

    if (googleParam === "connected") {
      toast({
        title: "连接成功",
        description: "Google Account已连接，正在进行首次同步...",
      });
      // 清除 URL 参数
      window.history.replaceState({}, "", window.location.pathname);
      loadStatus();
    } else if (googleParam === "error") {
      toast({
        title: "Connection failed",
        description: errorMessage || "Google 授权失败，请Retry",
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Google Account同步
        </CardTitle>
        <CardDescription>
          实时同步 Gmail、Drive、Calendar 等服务的数据到您的记忆库
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!status?.connected ? (
          // 未连接状态
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Database className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium mb-1">支持的服务</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Gmail - 邮件内容同步</li>
                  <li>• Google Drive - 文档同步</li>
                  <li>• Google Calendar - 日程事件同步</li>
                  <li>• Google Photos - 相册元数据同步</li>
                </ul>
              </div>
            </div>

            <Button onClick={handleConnect} className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              连接 Google Account
            </Button>
          </div>
        ) : (
          // 已连接状态
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium">{status.email}</div>
                  {status.name && (
                    <div className="text-sm text-muted-foreground">{status.name}</div>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                已连接
              </Badge>
            </div>

            {/* 同步状态 */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">同步状态</span>
                {status.syncStatus === "syncing" ? (
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    同步中
                  </Badge>
                ) : status.syncStatus === "error" ? (
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    <XCircle className="mr-1 h-3 w-3" />
                    同步失败
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600 border-gray-600">
                    就绪
                  </Badge>
                )}
              </div>

              {status.lastSyncAt && (
                <div className="text-sm text-muted-foreground">
                  最后同步: {new Date(status.lastSyncAt).toLocaleString("zh-CN")}
                </div>
              )}

              {status.syncError && (
                <div className="text-sm text-red-600">
                  错误: {status.syncError}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing || status.syncStatus === "syncing"}
                className="w-full"
              >
                {syncing || status.syncStatus === "syncing" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    同步中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    手动同步
                  </>
                )}
              </Button>
            </div>

            {/* 断开连接按钮 */}
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {disconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  断开中...
                </>
              ) : (
                "断开连接"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
