import { useState, useCallback } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
}

export const usePullToRefresh = ({ onRefresh, enabled = true }: UsePullToRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!enabled || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, enabled, isRefreshing]);

  return {
    isRefreshing,
    handleRefresh,
  };
};