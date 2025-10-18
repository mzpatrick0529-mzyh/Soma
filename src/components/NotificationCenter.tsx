import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNotifications } from "@/stores/appStore";
import { cn } from "@/lib/utils";

const NotificationIcon = ({ type }: { type: 'info' | 'success' | 'warning' | 'error' }) => {
  const icons = {
    info: <Info className="h-5 w-5" />,
    success: <CheckCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
  };

  const colors = {
    info: "text-blue-500",
    success: "text-green-500", 
    warning: "text-yellow-500",
    error: "text-red-500",
  };

  return (
    <div className={cn("flex-shrink-0", colors[type])}>
      {icons[type]}
    </div>
  );
};

export const NotificationCenter = () => {
  const { notifications, removeNotification, markNotificationRead } = useNotifications();

  // 自动标记为已读（当通知显示3秒后）
  useEffect(() => {
    notifications.forEach(notification => {
      if (!notification.read && Date.now() - notification.timestamp > 3000) {
        markNotificationRead(notification.id);
      }
    });
  }, [notifications, markNotificationRead]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.slice(0, 5).map((notification) => {
        const bgColors = {
          info: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
          success: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
          warning: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
          error: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
        };

        return (
          <Card
            key={notification.id}
            className={cn(
              "p-4 shadow-lg border transition-all duration-300 transform",
              bgColors[notification.type],
              notification.read ? "opacity-75" : "opacity-100",
              "animate-in slide-in-from-right-full"
            )}
          >
            <div className="flex items-start gap-3">
              <NotificationIcon type={notification.type} />
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-foreground">
                  {notification.title}
                </h4>
                {notification.message && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTime(notification.timestamp)}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeNotification(notification.id)}
                className="h-6 w-6 p-0 hover:bg-background/50"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        );
      })}
      
      {notifications.length > 5 && (
        <Card className="p-2 text-center bg-muted/50">
          <p className="text-xs text-muted-foreground">
            还有 {notifications.length - 5} 条通知...
          </p>
        </Card>
      )}
    </div>
  );
};

// 网络状态指示器
export const NetworkStatus = () => {
  const isOnline = navigator.onLine;

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Card className="p-3 bg-destructive/10 border-destructive/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          <span className="text-sm text-destructive font-medium">
            网络连接已断开
          </span>
        </div>
      </Card>
    </div>
  );
};

const formatTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
};